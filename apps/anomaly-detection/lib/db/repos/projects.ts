import { ObjectId } from "mongodb";
import { db } from "../mongo";
import type { Project } from "../schemas";

type ProjectDoc = {
  _id: ObjectId;
  ownerId: ObjectId;
  name: string;
  description: string | null;
  domain: Project["domain"];
  createdAt: Date;
  updatedAt: Date;
};

function toProject(doc: ProjectDoc): Project {
  return {
    _id: doc._id.toHexString(),
    ownerId: doc.ownerId.toHexString(),
    name: doc.name,
    description: doc.description,
    domain: doc.domain,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listProjectsForOwner(ownerId: string): Promise<Project[]> {
  const collection = (await db()).collection<ProjectDoc>("projects");
  const docs = await collection
    .find({ ownerId: new ObjectId(ownerId) })
    .sort({ updatedAt: -1 })
    .toArray();
  return docs.map(toProject);
}

export async function findProjectById(
  id: string,
  ownerId: string,
): Promise<Project | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = (await db()).collection<ProjectDoc>("projects");
  const doc = await collection.findOne({
    _id: new ObjectId(id),
    ownerId: new ObjectId(ownerId),
  });
  return doc ? toProject(doc) : null;
}

export async function insertProject(input: {
  ownerId: string;
  name: string;
  description: string | null;
  domain: Project["domain"];
}): Promise<Project> {
  const now = new Date();
  const doc = {
    ownerId: new ObjectId(input.ownerId),
    name: input.name,
    description: input.description,
    domain: input.domain,
    createdAt: now,
    updatedAt: now,
  };
  const collection = (await db()).collection<Omit<ProjectDoc, "_id">>("projects");
  const { insertedId } = await collection.insertOne(doc);
  return toProject({ _id: insertedId, ...doc });
}

export async function updateProject(
  id: string,
  ownerId: string,
  patch: { name?: string; description?: string | null; domain?: Project["domain"] },
): Promise<Project | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = (await db()).collection<ProjectDoc>("projects");
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id), ownerId: new ObjectId(ownerId) },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return result ? toProject(result) : null;
}

export async function deleteProject(
  id: string,
  ownerId: string,
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const collection = (await db()).collection<ProjectDoc>("projects");
  const result = await collection.deleteOne({
    _id: new ObjectId(id),
    ownerId: new ObjectId(ownerId),
  });
  return result.deletedCount === 1;
}

export async function ensureProjectIndexes(): Promise<void> {
  const collection = (await db()).collection("projects");
  await collection.createIndex({ ownerId: 1, updatedAt: -1 });
}
