import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { hash } from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";
import { put } from "@vercel/blob";

// Seeds the demo account.
//
// Two modes:
//   - If scripts/baseline/baseline.json exists, restore the snapshot
//     produced by `npm run db:dump`. The snapshot includes projects,
//     sequences, images, and annotations from the original session; the
//     companion image bytes under scripts/baseline/images/ are re-uploaded
//     into the current blob store and freshly-issued blob keys are
//     written into the new image rows.
//   - Otherwise, fall back to the hardcoded 3-project skeleton (legacy
//     behaviour from before the dump/restore workflow existed).
//
// In both modes the script upserts a single demo user
// (demo@anomaly.local / demo1234 by default) and re-attributes every
// project to that owner.

type ProjectSeed = {
  name: string;
  description: string;
  domain: "solar" | "manufacturing" | "medical";
  sequences: string[];
};

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL ?? "demo@anomaly.local";
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? "demo1234";
const DEMO_NAME = "Demo Operator";

const BASELINE_DIR = resolve(__dirname, "baseline");
const BASELINE_FILE = resolve(BASELINE_DIR, "baseline.json");
const IMAGES_DIR = resolve(BASELINE_DIR, "images");
const BLOB_PREFIX = "anomaly-detection";

const FALLBACK_PROJECTS: ProjectSeed[] = [
  {
    name: "Solar Farm — Module Hotspots",
    description:
      "Thermal imagery of a 12 MW PV array. Train against clean module sweeps from before commissioning, then sweep weekly inspection flights for hotspots, soiling streaks, and PID-pattern shading.",
    domain: "solar",
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
    domain: "manufacturing",
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
    domain: "medical",
    sequences: ["Cohort A — 2025-Q3", "Cohort B — 2025-Q4"],
  },
];

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }
  const dbName = process.env.MONGODB_DB ?? "anomaly_detection";
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(dbName);
    await ensureIndexes(db);

    const ownerId = await upsertDemoUser(db);
    console.log(`[seed] demo user ${DEMO_EMAIL} (${ownerId.toHexString()})`);

    const baseline = await tryLoadBaseline();
    if (baseline) {
      await restoreFromBaseline(db, ownerId, baseline);
    } else {
      await seedFallback(db, ownerId);
    }

    console.log(
      `[seed] done. Sign in as ${DEMO_EMAIL} / ${DEMO_PASSWORD} to walk the demo.`,
    );
  } finally {
    await client.close();
  }
}

async function ensureIndexes(db: import("mongodb").Db) {
  await db
    .collection("users")
    .createIndex({ email: 1 }, { unique: true });
  await db
    .collection("projects")
    .createIndex({ ownerId: 1, updatedAt: -1 });
  await db
    .collection("sequences")
    .createIndex({ projectId: 1, createdAt: -1 });
  await db.collection("images").createIndex({ sequenceId: 1, capturedAt: 1 });
  await db.collection("images").createIndex({ projectId: 1 });
  await db.collection("annotations").createIndex({ imageId: 1, createdAt: 1 });
  await db.collection("annotations").createIndex({ projectId: 1 });
}

async function upsertDemoUser(db: import("mongodb").Db): Promise<ObjectId> {
  const passwordHash = await hash(DEMO_PASSWORD, 12);
  const users = db.collection("users");
  const result = await users.findOneAndUpdate(
    { email: DEMO_EMAIL.toLowerCase() },
    {
      $setOnInsert: {
        email: DEMO_EMAIL.toLowerCase(),
        passwordHash,
        name: DEMO_NAME,
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

async function tryLoadBaseline(): Promise<Baseline | null> {
  try {
    const raw = await readFile(BASELINE_FILE, "utf-8");
    return JSON.parse(raw) as Baseline;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function restoreFromBaseline(
  db: import("mongodb").Db,
  ownerId: ObjectId,
  baseline: Baseline,
): Promise<void> {
  console.log(
    `[seed] restoring baseline · ${baseline.projects.length} projects · ` +
      `${baseline.sequences.length} sequences · ${baseline.images.length} images · ` +
      `${baseline.annotations.length} annotations`,
  );

  // Drop existing demo data so a re-seed produces a clean state.
  const projects = db.collection("projects");
  const sequences = db.collection("sequences");
  const images = db.collection("images");
  const annotations = db.collection("annotations");
  const oldProjectIds = await projects
    .find({ ownerId }, { projection: { _id: 1 } })
    .toArray();
  if (oldProjectIds.length > 0) {
    const ids = oldProjectIds.map((p) => p._id);
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

  const availableImageBytes = await listAvailableImageBytes();

  // Slug → ObjectId maps so we can rewire FKs as we insert in dependency
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

  const seqCountByProject = new Map<string, number>();
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
    seqCountByProject.set(s.projectSlug, 0);
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
        const buf = await readFile(resolve(IMAGES_DIR, i.bytesFile));
        const key = `${BLOB_PREFIX}/${projectId.toHexString()}/${Date.now()}-${i.slug}.jpg`;
        await put(key, buf, {
          access: "private",
          contentType: "image/jpeg",
          addRandomSuffix: false,
        });
        blobKey = key;
        reuploaded += 1;
      } catch (err) {
        console.warn(
          `[seed] upload failed for ${i.bytesFile}:`,
          err instanceof Error ? err.message : err,
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
    seqImageCount.set(i.sequenceSlug, (seqImageCount.get(i.sequenceSlug) ?? 0) + 1);
  }

  // Sync sequence.imageCount with what we actually inserted.
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

  console.log(
    `[seed] restored: ${baseline.projects.length} projects, ` +
      `${baseline.sequences.length} sequences, ` +
      `${reuploaded} images re-uploaded` +
      (skippedNoBytes > 0 ? ` (${skippedNoBytes} without bytes)` : "") +
      `, ${annotationCount} annotations.`,
  );
}

async function listAvailableImageBytes(): Promise<Set<string>> {
  try {
    const entries = await readdir(IMAGES_DIR);
    return new Set(entries);
  } catch {
    return new Set();
  }
}

async function seedFallback(
  db: import("mongodb").Db,
  ownerId: ObjectId,
): Promise<void> {
  console.log("[seed] no baseline found — seeding fallback skeleton.");
  const projects = db.collection("projects");
  const sequences = db.collection("sequences");

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
    const projectId = projectDoc._id as ObjectId;
    console.log(`[seed]   project ${project.name}`);

    for (const seqName of project.sequences) {
      const existing = await sequences.findOne({ projectId, name: seqName });
      if (existing) continue;
      await sequences.insertOne({
        projectId,
        name: seqName,
        imageCount: 0,
        createdAt: new Date(),
      });
      console.log(`[seed]     sequence ${seqName}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
