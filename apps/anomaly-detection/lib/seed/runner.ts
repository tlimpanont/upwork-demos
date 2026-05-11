import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { hash } from "bcryptjs";
import { MongoClient, ObjectId, type Db } from "mongodb";
import { put } from "@vercel/blob";

// Shared runner used by both the CLI seed script and the protected admin
// endpoint that the Vercel cron hits nightly. Keeps the behaviour
// identical regardless of which surface invokes it.

const BLOB_PREFIX = "anomaly-detection";

export type SeedOptions = {
  mongoUri: string;
  dbName: string;
  demoEmail: string;
  demoPassword: string;
  demoName?: string;
  // Absolute path to the directory that contains baseline.json and the
  // images/ subdirectory. The CLI passes scripts/baseline; the serverless
  // function passes a path inside the deployed function bundle.
  baselineDir: string;
  // Optional logger; falls through to console.log so the CLI keeps its
  // streaming output.
  log?: (message: string) => void;
};

export type SeedResult = {
  ok: true;
  mode: "baseline" | "fallback";
  projects: number;
  sequences: number;
  images: number;
  annotations: number;
  imagesReuploaded: number;
  imagesSkipped: number;
};

export async function runSeed(opts: SeedOptions): Promise<SeedResult> {
  const log = opts.log ?? ((m: string) => console.log(m));
  const client = new MongoClient(opts.mongoUri);
  try {
    await client.connect();
    const db = client.db(opts.dbName);
    await ensureIndexes(db);

    const ownerId = await upsertDemoUser(db, opts);
    log(`[seed] demo user ${opts.demoEmail} (${ownerId.toHexString()})`);

    const baseline = await tryLoadBaseline(opts.baselineDir);
    if (baseline) {
      return await restoreFromBaseline(db, ownerId, baseline, opts.baselineDir, log);
    }
    return await seedFallback(db, ownerId, log);
  } finally {
    await client.close();
  }
}

async function ensureIndexes(db: Db) {
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("projects").createIndex({ ownerId: 1, updatedAt: -1 });
  await db.collection("sequences").createIndex({ projectId: 1, createdAt: -1 });
  await db.collection("images").createIndex({ sequenceId: 1, capturedAt: 1 });
  await db.collection("images").createIndex({ projectId: 1 });
  await db.collection("annotations").createIndex({ imageId: 1, createdAt: 1 });
  await db.collection("annotations").createIndex({ projectId: 1 });
}

async function upsertDemoUser(
  db: Db,
  opts: SeedOptions,
): Promise<ObjectId> {
  const passwordHash = await hash(opts.demoPassword, 12);
  const users = db.collection("users");
  const result = await users.findOneAndUpdate(
    { email: opts.demoEmail.toLowerCase() },
    {
      $setOnInsert: {
        email: opts.demoEmail.toLowerCase(),
        passwordHash,
        name: opts.demoName ?? "Demo Operator",
        createdAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (!result) throw new Error("Failed to upsert demo user");
  return result._id as ObjectId;
}

type Baseline = {
  version: number;
  generatedAt: string;
  projects: Array<{
    slug: string;
    name: string;
    description: string | null;
    anomalyDescription: string | null;
    domain: string;
  }>;
  sequences: Array<{
    projectSlug: string;
    slug: string;
    name: string;
  }>;
  images: Array<{
    sequenceSlug: string;
    projectSlug: string;
    slug: string;
    bytesFile: string | null;
    width: number;
    height: number;
    capturedAt: string;
  }>;
  annotations: Array<{
    imageSlug: string;
    projectSlug: string;
    sequenceSlug: string;
    label: "normal" | "anomaly";
    shape: unknown;
    comment: string | null;
    source: "human" | "human-correction";
  }>;
};

async function tryLoadBaseline(baselineDir: string): Promise<Baseline | null> {
  try {
    const raw = await readFile(resolve(baselineDir, "baseline.json"), "utf-8");
    return JSON.parse(raw) as Baseline;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function listAvailableImageBytes(baselineDir: string): Promise<Set<string>> {
  try {
    const entries = await readdir(resolve(baselineDir, "images"));
    return new Set(entries);
  } catch {
    return new Set();
  }
}

async function restoreFromBaseline(
  db: Db,
  ownerId: ObjectId,
  baseline: Baseline,
  baselineDir: string,
  log: (m: string) => void,
): Promise<SeedResult> {
  log(
    `[seed] restoring baseline · ${baseline.projects.length} projects · ` +
      `${baseline.sequences.length} sequences · ${baseline.images.length} images · ` +
      `${baseline.annotations.length} annotations`,
  );

  const projects = db.collection("projects");
  const sequences = db.collection("sequences");
  const images = db.collection("images");
  const annotations = db.collection("annotations");

  // Drop the demo user's existing data so re-seeds produce a clean state.
  const oldProjects = await projects
    .find({ ownerId }, { projection: { _id: 1 } })
    .toArray();
  if (oldProjects.length > 0) {
    const ids = oldProjects.map((p) => p._id);
    await Promise.all([
      annotations.deleteMany({ projectId: { $in: ids } }),
      images.deleteMany({ projectId: { $in: ids } }),
      sequences.deleteMany({ projectId: { $in: ids } }),
      db.collection("embeddings").deleteMany({ projectId: { $in: ids } }),
      db.collection("detections").deleteMany({ projectId: { $in: ids } }),
      db.collection("models").deleteMany({ projectId: { $in: ids } }),
      db.collection("pipelineRuns").deleteMany({ projectId: { $in: ids } }),
      projects.deleteMany({ _id: { $in: ids } }),
    ]);
  }

  const availableImageBytes = await listAvailableImageBytes(baselineDir);

  // Slug → ObjectId maps so FKs get rewired as we insert in dependency
  // order (projects → sequences → images → annotations).
  const projectIdBySlug = new Map<string, ObjectId>();
  const sequenceIdBySlug = new Map<string, ObjectId>();
  const imageIdBySlug = new Map<string, ObjectId>();

  const now = new Date();
  for (const p of baseline.projects) {
    const _id = new ObjectId();
    projectIdBySlug.set(p.slug, _id);
    await projects.insertOne({
      _id,
      ownerId,
      name: p.name,
      description: p.description,
      anomalyDescription: p.anomalyDescription,
      domain: p.domain,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const s of baseline.sequences) {
    const projectId = projectIdBySlug.get(s.projectSlug);
    if (!projectId) continue;
    const _id = new ObjectId();
    sequenceIdBySlug.set(s.slug, _id);
    await sequences.insertOne({
      _id,
      projectId,
      name: s.name,
      imageCount: 0,
      createdAt: new Date(),
    });
  }

  const seqImageCount = new Map<string, number>();
  let reuploaded = 0;
  let skippedNoBytes = 0;
  for (const i of baseline.images) {
    const projectId = projectIdBySlug.get(i.projectSlug);
    const sequenceId = sequenceIdBySlug.get(i.sequenceSlug);
    if (!projectId || !sequenceId) continue;

    let blobKey = `${BLOB_PREFIX}/${projectId.toHexString()}/seed-${i.slug}.jpg`;
    if (i.bytesFile && availableImageBytes.has(i.bytesFile)) {
      try {
        const buf = await readFile(resolve(baselineDir, "images", i.bytesFile));
        const key = `${BLOB_PREFIX}/${projectId.toHexString()}/${Date.now()}-${i.slug}.jpg`;
        await put(key, buf, {
          access: "private",
          contentType: "image/jpeg",
          addRandomSuffix: false,
        });
        blobKey = key;
        reuploaded += 1;
      } catch (err) {
        log(
          `[seed] upload failed for ${i.bytesFile}: ${err instanceof Error ? err.message : err}`,
        );
        skippedNoBytes += 1;
      }
    } else {
      skippedNoBytes += 1;
    }

    const _id = new ObjectId();
    imageIdBySlug.set(i.slug, _id);
    await images.insertOne({
      _id,
      sequenceId,
      projectId,
      blobKey,
      width: i.width,
      height: i.height,
      capturedAt: new Date(i.capturedAt),
      uploadedAt: new Date(),
    });
    seqImageCount.set(
      i.sequenceSlug,
      (seqImageCount.get(i.sequenceSlug) ?? 0) + 1,
    );
  }

  for (const [slug, count] of seqImageCount.entries()) {
    const seqId = sequenceIdBySlug.get(slug);
    if (!seqId) continue;
    await sequences.updateOne({ _id: seqId }, { $set: { imageCount: count } });
  }

  let annotationCount = 0;
  for (const a of baseline.annotations) {
    const imageId = imageIdBySlug.get(a.imageSlug);
    const projectId = projectIdBySlug.get(a.projectSlug);
    const sequenceId = sequenceIdBySlug.get(a.sequenceSlug);
    if (!imageId || !projectId || !sequenceId) continue;
    await annotations.insertOne({
      _id: new ObjectId(),
      imageId,
      projectId,
      sequenceId,
      label: a.label,
      shape: a.shape,
      comment: a.comment,
      source: a.source,
      createdAt: new Date(),
    });
    annotationCount += 1;
  }

  log(
    `[seed] restored: ${baseline.projects.length} projects, ` +
      `${baseline.sequences.length} sequences, ` +
      `${reuploaded} images re-uploaded` +
      (skippedNoBytes > 0 ? ` (${skippedNoBytes} without bytes)` : "") +
      `, ${annotationCount} annotations.`,
  );

  return {
    ok: true,
    mode: "baseline",
    projects: baseline.projects.length,
    sequences: baseline.sequences.length,
    images: baseline.images.length,
    annotations: annotationCount,
    imagesReuploaded: reuploaded,
    imagesSkipped: skippedNoBytes,
  };
}

const FALLBACK_PROJECTS = [
  {
    name: "Solar Farm — Module Hotspots",
    description:
      "Thermal imagery of a 12 MW PV array. Train against clean module sweeps from before commissioning, then sweep weekly inspection flights for hotspots, soiling streaks, and PID-pattern shading.",
    domain: "solar" as const,
    sequences: [
      "Baseline sweep — 2025-08-12",
      "Weekly inspection — 2025-09-02",
      "Weekly inspection — 2025-09-09",
    ],
  },
  {
    name: "Manufacturing — Weld Bead Inspection",
    description:
      "Robot-cell stills from the post-weld station. Normal beads form the training set; flag undercut, porosity, and spatter clusters before parts move to paint.",
    domain: "manufacturing" as const,
    sequences: [
      "Line A — Shift 1",
      "Line A — Shift 2",
      "Line B — Calibration run",
    ],
  },
  {
    name: "Medical — Chest X-Ray Triage",
    description:
      "Anonymized chest radiographs for clinician-in-the-loop triage. Trained on radiologist-confirmed normals; surfaces candidate regions for review rather than diagnoses.",
    domain: "medical" as const,
    sequences: ["Cohort A — 2025-Q3", "Cohort B — 2025-Q4"],
  },
];

async function seedFallback(
  db: Db,
  ownerId: ObjectId,
  log: (m: string) => void,
): Promise<SeedResult> {
  log("[seed] no baseline found — seeding fallback skeleton.");
  const projects = db.collection("projects");
  const sequences = db.collection("sequences");
  let projectCount = 0;
  let sequenceCount = 0;

  for (const project of FALLBACK_PROJECTS) {
    const now = new Date();
    const projectDoc = await projects.findOneAndUpdate(
      { ownerId, name: project.name },
      {
        $setOnInsert: {
          ownerId,
          name: project.name,
          description: project.description,
          anomalyDescription: null,
          domain: project.domain,
          createdAt: now,
        },
        $set: { updatedAt: now },
      },
      { upsert: true, returnDocument: "after" },
    );
    if (!projectDoc) continue;
    projectCount += 1;
    const projectId = projectDoc._id as ObjectId;

    for (const seqName of project.sequences) {
      const existing = await sequences.findOne({ projectId, name: seqName });
      if (existing) continue;
      await sequences.insertOne({
        projectId,
        name: seqName,
        imageCount: 0,
        createdAt: new Date(),
      });
      sequenceCount += 1;
    }
  }

  return {
    ok: true,
    mode: "fallback",
    projects: projectCount,
    sequences: sequenceCount,
    images: 0,
    annotations: 0,
    imagesReuploaded: 0,
    imagesSkipped: 0,
  };
}
