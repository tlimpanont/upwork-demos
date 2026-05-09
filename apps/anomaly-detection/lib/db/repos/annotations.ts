import { ObjectId } from "mongodb";
import { db } from "../mongo";
import type { Annotation } from "../schemas";

type ShapeDoc = Annotation["shape"];

type AnnotationDoc = {
  _id: ObjectId;
  imageId: ObjectId;
  projectId: ObjectId;
  sequenceId: ObjectId;
  label: Annotation["label"];
  shape: ShapeDoc;
  comment: string | null;
  source: Annotation["source"];
  createdAt: Date;
};

function toAnnotation(doc: AnnotationDoc): Annotation {
  return {
    _id: doc._id.toHexString(),
    imageId: doc.imageId.toHexString(),
    projectId: doc.projectId.toHexString(),
    label: doc.label,
    shape: doc.shape,
    comment: doc.comment,
    source: doc.source,
    createdAt: doc.createdAt,
  };
}

export async function listAnnotationsForImage(
  imageId: string,
): Promise<Annotation[]> {
  if (!ObjectId.isValid(imageId)) return [];
  const collection = (await db()).collection<AnnotationDoc>("annotations");
  const docs = await collection
    .find({ imageId: new ObjectId(imageId) })
    .sort({ createdAt: 1 })
    .toArray();
  return docs.map(toAnnotation);
}

export async function listAnnotationsForProject(
  projectId: string,
): Promise<Annotation[]> {
  if (!ObjectId.isValid(projectId)) return [];
  const collection = (await db()).collection<AnnotationDoc>("annotations");
  const docs = await collection
    .find({ projectId: new ObjectId(projectId) })
    .sort({ createdAt: 1 })
    .toArray();
  return docs.map(toAnnotation);
}

export async function insertAnnotation(input: {
  imageId: string;
  projectId: string;
  sequenceId: string;
  label: Annotation["label"];
  shape: ShapeDoc;
  comment: string | null;
  source?: Annotation["source"];
}): Promise<Annotation> {
  const doc = {
    imageId: new ObjectId(input.imageId),
    projectId: new ObjectId(input.projectId),
    sequenceId: new ObjectId(input.sequenceId),
    label: input.label,
    shape: input.shape,
    comment: input.comment,
    source: input.source ?? "human",
    createdAt: new Date(),
  };
  const collection = (await db()).collection<Omit<AnnotationDoc, "_id">>(
    "annotations",
  );
  const { insertedId } = await collection.insertOne(doc);
  return toAnnotation({ _id: insertedId, ...doc });
}

export async function deleteAnnotation(
  id: string,
  projectId: string,
): Promise<boolean> {
  if (!ObjectId.isValid(id) || !ObjectId.isValid(projectId)) return false;
  const collection = (await db()).collection("annotations");
  const result = await collection.deleteOne({
    _id: new ObjectId(id),
    projectId: new ObjectId(projectId),
  });
  return result.deletedCount === 1;
}

export async function ensureAnnotationIndexes(): Promise<void> {
  const collection = (await db()).collection("annotations");
  await collection.createIndex({ imageId: 1, createdAt: 1 });
  await collection.createIndex({ projectId: 1 });
  await collection.createIndex({ sequenceId: 1 });
}

export async function countAnnotationsForProject(
  projectId: string,
): Promise<{ normal: number; anomaly: number }> {
  if (!ObjectId.isValid(projectId)) return { normal: 0, anomaly: 0 };
  const collection = (await db()).collection<AnnotationDoc>("annotations");
  const cursor = collection.aggregate<{ _id: Annotation["label"]; count: number }>([
    { $match: { projectId: new ObjectId(projectId) } },
    { $group: { _id: "$label", count: { $sum: 1 } } },
  ]);
  const out = { normal: 0, anomaly: 0 };
  for await (const row of cursor) {
    if (row._id === "normal") out.normal = row.count;
    if (row._id === "anomaly") out.anomaly = row.count;
  }
  return out;
}
