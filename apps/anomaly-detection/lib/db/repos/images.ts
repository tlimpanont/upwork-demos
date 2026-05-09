import { ObjectId } from "mongodb";
import { db } from "../mongo";
import type { Image } from "../schemas";

type ImageDoc = {
  _id: ObjectId;
  sequenceId: ObjectId;
  projectId: ObjectId;
  blobKey: string;
  width: number;
  height: number;
  capturedAt: Date;
  uploadedAt: Date;
};

function toImage(doc: ImageDoc): Image {
  return {
    _id: doc._id.toHexString(),
    sequenceId: doc.sequenceId.toHexString(),
    projectId: doc.projectId.toHexString(),
    blobKey: doc.blobKey,
    width: doc.width,
    height: doc.height,
    capturedAt: doc.capturedAt,
    uploadedAt: doc.uploadedAt,
  };
}

export async function listImagesForSequence(
  sequenceId: string,
): Promise<Image[]> {
  if (!ObjectId.isValid(sequenceId)) return [];
  const collection = (await db()).collection<ImageDoc>("images");
  const docs = await collection
    .find({ sequenceId: new ObjectId(sequenceId) })
    .sort({ capturedAt: 1 })
    .toArray();
  return docs.map(toImage);
}

export async function listImagesForProject(
  projectId: string,
): Promise<Image[]> {
  if (!ObjectId.isValid(projectId)) return [];
  const collection = (await db()).collection<ImageDoc>("images");
  const docs = await collection
    .find({ projectId: new ObjectId(projectId) })
    .sort({ capturedAt: 1 })
    .toArray();
  return docs.map(toImage);
}

export async function findImageById(id: string): Promise<Image | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = (await db()).collection<ImageDoc>("images");
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  return doc ? toImage(doc) : null;
}

export async function insertImage(input: {
  sequenceId: string;
  projectId: string;
  blobKey: string;
  width: number;
  height: number;
  capturedAt: Date;
}): Promise<Image> {
  const doc = {
    sequenceId: new ObjectId(input.sequenceId),
    projectId: new ObjectId(input.projectId),
    blobKey: input.blobKey,
    width: input.width,
    height: input.height,
    capturedAt: input.capturedAt,
    uploadedAt: new Date(),
  };
  const collection = (await db()).collection<Omit<ImageDoc, "_id">>("images");
  const { insertedId } = await collection.insertOne(doc);
  return toImage({ _id: insertedId, ...doc });
}

export async function deleteImageCascade(id: string): Promise<Image | null> {
  if (!ObjectId.isValid(id)) return null;
  const dbi = await db();
  const objId = new ObjectId(id);
  const doc = await dbi.collection<ImageDoc>("images").findOne({ _id: objId });
  if (!doc) return null;
  await dbi.collection("annotations").deleteMany({ imageId: objId });
  await dbi.collection("embeddings").deleteMany({ imageId: objId });
  await dbi.collection("images").deleteOne({ _id: objId });
  return toImage(doc);
}

export async function ensureImageIndexes(): Promise<void> {
  const collection = (await db()).collection("images");
  await collection.createIndex({ sequenceId: 1, capturedAt: 1 });
  await collection.createIndex({ projectId: 1 });
}
