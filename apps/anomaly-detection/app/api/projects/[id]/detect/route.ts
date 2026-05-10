import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api";
import { findProjectById } from "@/lib/db/repos/projects";
import { findImageById } from "@/lib/db/repos/images";
import { findLatestCompletedModel } from "@/lib/db/repos/models";
import {
  ensureDetectionIndexes,
  insertDetection,
} from "@/lib/db/repos/detections";
import { embedImage } from "@/lib/ai/embeddings";
import {
  cosineDistance,
} from "@/lib/ai/training";
import {
  deriveBBoxes,
  generateGrid,
  tilesToHeatmap,
} from "@/lib/ai/detection";
import { urlForKey } from "@/lib/storage/blob";

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

  const model = await findLatestCompletedModel(id);
  if (!model) {
    return NextResponse.json(
      { error: "No completed model. Train one first." },
      { status: 400 },
    );
  }

  const imageUrl = await urlForKey(image.blobKey);
  if (!imageUrl) {
    return NextResponse.json({ error: "Blob missing" }, { status: 404 });
  }

  // Whole-image embedding first.
  const whole = await embedImage({ imageUrl, region: null });
  const wholeDistance = cosineDistance(model.centroid, whole.vector);
  const wholeAnomaly = wholeDistance >= model.threshold;

  await ensureDetectionIndexes();

  // If the image isn't anomalous, skip the tile pass — saves 16 OpenAI
  // calls and yields a clean "no anomalies" result.
  if (!wholeAnomaly) {
    const detection = await insertDetection({
      modelId: model._id,
      projectId: id,
      imageId: image._id,
      heatmap: null,
      results: [
        {
          label: "normal",
          confidence: Math.min(1, 1 - wholeDistance / model.threshold),
          bbox: { x: 0, y: 0, width: image.width, height: image.height },
        },
      ],
    });
    return NextResponse.json({ detection, distance: wholeDistance });
  }

  // Tile pass for the heatmap.
  const tiles = generateGrid(image.width, image.height, 4, 4);
  const tileVectors: number[][] = [];
  for (const tile of tiles) {
    const result = await embedImage({
      imageUrl,
      region: {
        x: tile.x,
        y: tile.y,
        width: tile.width,
        height: tile.height,
      },
    });
    tileVectors.push(result.vector);
  }

  const { heatmap } = tilesToHeatmap(
    4,
    4,
    model.centroid,
    model.threshold,
    tileVectors,
  );
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
          confidence: Math.min(1, wholeDistance / (2 * model.threshold)),
          bbox: { x: 0, y: 0, width: image.width, height: image.height },
        },
      ];

  const detection = await insertDetection({
    modelId: model._id,
    projectId: id,
    imageId: image._id,
    heatmap,
    results,
  });
  return NextResponse.json({ detection, distance: wholeDistance });
}
