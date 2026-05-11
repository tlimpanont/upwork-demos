import { ObjectId } from "mongodb";
import { db } from "../mongo";
import type { Model } from "../schemas";

type ModelDoc = {
  _id: ObjectId;
  projectId: ObjectId;
  version: string;
  algorithm: Model["algorithm"];
  centroid: number[] | null;
  description: string | null;
  descriptionEmbedding: number[] | null;
  threshold: number;
  metrics: Model["metrics"];
  split?: Model["split"];
  status: Model["status"];
  createdAt: Date;
};

function toModel(doc: ModelDoc): Model {
  return {
    _id: doc._id.toHexString(),
    projectId: doc.projectId.toHexString(),
    version: doc.version,
    algorithm: doc.algorithm,
    centroid: doc.centroid,
    description: doc.description ?? null,
    descriptionEmbedding: doc.descriptionEmbedding ?? null,
    threshold: doc.threshold,
    metrics: doc.metrics,
    split: doc.split ?? null,
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

export async function listModelsForProject(
  projectId: string,
): Promise<Model[]> {
  if (!ObjectId.isValid(projectId)) return [];
  const collection = (await db()).collection<ModelDoc>("models");
  const docs = await collection
    .find({ projectId: new ObjectId(projectId) })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(toModel);
}

export async function findLatestCompletedModel(
  projectId: string,
): Promise<Model | null> {
  if (!ObjectId.isValid(projectId)) return null;
  const collection = (await db()).collection<ModelDoc>("models");
  const doc = await collection.findOne(
    { projectId: new ObjectId(projectId), status: "completed" },
    { sort: { createdAt: -1 } },
  );
  return doc ? toModel(doc) : null;
}

export async function insertModel(input: {
  projectId: string;
  version: string;
  algorithm: Model["algorithm"];
  centroid: number[] | null;
  description: string | null;
  descriptionEmbedding: number[] | null;
  threshold: number;
  metrics: Model["metrics"];
  split?: Model["split"];
  status: Model["status"];
}): Promise<Model> {
  const doc = {
    projectId: new ObjectId(input.projectId),
    version: input.version,
    algorithm: input.algorithm,
    centroid: input.centroid,
    description: input.description,
    descriptionEmbedding: input.descriptionEmbedding,
    threshold: input.threshold,
    metrics: input.metrics,
    split: input.split ?? null,
    status: input.status,
    createdAt: new Date(),
  };
  const collection = (await db()).collection<Omit<ModelDoc, "_id">>("models");
  const { insertedId } = await collection.insertOne(doc);
  return toModel({ _id: insertedId, ...doc });
}

export async function ensureModelIndexes(): Promise<void> {
  const collection = (await db()).collection("models");
  await collection.createIndex({ projectId: 1, createdAt: -1 });
}
