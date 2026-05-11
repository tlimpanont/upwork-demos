import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/api";
import { findProjectById } from "@/lib/db/repos/projects";
import { listAnnotationsForProject } from "@/lib/db/repos/annotations";
import { listImagesForProject } from "@/lib/db/repos/images";
import {
  bulkInsertEmbeddings,
  deleteEmbeddingsForProject,
  ensureEmbeddingIndexes,
  listEmbeddingsForProject,
} from "@/lib/db/repos/embeddings";
import {
  ensureModelIndexes,
  insertModel,
} from "@/lib/db/repos/models";
import {
  completePipelineRun,
  ensurePipelineRunIndexes,
  failPipelineRun,
  insertPipelineRun,
  upsertPipelinePhase,
} from "@/lib/db/repos/pipeline-runs";
import { embedImage, embedText } from "@/lib/ai/embeddings";
import {
  computeCentroidAndThreshold,
  evaluate,
  splitBySequence,
} from "@/lib/ai/training";
import { dataUrlForKey } from "@/lib/storage/blob";
import type { Embedding } from "@/lib/db/schemas";

export const runtime = "nodejs";
export const maxDuration = 300;

// Parallel OpenAI calls per training run. 5 keeps free-tier rate limits
// out of the way while cutting wall time ~5×.
const EMBED_CONCURRENCY = 5;

// Each line of the response body is a JSON event. Lets the client render
// the training pipeline step by step instead of staring at a spinner.
type TrainEvent =
  | { phase: "preparing"; normal: number; anomaly: number; total: number }
  | {
      phase: "embedding";
      embedded: number;
      total: number;
      label: "normal" | "anomaly";
    }
  | {
      phase: "splitting";
      train: number;
      validation: number;
      test: number;
      mode: "sequence" | "annotation";
    }
  | { phase: "scoring"; threshold: number; sigma: number }
  | {
      phase: "evaluating";
      precision: number;
      recall: number;
      f1: number;
      samples: number;
    }
  | {
      phase: "saving";
      modelVersion: string;
      mode: "centroid" | "refined";
    }
  | { phase: "complete"; result: TrainResult }
  | { phase: "failed"; error: string };

type TrainResult = {
  model: {
    id: string;
    version: string;
    threshold: number;
    sigma: number;
    metrics: {
      precision: number;
      recall: number;
      f1: number;
      sampleCount: number;
    };
    mode: "centroid" | "refined";
  };
  embedded: number;
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;
  const project = await findProjectById(id, user.id);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Cheap upfront checks return plain JSON. The stream only kicks in once
  // we've committed to a real training run.
  const [images, annotations] = await Promise.all([
    listImagesForProject(id),
    listAnnotationsForProject(id),
  ]);
  const imagesById = new Map(images.map((i) => [i._id, i]));
  const normalAnnotations = annotations.filter((a) => a.label === "normal");
  const anomalyAnnotations = annotations.filter((a) => a.label === "anomaly");
  if (normalAnnotations.length < 3) {
    return NextResponse.json(
      {
        error:
          "Need at least 3 normal annotations across at least 2 sequences before training.",
      },
      { status: 400 },
    );
  }

  // Persist the run so the Jobs page can render it (and so progress is
  // visible to anyone with the project open, not just the tab that
  // submitted the request).
  await ensurePipelineRunIndexes();
  const run = await insertPipelineRun({
    projectId: id,
    kind: "training",
    summary: `Training run · ${normalAnnotations.length} normal + ${anomalyAnnotations.length} anomaly`,
  });

  // ndjson stream: one JSON object per line. Client splits on "\n".
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = async (event: TrainEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        // Reflect the event into the persisted run too, so the Jobs page
        // shows the same step-by-step view without re-implementing
        // training-event semantics.
        await persistTrainEvent(run._id, event);
      };
      try {
        await runTraining({
          projectId: id,
          rule: project.anomalyDescription?.trim() ?? "",
          images,
          imagesById,
          normalAnnotations,
          anomalyAnnotations,
          emit,
        });
        await completePipelineRun(run._id);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Training failed";
        await emit({ phase: "failed", error: message });
        await failPipelineRun(run._id, message);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-cache",
      "x-accel-buffering": "no",
    },
  });
}

async function runTraining({
  projectId,
  rule,
  images,
  imagesById,
  normalAnnotations,
  anomalyAnnotations,
  emit,
}: {
  projectId: string;
  rule: string;
  images: Awaited<ReturnType<typeof listImagesForProject>>;
  imagesById: Map<string, (typeof images)[number]>;
  normalAnnotations: Awaited<ReturnType<typeof listAnnotationsForProject>>;
  anomalyAnnotations: Awaited<ReturnType<typeof listAnnotationsForProject>>;
  emit: (event: TrainEvent) => Promise<void>;
}) {
  // ── Phase 1: prepare ────────────────────────────────────────────────
  type Pending = {
    annotationId: string;
    imageId: string;
    sequenceId: string;
    label: Embedding["label"];
    region: { x: number; y: number; width: number; height: number } | null;
    blobKey: string;
  };
  const pending: Pending[] = [];
  for (const a of [...normalAnnotations, ...anomalyAnnotations]) {
    const img = imagesById.get(a.imageId);
    if (!img) continue;
    const region =
      a.shape.type === "bounding_box"
        ? {
            x: a.shape.x,
            y: a.shape.y,
            width: a.shape.width,
            height: a.shape.height,
          }
        : null;
    pending.push({
      annotationId: a._id,
      imageId: a.imageId,
      sequenceId: img.sequenceId,
      label: a.label,
      region,
      blobKey: img.blobKey,
    });
  }

  await emit({
    phase: "preparing",
    normal: normalAnnotations.length,
    anomaly: anomalyAnnotations.length,
    total: pending.length,
  });

  // Fresh training run: drop prior embeddings so the next detect run uses
  // the centroid we're about to compute.
  await deleteEmbeddingsForProject(projectId);
  await ensureEmbeddingIndexes();
  await ensureModelIndexes();

  // ── Phase 2: embed annotations in parallel ─────────────────────────
  const rows: Parameters<typeof bulkInsertEmbeddings>[0] = [];
  const dataUrlByKey = new Map<string, string | null>();
  async function imageDataUrl(blobKey: string): Promise<string | null> {
    const cached = dataUrlByKey.get(blobKey);
    if (cached !== undefined) return cached;
    const value = await dataUrlForKey(blobKey);
    dataUrlByKey.set(blobKey, value);
    return value;
  }

  let completed = 0;
  let cursor = 0;
  const workers = Array.from({ length: Math.min(EMBED_CONCURRENCY, pending.length) }).map(
    async () => {
      while (cursor < pending.length) {
        const i = cursor++;
        const p = pending[i];
        const url = await imageDataUrl(p.blobKey);
        if (!url) {
          completed++;
          await emit({
            phase: "embedding",
            embedded: completed,
            total: pending.length,
            label: p.label,
          });
          continue;
        }
        const result = await embedImage({ imageUrl: url, region: p.region });
        rows.push({
          projectId,
          imageId: p.imageId,
          sequenceId: p.sequenceId,
          annotationId: p.annotationId,
          label: p.label,
          vector: result.vector,
          caption: result.caption,
        });
        completed++;
        await emit({
          phase: "embedding",
          embedded: completed,
          total: pending.length,
          label: p.label,
        });
      }
    },
  );
  await Promise.all(workers);
  await bulkInsertEmbeddings(rows);

  // ── Phase 3: split by sequence ─────────────────────────────────────
  const allEmbeddings = await listEmbeddingsForProject(projectId);
  const sequenceByImage = new Map(images.map((i) => [i._id, i.sequenceId]));
  const enriched: (Embedding & { sequenceId: string })[] = allEmbeddings.map(
    (e) => ({
      ...e,
      sequenceId: sequenceByImage.get(e.imageId) ?? e.imageId,
    }),
  );
  const split = splitBySequence(enriched);
  await emit({
    phase: "splitting",
    train: split.train.length,
    validation: split.validation.length,
    test: split.test.length,
    mode: split.mode,
  });

  // ── Phase 4: fit centroid + threshold ──────────────────────────────
  const trainNormals = split.train.filter((e) => e.label === "normal");
  const summary = computeCentroidAndThreshold(trainNormals);
  if (!summary) {
    throw new Error("No normal training embeddings after splitting.");
  }
  await emit({
    phase: "scoring",
    threshold: summary.threshold,
    sigma: summary.sigma,
  });

  // ── Phase 5: evaluate against held-out ─────────────────────────────
  const evalSet =
    split.validation.length > 0 ? split.validation : split.test;
  const metrics = evaluate(summary.centroid, summary.threshold, evalSet);
  await emit({
    phase: "evaluating",
    precision: metrics.precision,
    recall: metrics.recall,
    f1: metrics.f1,
    samples: metrics.sampleCount,
  });

  // ── Phase 6: save model ────────────────────────────────────────────
  const descriptionEmbedding = rule ? (await embedText(rule)).vector : null;
  const mode = descriptionEmbedding ? "refined" : "centroid";
  const version = `v${new ObjectId().toString().slice(-6)}`;
  await emit({ phase: "saving", modelVersion: version, mode });
  const model = await insertModel({
    projectId,
    version,
    algorithm: "openai-embedding-centroid",
    centroid: summary.centroid,
    description: rule || null,
    descriptionEmbedding,
    threshold: summary.threshold,
    metrics,
    split: {
      train: split.train.length,
      validation: split.validation.length,
      test: split.test.length,
      mode: split.mode,
    },
    status: "completed",
  });

  await emit({
    phase: "complete",
    result: {
      model: {
        id: model._id,
        version: model.version,
        threshold: model.threshold,
        sigma: summary.sigma,
        metrics,
        mode,
      },
      embedded: rows.length,
    },
  });
}

// Translates ndjson training events into PipelineRun phase upserts. Lets
// the Jobs page render exactly the same pipeline checklist the TrainPanel
// shows in the originating tab.
async function persistTrainEvent(
  runId: string,
  event: TrainEvent,
): Promise<void> {
  switch (event.phase) {
    case "preparing":
      await upsertPipelinePhase(runId, {
        name: "preparing",
        label: "Prepare regions",
        state: "done",
        detail: `${event.normal} normal + ${event.anomaly} anomaly = ${event.total} regions`,
        meta: {
          normal: event.normal,
          anomaly: event.anomaly,
          total: event.total,
        },
      });
      await upsertPipelinePhase(runId, {
        name: "embedding",
        label: "Embed annotations",
        state: "running",
        detail: `0 / ${event.total} regions`,
        meta: { embedded: 0, total: event.total },
      });
      return;
    case "embedding":
      await upsertPipelinePhase(runId, {
        name: "embedding",
        label: "Embed annotations",
        state: event.embedded < event.total ? "running" : "done",
        detail: `${event.embedded} / ${event.total} regions`,
        meta: { embedded: event.embedded, total: event.total },
      });
      return;
    case "splitting":
      await upsertPipelinePhase(runId, {
        name: "splitting",
        label:
          event.mode === "annotation"
            ? "Split by annotation (sparse-data fallback)"
            : "Split by sequence",
        state: "done",
        detail: `train ${event.train} · val ${event.validation} · test ${event.test}${event.mode === "annotation" ? " · per-annotation fallback (metrics may be optimistic)" : ""}`,
        meta: {
          train: event.train,
          validation: event.validation,
          test: event.test,
          mode: event.mode,
        },
      });
      return;
    case "scoring":
      await upsertPipelinePhase(runId, {
        name: "scoring",
        label: "Fit centroid + threshold",
        state: "done",
        detail: `threshold ${event.threshold.toFixed(3)} · σ ${event.sigma.toFixed(3)}`,
        meta: { threshold: event.threshold, sigma: event.sigma },
      });
      return;
    case "evaluating":
      await upsertPipelinePhase(runId, {
        name: "evaluating",
        label: "Evaluate on held-out",
        state: "done",
        detail: `precision ${(event.precision * 100).toFixed(0)}% · recall ${(event.recall * 100).toFixed(0)}% · F1 ${(event.f1 * 100).toFixed(0)}% over ${event.samples} samples`,
        meta: {
          precision: event.precision,
          recall: event.recall,
          f1: event.f1,
          samples: event.samples,
        },
      });
      return;
    case "saving":
      await upsertPipelinePhase(runId, {
        name: "saving",
        label: "Save model",
        state: "running",
        detail: `${event.modelVersion} · mode ${event.mode}`,
        meta: { version: event.modelVersion, mode: event.mode },
      });
      return;
    case "complete":
      await upsertPipelinePhase(runId, {
        name: "saving",
        label: "Save model",
        state: "done",
        detail: `${event.result.model.version} · mode ${event.result.model.mode} · F1 ${(event.result.model.metrics.f1 * 100).toFixed(0)}%`,
        meta: {
          version: event.result.model.version,
          mode: event.result.model.mode,
          modelId: event.result.model.id,
          f1: event.result.model.metrics.f1,
        },
      });
      return;
    case "failed":
      // Mark whichever phase was last seen as failed. The route handler
      // also calls failPipelineRun separately to set the run-level status.
      return;
  }
}
