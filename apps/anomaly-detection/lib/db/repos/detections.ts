import { ObjectId } from "mongodb";
import { db } from "../mongo";
import type { Detection } from "../schemas";

type DetectionDoc = {
  _id: ObjectId;
  modelId: ObjectId;
  projectId: ObjectId;
  imageId: ObjectId;
  status?: Detection["status"];
  error?: string | null;
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
    status: doc.status ?? "completed",
    error: doc.error ?? null,
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

// Insert a placeholder so the row exists with status="pending" the moment
// the user submits a detection. The route updates it once the vision call
// returns (or marks it failed on error).
export async function insertPendingDetection(input: {
  modelId: string;
  projectId: string;
  imageId: string;
}): Promise<Detection> {
  const doc = {
    modelId: new ObjectId(input.modelId),
    projectId: new ObjectId(input.projectId),
    imageId: new ObjectId(input.imageId),
    status: "pending" as const,
    error: null,
    heatmap: null,
    results: [],
    reviewed: "pending" as const,
    createdAt: new Date(),
  };
  const collection = (await db()).collection<Omit<DetectionDoc, "_id">>(
    "detections",
  );
  const { insertedId } = await collection.insertOne(doc);
  return toDetection({ _id: insertedId, ...doc });
}

export async function completeDetection(
  id: string,
  input: {
    heatmap: Detection["heatmap"];
    results: Detection["results"];
  },
): Promise<Detection | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = (await db()).collection<DetectionDoc>("detections");
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: "completed" as const,
        error: null,
        heatmap: input.heatmap,
        results: input.results,
      },
    },
    { returnDocument: "after" },
  );
  return result ? toDetection(result) : null;
}

export async function failDetection(
  id: string,
  message: string,
): Promise<Detection | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = (await db()).collection<DetectionDoc>("detections");
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: "failed" as const,
        error: message.slice(0, 2000),
      },
    },
    { returnDocument: "after" },
  );
  return result ? toDetection(result) : null;
}

// Kept for the legacy centroid path that still inserts in one shot. The
// new vision path uses insertPendingDetection + completeDetection.
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
    status: "completed" as const,
    error: null,
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
  await collection.createIndex({ projectId: 1, status: 1 });
}
