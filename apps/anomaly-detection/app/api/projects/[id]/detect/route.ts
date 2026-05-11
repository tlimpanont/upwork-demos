import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUser } from "@/lib/api";
import { findProjectById } from "@/lib/db/repos/projects";
import { findImageById } from "@/lib/db/repos/images";
import {
  ensureModelIndexes,
  findLatestCompletedModel,
  insertModel,
} from "@/lib/db/repos/models";
import {
  completeDetection,
  ensureDetectionIndexes,
  failDetection,
  insertDetection,
  insertPendingDetection,
} from "@/lib/db/repos/detections";
import {
  deleteAiAnnotationsForImage,
  ensureAnnotationIndexes,
  insertAnnotation,
  listReferenceAnomalies,
} from "@/lib/db/repos/annotations";
import { cropToDataUrl } from "@/lib/ai/image-crop";
import {
  completePipelineRun,
  ensurePipelineRunIndexes,
  failPipelineRun,
  insertPipelineRun,
  upsertPipelinePhase,
} from "@/lib/db/repos/pipeline-runs";
import { embedImage } from "@/lib/ai/embeddings";
import { scoreEmbedding } from "@/lib/ai/training";
import {
  deriveBBoxes,
  generateGrid,
  tilesToHeatmap,
} from "@/lib/ai/detection";
import { judgeImageAgainstRule } from "@/lib/ai/vision-judge";
import { dataUrlForKey, orientedImageForKey } from "@/lib/storage/blob";
import type { Detection, Model } from "@/lib/db/schemas";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  imageId: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;
  const project = await findProjectById(id, user.id);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid imageId" }, { status: 400 });
  }
  const image = await findImageById(parsed.data.imageId);
  if (!image || image.projectId !== id) {
    return NextResponse.json({ error: "Image not in project" }, { status: 404 });
  }

  // Pick a model in this priority:
  //   1. Latest trained model.
  //   2. If the project has a detection rule but no model, materialize a
  //      zero-shot Model row on the fly so subsequent detections reuse the
  //      same identity (and dashboards can group runs).
  let model = await findLatestCompletedModel(id);
  if (!model) {
    if (!project.anomalyDescription || !project.anomalyDescription.trim()) {
      return NextResponse.json(
        {
          error:
            "Nothing to detect against. Write a detection rule on the project settings page, or train from annotations.",
        },
        { status: 400 },
      );
    }
    model = await materializeZeroShotModel(id, project.anomalyDescription);
  }

  // Pre-rotate via sharp so the data URL we hand to the vision model is
  // in the same orientation as our stored width/height (browsers bake EXIF
  // into naturalWidth/Height at upload time; sharp doesn't unless asked).
  // Falls back to the raw data URL on failure so detection still runs.
  const oriented = await orientedImageForKey(image.blobKey);
  const imageUrl = oriented?.dataUrl ?? (await dataUrlForKey(image.blobKey));
  if (!imageUrl) {
    return NextResponse.json({ error: "Blob missing" }, { status: 404 });
  }
  // Prefer dimensions derived from the actual rotated bytes; fall back to
  // the DB record if sharp failed. These are the dimensions we'll multiply
  // the model's normalized coords against, so they MUST match the frame
  // the model sees.
  const visionWidth = oriented?.width ?? image.width;
  const visionHeight = oriented?.height ?? image.height;

  await ensureDetectionIndexes();
  await ensurePipelineRunIndexes();

  // Reserve a PipelineRun row for this detection so the Jobs page shows
  // a verbose play-by-play of every call as it happens.
  const run = await insertPipelineRun({
    projectId: id,
    kind: "detection",
    imageId: image._id,
    summary: `Detection · ${image._id.slice(-6)}`,
  });
  await upsertPipelinePhase(run._id, {
    name: "queued",
    label: "Queued",
    state: "done",
    detail: "Request accepted, model + rule resolved.",
    meta: {
      modelVersion: model.version,
      hasRule: Boolean(model.description?.trim() || project.anomalyDescription?.trim()),
    },
  });

  const activeRule =
    model.description?.trim() || project.anomalyDescription?.trim() || "";

  // Description-driven (zero-shot or refined): hand the image + rule to
  // gpt-4o-mini and let the vision model decide. Avoids the lossy
  // caption-then-embed roundtrip and works directly in image space.
  if (activeRule) {
    return runVisionDetection({
      model,
      project: { id, rule: activeRule },
      image: {
        _id: image._id,
        width: visionWidth,
        height: visionHeight,
        url: imageUrl,
      },
      sequenceId: image.sequenceId,
      runId: run._id,
    });
  }

  // Annotation-only path: classical centroid + cosine distance. Untouched.
  return runCentroidDetection({
    model,
    image: {
      _id: image._id,
      width: visionWidth,
      height: visionHeight,
      url: imageUrl,
    },
    projectId: id,
    runId: run._id,
  });
}

async function runVisionDetection({
  model,
  project,
  image,
  sequenceId,
  runId,
}: {
  model: Model;
  project: { id: string; rule: string };
  image: { _id: string; width: number; height: number; url: string };
  sequenceId: string;
  runId: string;
}): Promise<NextResponse> {
  // 1. Reserve a Detection row with status="pending" so other tabs see the
  // call in flight before the vision API returns.
  const pending = await insertPendingDetection({
    modelId: model._id,
    projectId: project.id,
    imageId: image._id,
  });
  await upsertPipelinePhase(runId, {
    name: "reserve",
    label: "Reserve detection row",
    state: "done",
    detail: `Detection ${pending._id.slice(-6)} marked pending.`,
    meta: { detectionId: pending._id },
  });

  try {
    // 2. Few-shot examples: when the user has confirmed anomaly
    // annotations, crop them and pass to the VLM as visual references.
    // Skipped for Grounding DINO (text-only model can't use them).
    let examples: { cropDataUrl: string }[] = [];
    if (!process.env.REPLICATE_API_TOKEN) {
      await upsertPipelinePhase(runId, {
        name: "examples",
        label: "Load few-shot examples",
        state: "running",
        detail: "Cropping recent confirmed annotations…",
        meta: null,
      });
      const refs = await listReferenceAnomalies(project.id, 3);
      const cropPromises = refs.map(async (ref) => {
        const refImage = await findImageById(ref.imageId);
        if (!refImage) return null;
        const crop = await cropToDataUrl({
          blobKey: refImage.blobKey,
          bbox: ref.bbox,
          maxEdge: 512,
        });
        return crop ? { cropDataUrl: crop } : null;
      });
      const crops = await Promise.all(cropPromises);
      examples = crops.filter(
        (c): c is { cropDataUrl: string } => c !== null,
      );
      await upsertPipelinePhase(runId, {
        name: "examples",
        label: "Load few-shot examples",
        state: "done",
        detail:
          examples.length > 0
            ? `${examples.length} confirmed anomaly crop${examples.length === 1 ? "" : "s"} attached.`
            : "No confirmed annotations yet — running rule-only.",
        meta: { exampleCount: examples.length },
      });
    }

    // 3. Vision call: Grounding DINO if wired, else gpt-4o-mini fallback.
    // Both return normalized region bboxes in [0..1].
    await upsertPipelinePhase(runId, {
      name: "vision",
      label: process.env.REPLICATE_API_TOKEN
        ? "Call Grounding DINO"
        : "Call gpt-4o-mini vision",
      state: "running",
      detail: `Rule: ${project.rule.slice(0, 120)}${project.rule.length > 120 ? "…" : ""}${examples.length > 0 ? ` · ${examples.length} few-shot examples` : ""}`,
      meta: {
        backend: process.env.REPLICATE_API_TOKEN ? "grounding-dino" : "openai",
        imageWidth: image.width,
        imageHeight: image.height,
        examples: examples.length,
      },
    });
    const judgement = await judgeImageAgainstRule({
      imageUrl: image.url,
      imageWidth: image.width,
      imageHeight: image.height,
      rule: project.rule,
      examples,
    });
    await upsertPipelinePhase(runId, {
      name: "vision",
      label: process.env.REPLICATE_API_TOKEN
        ? "Call Grounding DINO"
        : "Call gpt-4o-mini vision",
      state: "done",
      detail: `${judgement.source} · ${judgement.regions.length} region${judgement.regions.length === 1 ? "" : "s"} · confidence ${(judgement.confidence * 100).toFixed(0)}%`,
      meta: {
        source: judgement.source,
        regions: judgement.regions.length,
        confidence: judgement.confidence,
        reasoning: judgement.reasoning,
      },
    });

    // 3. Clear prior AI annotations so the canvas reflects the latest run.
    await upsertPipelinePhase(runId, {
      name: "clear-ai",
      label: "Clear stale AI annotations",
      state: "running",
      detail: null,
      meta: null,
    });
    await ensureAnnotationIndexes();
    await deleteAiAnnotationsForImage(image._id);
    await upsertPipelinePhase(runId, {
      name: "clear-ai",
      label: "Clear stale AI annotations",
      state: "done",
      detail: "Human + human-correction annotations preserved.",
      meta: null,
    });

    if (!judgement.isAnomaly || judgement.regions.length === 0) {
      const detection = await completeDetection(pending._id, {
        heatmap: null,
        results: [
          {
            label: "normal",
            confidence: Math.max(0, 1 - judgement.confidence),
            bbox: { x: 0, y: 0, width: image.width, height: image.height },
          },
        ],
      });
      await upsertPipelinePhase(runId, {
        name: "finalize",
        label: "Finalize as normal",
        state: "done",
        detail: "No matching regions — detection saved as normal.",
        meta: { detectionId: detection?._id ?? null },
      });
      await completePipelineRun(runId, {
        detectionId: detection?._id ?? null,
        summary: "Normal (no regions matched the rule).",
      });
      return NextResponse.json({
        detection,
        mode: detectionMode(model),
        reasoning: judgement.reasoning,
      });
    }

    const results = judgement.regions.map((r) => ({
      label: "anomaly" as const,
      confidence: r.confidence,
      bbox: {
        x: r.x * image.width,
        y: r.y * image.height,
        width: r.width * image.width,
        height: r.height * image.height,
      },
    }));

    const heatmap = regionsToHeatmap(judgement.regions, 4, 4);
    await upsertPipelinePhase(runId, {
      name: "finalize",
      label: "Save detection + heatmap",
      state: "running",
      detail: `${results.length} anomaly region${results.length === 1 ? "" : "s"} · 4×4 heatmap`,
      meta: { regions: results.length },
    });
    const detection = await completeDetection(pending._id, {
      heatmap,
      results,
    });
    await upsertPipelinePhase(runId, {
      name: "finalize",
      label: "Save detection + heatmap",
      state: "done",
      detail: `Detection ${detection?._id.slice(-6)} completed.`,
      meta: { detectionId: detection?._id ?? null },
    });

    // Persist each region as an AI annotation so the Annotate canvas can
    // show them ready-to-override.
    await upsertPipelinePhase(runId, {
      name: "ai-annotations",
      label: "Write AI annotations",
      state: "running",
      detail: `Inserting ${judgement.regions.length} editable suggestion${judgement.regions.length === 1 ? "" : "s"}.`,
      meta: null,
    });
    for (const r of judgement.regions) {
      await insertAnnotation({
        imageId: image._id,
        projectId: project.id,
        sequenceId,
        label: "anomaly",
        shape: {
          type: "bounding_box",
          x: r.x * image.width,
          y: r.y * image.height,
          width: r.width * image.width,
          height: r.height * image.height,
        },
        comment: judgement.reasoning || null,
        source: "ai",
      });
    }
    await upsertPipelinePhase(runId, {
      name: "ai-annotations",
      label: "Write AI annotations",
      state: "done",
      detail: `${judgement.regions.length} annotation${judgement.regions.length === 1 ? "" : "s"} ready for review.`,
      meta: null,
    });

    await completePipelineRun(runId, {
      detectionId: detection?._id ?? null,
      summary: `Anomaly · ${results.length} region${results.length === 1 ? "" : "s"} · ${(judgement.confidence * 100).toFixed(0)}% confidence`,
    });

    return NextResponse.json({
      detection,
      mode: detectionMode(model),
      reasoning: judgement.reasoning,
    });
  } catch (err) {
    // Mark the row failed so the UI can show it red instead of leaving it
    // stuck on "pending".
    const message = err instanceof Error ? err.message : "Detection failed";
    const failed = await failDetection(pending._id, message);
    await upsertPipelinePhase(runId, {
      name: "vision",
      label: "Call vision model",
      state: "failed",
      detail: message,
      meta: null,
    });
    await failPipelineRun(runId, message);
    return NextResponse.json(
      { detection: failed, mode: detectionMode(model), error: message },
      { status: 500 },
    );
  }
}

// Burn a list of normalized regions into a cols×rows heatmap by computing
// per-cell coverage × region confidence. The detect page's heatmap overlay
// uses cell scores to paint a translucent red around the bboxes.
function regionsToHeatmap(
  regions: { x: number; y: number; width: number; height: number; confidence: number }[],
  cols: number,
  rows: number,
): NonNullable<Detection["heatmap"]> {
  const cells = new Array<number>(cols * rows).fill(0);
  const cellW = 1 / cols;
  const cellH = 1 / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx0 = c * cellW;
      const cy0 = r * cellH;
      const cx1 = cx0 + cellW;
      const cy1 = cy0 + cellH;
      let best = 0;
      for (const region of regions) {
        const ox = Math.max(0, Math.min(cx1, region.x + region.width) - Math.max(cx0, region.x));
        const oy = Math.max(0, Math.min(cy1, region.y + region.height) - Math.max(cy0, region.y));
        if (ox <= 0 || oy <= 0) continue;
        const overlap = (ox * oy) / (cellW * cellH);
        best = Math.max(best, overlap * region.confidence);
      }
      cells[r * cols + c] = Math.min(1, best);
    }
  }
  return { cols, rows, cells };
}

async function runCentroidDetection({
  model,
  image,
  projectId,
  runId,
}: {
  model: Model;
  image: { _id: string; width: number; height: number; url: string };
  projectId: string;
  runId: string;
}): Promise<NextResponse> {
  if (!model.centroid) {
    await upsertPipelinePhase(runId, {
      name: "reserve",
      label: "Validate model",
      state: "failed",
      detail: "Model has no centroid and no description; cannot detect.",
      meta: null,
    });
    await failPipelineRun(runId, "Model has no centroid and no description.");
    return NextResponse.json(
      { error: "Model has no centroid and no description; cannot detect." },
      { status: 400 },
    );
  }
  await upsertPipelinePhase(runId, {
    name: "embed-whole",
    label: "Embed whole image",
    state: "running",
    detail: "Caption-then-embed against the centroid.",
    meta: null,
  });
  const whole = await embedImage({ imageUrl: image.url, region: null });
  const wholeScore = scoreEmbedding(model, whole.vector);
  await upsertPipelinePhase(runId, {
    name: "embed-whole",
    label: "Embed whole image",
    state: "done",
    detail: `distance ${wholeScore.centroidDistance?.toFixed(3) ?? "?"} · ${wholeScore.isAnomaly ? "above" : "below"} threshold`,
    meta: {
      distance: wholeScore.centroidDistance,
      isAnomaly: wholeScore.isAnomaly,
      confidence: wholeScore.confidence,
    },
  });
  if (!wholeScore.isAnomaly) {
    const detection = await insertDetection({
      modelId: model._id,
      projectId,
      imageId: image._id,
      heatmap: null,
      results: [
        {
          label: "normal",
          confidence: wholeScore.confidence,
          bbox: { x: 0, y: 0, width: image.width, height: image.height },
        },
      ],
    });
    await completePipelineRun(runId, {
      detectionId: detection._id,
      summary: "Normal (whole-image below threshold).",
    });
    return NextResponse.json({ detection, mode: detectionMode(model) });
  }

  await upsertPipelinePhase(runId, {
    name: "tile-sweep",
    label: "4×4 tile sweep",
    state: "running",
    detail: "Embedding 16 tile regions.",
    meta: { tiles: 16 },
  });
  const tiles = generateGrid(image.width, image.height, 4, 4);
  const tileVectors: number[][] = [];
  for (const tile of tiles) {
    const result = await embedImage({
      imageUrl: image.url,
      region: {
        x: tile.x,
        y: tile.y,
        width: tile.width,
        height: tile.height,
      },
    });
    tileVectors.push(result.vector);
  }
  await upsertPipelinePhase(runId, {
    name: "tile-sweep",
    label: "4×4 tile sweep",
    state: "done",
    detail: `${tileVectors.length} tiles embedded.`,
    meta: { tiles: tileVectors.length },
  });
  const { heatmap } = tilesToHeatmap(4, 4, model, tileVectors);
  const bboxes = deriveBBoxes(heatmap, image.width, image.height);
  const results = bboxes.length
    ? bboxes.map((b) => ({
        label: "anomaly" as const,
        confidence: b.score,
        bbox: { x: b.x, y: b.y, width: b.width, height: b.height },
      }))
    : [
        {
          label: "anomaly" as const,
          confidence: wholeScore.confidence,
          bbox: { x: 0, y: 0, width: image.width, height: image.height },
        },
      ];
  const detection = await insertDetection({
    modelId: model._id,
    projectId,
    imageId: image._id,
    heatmap,
    results,
  });
  await completePipelineRun(runId, {
    detectionId: detection._id,
    summary: `Anomaly · ${results.length} region${results.length === 1 ? "" : "s"}`,
  });
  return NextResponse.json({ detection, mode: detectionMode(model) });
}

function detectionMode(model: Model): "description" | "centroid" | "refined" {
  if (model.centroid && model.description) return "refined";
  if (model.description) return "description";
  return "centroid";
}

// Builds a zero-shot Model row from a project's anomaly description. Lets
// detection run before any annotation work happens. The version slug
// carries the "zs-" prefix so the dashboards can distinguish it from
// annotation-trained models at a glance. The descriptionEmbedding is no
// longer used by detection but is kept so legacy data still reads.
async function materializeZeroShotModel(
  projectId: string,
  description: string,
): Promise<Model> {
  await ensureModelIndexes();
  const version = `zs-${new ObjectId().toString().slice(-6)}`;
  return await insertModel({
    projectId,
    version,
    algorithm: "openai-embedding-description",
    centroid: null,
    description,
    descriptionEmbedding: null,
    threshold: 0,
    metrics: { precision: 0, recall: 0, f1: 0, sampleCount: 0 },
    status: "completed",
  });
}
