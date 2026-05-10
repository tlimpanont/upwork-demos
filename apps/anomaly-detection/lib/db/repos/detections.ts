import { ObjectId } from "mongodb";
import { db } from "../mongo";
import type { Detection } from "../schemas";

type DetectionDoc = {
  _id: ObjectId;
  modelId: ObjectId;
  projectId: ObjectId;
  imageId: ObjectId;
  heatmap: Detection["heatmap"];
  results: Detection["results"];
  reviewed: Detection["reviewed"];
  createdAt: Date;
};

function toDetection(doc: DetectionDoc): Detection {
  return {
    _id: doc._id.toHexString(),
    modelId: doc.modelId.toHexString(),
    projectId: doc.projectId.toHexString(),
    imageId: doc.imageId.toHexString(),
    heatmap: doc.heatmap,
    results: doc.results,
    reviewed: doc.reviewed,
    createdAt: doc.createdAt,
  };
}

export async function listDetectionsForProject(
  projectId: string,
): Promise<Detection[]> {
  if (!ObjectId.isValid(projectId)) return [];
  const collection = (await db()).collection<DetectionDoc>("detections");
  const docs = await collection
    .find({ projectId: new ObjectId(projectId) })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(toDetection);
}

export async function findDetectionById(
  id: string,
): Promise<Detection | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = (await db()).collection<DetectionDoc>("detections");
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  return doc ? toDetection(doc) : null;
}

export async function insertDetection(input: {
  modelId: string;
  projectId: string;
  imageId: string;
  heatmap: Detection["heatmap"];
  results: Detection["results"];
}): Promise<Detection> {
  const doc = {
    modelId: new ObjectId(input.modelId),
    projectId: new ObjectId(input.projectId),
    imageId: new ObjectId(input.imageId),
    heatmap: input.heatmap,
    results: input.results,
    reviewed: "pending" as const,
    createdAt: new Date(),
  };
  const collection = (await db()).collection<Omit<DetectionDoc, "_id">>(
    "detections",
  );
  const { insertedId } = await collection.insertOne(doc);
  return toDetection({ _id: insertedId, ...doc });
}

export async function setDetectionReviewed(
  id: string,
  reviewed: Detection["reviewed"],
): Promise<void> {
  if (!ObjectId.isValid(id)) return;
  const collection = (await db()).collection("detections");
  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { reviewed } },
  );
}

export async function ensureDetectionIndexes(): Promise<void> {
  const collection = (await db()).collection("detections");
  await collection.createIndex({ projectId: 1, createdAt: -1 });
  await collection.createIndex({ imageId: 1 });
}
