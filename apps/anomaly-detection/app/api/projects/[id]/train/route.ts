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
import { embedImage } from "@/lib/ai/embeddings";
import {
  computeCentroidAndThreshold,
  evaluate,
  splitBySequence,
} from "@/lib/ai/training";
import { urlForKey } from "@/lib/storage/blob";
import type { Embedding } from "@/lib/db/schemas";

export const runtime = "nodejs";
export const maxDuration = 300;

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

  // Replace any prior embeddings: re-embedding is idempotent, and the next
  // detection should always run against the latest model's vectors.
  await deleteEmbeddingsForProject(id);
  await ensureEmbeddingIndexes();
  await ensureModelIndexes();

  // Embed every annotation as its own region. This buys per-region semantics
  // (a single image with a tiny anomaly doesn't dilute the cluster). For
  // unannotated normals we'd embed the whole image, but the training step
  // requires explicit normals.
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

  const rows: Parameters<typeof bulkInsertEmbeddings>[0] = [];
  // Sequential to stay polite with OpenAI rate limits in a free-tier setup.
  for (const p of pending) {
    const url = await urlForKey(p.blobKey);
    if (!url) continue;
    const result = await embedImage({ imageUrl: url, region: p.region });
    rows.push({
      projectId: id,
      imageId: p.imageId,
      sequenceId: p.sequenceId,
      annotationId: p.annotationId,
      label: p.label,
      vector: result.vector,
      caption: result.caption,
    });
  }
  await bulkInsertEmbeddings(rows);

  // Pull the embeddings back out so we work with the same shape that
  // detection will read at request time.
  const allEmbeddings = await listEmbeddingsForProject(id);

  // Hydrate sequenceId on each embedding by joining via imageId so
  // splitBySequence has what it needs.
  const sequenceByImage = new Map(images.map((i) => [i._id, i.sequenceId]));
  const enriched: (Embedding & { sequenceId: string })[] = allEmbeddings.map(
    (e) => ({
      ...e,
      sequenceId: sequenceByImage.get(e.imageId) ?? e.imageId,
    }),
  );

  const split = splitBySequence(enriched);
  const trainNormals = split.train.filter((e) => e.label === "normal");
  const summary = computeCentroidAndThreshold(trainNormals);
  if (!summary) {
    return NextResponse.json(
      { error: "No normal training embeddings after splitting." },
      { status: 400 },
    );
  }

  const evalSet =
    split.validation.length > 0 ? split.validation : split.test;
  const metrics = evaluate(summary.centroid, summary.threshold, evalSet);

  const version = `v${new ObjectId().toString().slice(-6)}`;
  const model = await insertModel({
    projectId: id,
    version,
    centroid: summary.centroid,
    threshold: summary.threshold,
    metrics,
    status: "completed",
  });

  return NextResponse.json({
    model: {
      id: model._id,
      version: model.version,
      threshold: model.threshold,
      sigma: summary.sigma,
      metrics,
    },
    embedded: rows.length,
  });
}
