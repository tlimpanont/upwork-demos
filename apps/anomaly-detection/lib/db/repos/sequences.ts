import { ObjectId } from "mongodb";
import { db } from "../mongo";
import type { Sequence } from "../schemas";

type SequenceDoc = {
  _id: ObjectId;
  projectId: ObjectId;
  name: string;
  imageCount: number;
  createdAt: Date;
};

function toSequence(doc: SequenceDoc): Sequence {
  return {
    _id: doc._id.toHexString(),
    projectId: doc.projectId.toHexString(),
    name: doc.name,
    imageCount: doc.imageCount,
    createdAt: doc.createdAt,
  };
}

export async function listSequencesForProject(
  projectId: string,
): Promise<Sequence[]> {
  const collection = (await db()).collection<SequenceDoc>("sequences");
  const docs = await collection
    .find({ projectId: new ObjectId(projectId) })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(toSequence);
}

export async function findSequenceByIdAndProject(
  id: string,
  projectId: string,
): Promise<Sequence | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = (await db()).collection<SequenceDoc>("sequences");
  const doc = await collection.findOne({
    _id: new ObjectId(id),
    projectId: new ObjectId(projectId),
  });
  return doc ? toSequence(doc) : null;
}

export async function findSequenceById(id: string): Promise<Sequence | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = (await db()).collection<SequenceDoc>("sequences");
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  return doc ? toSequence(doc) : null;
}

export async function insertSequence(input: {
  projectId: string;
  name: string;
}): Promise<Sequence> {
  const doc = {
    projectId: new ObjectId(input.projectId),
    name: input.name,
    imageCount: 0,
    createdAt: new Date(),
  };
  const collection = (await db()).collection<Omit<SequenceDoc, "_id">>(
    "sequences",
  );
  const { insertedId } = await collection.insertOne(doc);
  return toSequence({ _id: insertedId, ...doc });
}

export async function bumpImageCount(
  sequenceId: string,
  delta: number,
): Promise<void> {
  if (!ObjectId.isValid(sequenceId)) return;
  const collection = (await db()).collection("sequences");
  await collection.updateOne(
    { _id: new ObjectId(sequenceId) },
    { $inc: { imageCount: delta } },
  );
}

export async function deleteSequenceCascade(
  id: string,
  projectId: string,
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const dbi = await db();
  const sequenceObjId = new ObjectId(id);
  const projectObjId = new ObjectId(projectId);

  const owned = await dbi
    .collection("sequences")
    .findOne({ _id: sequenceObjId, projectId: projectObjId });
  if (!owned) return false;

  await dbi.collection("annotations").deleteMany({ sequenceId: sequenceObjId });
  await dbi.collection("embeddings").deleteMany({ sequenceId: sequenceObjId });
  await dbi.collection("images").deleteMany({ sequenceId: sequenceObjId });
  await dbi.collection("sequences").deleteOne({ _id: sequenceObjId });
  return true;
}

export async function ensureSequenceIndexes(): Promise<void> {
  const collection = (await db()).collection("sequences");
  await collection.createIndex({ projectId: 1, createdAt: -1 });
}

// Returns a map of sequenceId -> live image count for every sequence in
// the project. Computed via an aggregation rather than reading the stored
// `imageCount` field, which can drift if deleteImageCascade fires without
// the corresponding bumpImageCount call.
export async function countImagesPerSequence(
  projectId: string,
): Promise<Map<string, number>> {
  if (!ObjectId.isValid(projectId)) return new Map();
  const collection = (await db()).collection("images");
  const cursor = collection.aggregate<{ _id: ObjectId; count: number }>([
    { $match: { projectId: new ObjectId(projectId) } },
    { $group: { _id: "$sequenceId", count: { $sum: 1 } } },
  ]);
  const out = new Map<string, number>();
  for await (const row of cursor) {
    out.set(row._id.toHexString(), row.count);
  }
  return out;
}
