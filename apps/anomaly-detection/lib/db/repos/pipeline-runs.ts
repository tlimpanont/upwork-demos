import { ObjectId } from "mongodb";
import { db } from "../mongo";
import type { PipelinePhase, PipelineRun } from "../schemas";

// Mongo-side doc shape: ObjectIds for the foreign keys, dates as Date.
type PipelinePhaseDoc = Omit<PipelinePhase, "startedAt" | "finishedAt"> & {
  startedAt: Date | null;
  finishedAt: Date | null;
};

type PipelineRunDoc = {
  _id: ObjectId;
  projectId: ObjectId;
  kind: PipelineRun["kind"];
  status: PipelineRun["status"];
  imageId: ObjectId | null;
  detectionId: ObjectId | null;
  modelId: ObjectId | null;
  summary: string | null;
  phases: PipelinePhaseDoc[];
  error: string | null;
  startedAt: Date;
  finishedAt: Date | null;
};

function toRun(doc: PipelineRunDoc): PipelineRun {
  return {
    _id: doc._id.toHexString(),
    projectId: doc.projectId.toHexString(),
    kind: doc.kind,
    status: doc.status,
    imageId: doc.imageId ? doc.imageId.toHexString() : null,
    detectionId: doc.detectionId ? doc.detectionId.toHexString() : null,
    modelId: doc.modelId ? doc.modelId.toHexString() : null,
    summary: doc.summary,
    phases: doc.phases,
    error: doc.error,
    startedAt: doc.startedAt,
    finishedAt: doc.finishedAt,
  };
}

export async function insertPipelineRun(input: {
  projectId: string;
  kind: PipelineRun["kind"];
  imageId?: string | null;
  modelId?: string | null;
  summary?: string | null;
}): Promise<PipelineRun> {
  const doc: Omit<PipelineRunDoc, "_id"> = {
    projectId: new ObjectId(input.projectId),
    kind: input.kind,
    status: "running",
    imageId: input.imageId ? new ObjectId(input.imageId) : null,
    detectionId: null,
    modelId: input.modelId ? new ObjectId(input.modelId) : null,
    summary: input.summary ?? null,
    phases: [],
    error: null,
    startedAt: new Date(),
    finishedAt: null,
  };
  const collection = (await db()).collection<Omit<PipelineRunDoc, "_id">>(
    "pipelineRuns",
  );
  const { insertedId } = await collection.insertOne(doc);
  return toRun({ _id: insertedId, ...doc });
}

// Upsert a phase by name. If a phase with that name already exists, patch
// its state/detail/meta and (if transitioning to "running" for the first
// time) stamp startedAt; if transitioning to a terminal state, stamp
// finishedAt. If the phase doesn't exist yet, append it.
export async function upsertPipelinePhase(
  runId: string,
  phase: {
    name: string;
    label: string;
    state: PipelinePhase["state"];
    detail?: string | null;
    meta?: Record<string, unknown> | null;
  },
): Promise<void> {
  if (!ObjectId.isValid(runId)) return;
  const now = new Date();
  const collection = (await db()).collection<PipelineRunDoc>("pipelineRuns");
  const _id = new ObjectId(runId);
  const existing = await collection.findOne({ _id });
  if (!existing) return;

  const idx = existing.phases.findIndex((p) => p.name === phase.name);
  if (idx === -1) {
    const newPhase: PipelinePhaseDoc = {
      name: phase.name,
      label: phase.label,
      state: phase.state,
      startedAt: phase.state === "pending" ? null : now,
      finishedAt:
        phase.state === "done" || phase.state === "failed" || phase.state === "skipped"
          ? now
          : null,
      detail: phase.detail ?? null,
      meta: phase.meta ?? null,
    };
    await collection.updateOne(
      { _id },
      { $push: { phases: newPhase } },
    );
    return;
  }

  const current = existing.phases[idx];
  const set: Record<string, unknown> = {
    [`phases.${idx}.state`]: phase.state,
    [`phases.${idx}.label`]: phase.label,
  };
  if (phase.detail !== undefined) {
    set[`phases.${idx}.detail`] = phase.detail;
  }
  if (phase.meta !== undefined) {
    set[`phases.${idx}.meta`] = phase.meta;
  }
  if (current.startedAt === null && phase.state !== "pending") {
    set[`phases.${idx}.startedAt`] = now;
  }
  if (
    current.finishedAt === null &&
    (phase.state === "done" || phase.state === "failed" || phase.state === "skipped")
  ) {
    set[`phases.${idx}.finishedAt`] = now;
  }
  await collection.updateOne({ _id }, { $set: set });
}

export async function completePipelineRun(
  runId: string,
  input: {
    detectionId?: string | null;
    modelId?: string | null;
    summary?: string | null;
  } = {},
): Promise<void> {
  if (!ObjectId.isValid(runId)) return;
  const collection = (await db()).collection<PipelineRunDoc>("pipelineRuns");
  const set: Record<string, unknown> = {
    status: "completed",
    finishedAt: new Date(),
  };
  if (input.detectionId !== undefined) {
    set.detectionId = input.detectionId ? new ObjectId(input.detectionId) : null;
  }
  if (input.modelId !== undefined) {
    set.modelId = input.modelId ? new ObjectId(input.modelId) : null;
  }
  if (input.summary !== undefined) set.summary = input.summary;
  await collection.updateOne({ _id: new ObjectId(runId) }, { $set: set });
}

export async function failPipelineRun(
  runId: string,
  error: string,
): Promise<void> {
  if (!ObjectId.isValid(runId)) return;
  const collection = (await db()).collection<PipelineRunDoc>("pipelineRuns");
  await collection.updateOne(
    { _id: new ObjectId(runId) },
    {
      $set: {
        status: "failed",
        error: error.slice(0, 2000),
        finishedAt: new Date(),
      },
    },
  );
}

export async function listPipelineRunsForProject(
  projectId: string,
  limit = 50,
): Promise<PipelineRun[]> {
  if (!ObjectId.isValid(projectId)) return [];
  const collection = (await db()).collection<PipelineRunDoc>("pipelineRuns");
  const docs = await collection
    .find({ projectId: new ObjectId(projectId) })
    .sort({ startedAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(toRun);
}

export async function countActiveRunsForProject(
  projectId: string,
): Promise<number> {
  if (!ObjectId.isValid(projectId)) return 0;
  const collection = (await db()).collection<PipelineRunDoc>("pipelineRuns");
  return collection.countDocuments({
    projectId: new ObjectId(projectId),
    status: "running",
  });
}

export async function ensurePipelineRunIndexes(): Promise<void> {
  const collection = (await db()).collection("pipelineRuns");
  await collection.createIndex({ projectId: 1, startedAt: -1 });
  await collection.createIndex({ projectId: 1, status: 1 });
}
