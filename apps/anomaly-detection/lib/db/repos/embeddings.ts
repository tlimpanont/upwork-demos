import { ObjectId } from "mongodb";
import { db } from "../mongo";
import type { Embedding } from "../schemas";

type EmbeddingDoc = {
  _id: ObjectId;
  projectId: ObjectId;
  imageId: ObjectId;
  sequenceId: ObjectId;
  annotationId: ObjectId | null;
  label: Embedding["label"];
  vector: number[];
  caption: string | null;
  createdAt: Date;
};

function toEmbedding(doc: EmbeddingDoc): Embedding {
  return {
    _id: doc._id.toHexString(),
    projectId: doc.projectId.toHexString(),
    imageId: doc.imageId.toHexString(),
    annotationId: doc.annotationId ? doc.annotationId.toHexString() : null,
    label: doc.label,
    vector: doc.vector,
    caption: doc.caption,
    createdAt: doc.createdAt,
  };
}

export type InsertEmbeddingInput = {
  projectId: string;
  imageId: string;
  sequenceId: string;
  annotationId: string | null;
  label: Embedding["label"];
  vector: number[];
  caption: string | null;
};

export async function bulkInsertEmbeddings(
  rows: InsertEmbeddingInput[],
): Promise<void> {
  if (rows.length === 0) return;
  const collection = (await db()).collection<Omit<EmbeddingDoc, "_id">>(
    "embeddings",
  );
  await collection.insertMany(
    rows.map((r) => ({
      projectId: new ObjectId(r.projectId),
      imageId: new ObjectId(r.imageId),
      sequenceId: new ObjectId(r.sequenceId),
      annotationId: r.annotationId ? new ObjectId(r.annotationId) : null,
      label: r.label,
      vector: r.vector,
      caption: r.caption,
      createdAt: new Date(),
    })),
  );
}

export async function listEmbeddingsForProject(
  projectId: string,
): Promise<Embedding[]> {
  if (!ObjectId.isValid(projectId)) return [];
  const collection = (await db()).collection<EmbeddingDoc>("embeddings");
  const docs = await collection
    .find({ projectId: new ObjectId(projectId) })
    .toArray();
  return docs.map(toEmbedding);
}

export async function deleteEmbeddingsForProject(
  projectId: string,
): Promise<void> {
  if (!ObjectId.isValid(projectId)) return;
  const collection = (await db()).collection("embeddings");
  await collection.deleteMany({ projectId: new ObjectId(projectId) });
}

export async function ensureEmbeddingIndexes(): Promise<void> {
  const collection = (await db()).collection("embeddings");
  await collection.createIndex({ projectId: 1, label: 1 });
  await collection.createIndex({ imageId: 1 });
  await collection.createIndex({ sequenceId: 1 });
}
