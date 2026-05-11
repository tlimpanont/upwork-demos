import { ObjectId } from "mongodb";
import { db } from "../mongo";
import type { Project } from "../schemas";

type ProjectDoc = {
  _id: ObjectId;
  ownerId: ObjectId;
  name: string;
  description: string | null;
  anomalyDescription?: string | null;
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
    anomalyDescription: doc.anomalyDescription ?? null,
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
  anomalyDescription?: string | null;
  domain: Project["domain"];
}): Promise<Project> {
  const now = new Date();
  const doc = {
    ownerId: new ObjectId(input.ownerId),
    name: input.name,
    description: input.description,
    anomalyDescription: input.anomalyDescription ?? null,
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
  patch: {
    name?: string;
    description?: string | null;
    anomalyDescription?: string | null;
    domain?: Project["domain"];
  },
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

export type ProjectStats = {
  sequences: number;
  images: number;
  annotations: number;
  anomalies: number;
};

// Live count aggregation for the project list card badges. Runs four
// $group queries in parallel and returns a map keyed by projectId. Using
// live counts means a project with deleted images can never show a stale
// non-zero number, and a fresh detection won't trail the cache.
export async function getProjectStats(
  projectIds: string[],
): Promise<Map<string, ProjectStats>> {
  const out = new Map<string, ProjectStats>();
  if (projectIds.length === 0) return out;
  const oids = projectIds
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));
  if (oids.length === 0) return out;
  const dbi = await db();

  const [seqRows, imgRows, annoRows] = await Promise.all([
    dbi
      .collection("sequences")
      .aggregate<{ _id: ObjectId; count: number }>([
        { $match: { projectId: { $in: oids } } },
        { $group: { _id: "$projectId", count: { $sum: 1 } } },
      ])
      .toArray(),
    dbi
      .collection("images")
      .aggregate<{ _id: ObjectId; count: number }>([
        { $match: { projectId: { $in: oids } } },
        { $group: { _id: "$projectId", count: { $sum: 1 } } },
      ])
      .toArray(),
    dbi
      .collection("annotations")
      .aggregate<{
        _id: { projectId: ObjectId; label: "normal" | "anomaly" };
        count: number;
      }>([
        { $match: { projectId: { $in: oids } } },
        {
          $group: {
            _id: { projectId: "$projectId", label: "$label" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray(),
  ]);

  for (const id of projectIds) {
    out.set(id, { sequences: 0, images: 0, annotations: 0, anomalies: 0 });
  }
  for (const row of seqRows) {
    const stats = out.get(row._id.toHexString());
    if (stats) stats.sequences = row.count;
  }
  for (const row of imgRows) {
    const stats = out.get(row._id.toHexString());
    if (stats) stats.images = row.count;
  }
  for (const row of annoRows) {
    const stats = out.get(row._id.projectId.toHexString());
    if (!stats) continue;
    stats.annotations += row.count;
    if (row._id.label === "anomaly") stats.anomalies += row.count;
  }
  return out;
}
