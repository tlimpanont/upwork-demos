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

// Clears AI-sourced annotations for an image. Used before persisting a
// fresh detection run so the canvas always reflects the latest model output
// instead of stacking suggestions on top of each other.
export async function deleteAiAnnotationsForImage(
  imageId: string,
): Promise<number> {
  if (!ObjectId.isValid(imageId)) return 0;
  const collection = (await db()).collection("annotations");
  const result = await collection.deleteMany({
    imageId: new ObjectId(imageId),
    source: "ai",
  });
  return result.deletedCount;
}

// Pulls a small set of reviewer-confirmed anomaly annotations from the
// project to feed the vision model as few-shot visual examples. We
// deliberately exclude "ai" source — only annotations the human has
// drawn or accepted — so the model learns from confirmed ground truth.
export async function listReferenceAnomalies(
  projectId: string,
  limit = 3,
): Promise<
  Array<{
    imageId: string;
    bbox: { x: number; y: number; width: number; height: number };
  }>
> {
  if (!ObjectId.isValid(projectId)) return [];
  const collection = (await db()).collection<AnnotationDoc>("annotations");
  const docs = await collection
    .find({
      projectId: new ObjectId(projectId),
      label: "anomaly",
      source: { $in: ["human", "human-correction"] },
      "shape.type": "bounding_box",
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  const out: Array<{
    imageId: string;
    bbox: { x: number; y: number; width: number; height: number };
  }> = [];
  for (const d of docs) {
    if (d.shape.type !== "bounding_box") continue;
    out.push({
      imageId: d.imageId.toHexString(),
      bbox: {
        x: d.shape.x,
        y: d.shape.y,
        width: d.shape.width,
        height: d.shape.height,
      },
    });
  }
  return out;
}

// Locks an AI suggestion in as reviewer-confirmed ground truth. The
// annotation flips from source="ai" to "human-correction" so it survives
// the next detect run and feeds training as a sign-off.
export async function promoteAiAnnotation(
  id: string,
  projectId: string,
): Promise<boolean> {
  if (!ObjectId.isValid(id) || !ObjectId.isValid(projectId)) return false;
  const collection = (await db()).collection("annotations");
  const result = await collection.updateOne(
    {
      _id: new ObjectId(id),
      projectId: new ObjectId(projectId),
      source: "ai",
    },
    { $set: { source: "human-correction" } },
  );
  return result.modifiedCount === 1;
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
