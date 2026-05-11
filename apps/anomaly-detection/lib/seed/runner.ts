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
    if (!baseline) {
      throw new Error(
        `Baseline not found at ${opts.baselineDir}/baseline.json. ` +
          "Run `npm run db:dump` first or restore the file from the repo.",
      );
    }
    return await restoreFromBaseline(db, ownerId, baseline, opts.baselineDir, log);
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
  // Lower bcrypt cost factor for the public demo user. bcryptjs is pure JS
  // and runs ~10× slower than native bcrypt; at the default 12 rounds the
  // compare on every demo login takes ~500–800ms on Vercel hardware,
  // which is the main reason the "Sign in as demo" button feels sluggish.
  // The demo password is publicly published in the README anyway, so a
  // smaller cost factor doesn't reduce real security here.
  const passwordHash = await hash(opts.demoPassword, 8);
  const users = db.collection("users");
  // Replace the password hash on every seed so a stale 12-round hash from
  // an older seed gets refreshed to the faster 8-round one.
  const result = await users.findOneAndUpdate(
    { email: opts.demoEmail.toLowerCase() },
    {
      $set: { passwordHash },
      $setOnInsert: {
        email: opts.demoEmail.toLowerCase(),
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

  // Wipe every operational collection regardless of owner. Anything that
  // accumulated from previous sessions — orphaned projects, half-trained
  // models, AI annotations, pipeline runs — gets removed so the seed
  // produces a single deterministic state. The `users` collection is the
  // one thing we keep, so registered accounts survive the reset.
  log("[seed] dropping all project-scoped data (users preserved).");
  await Promise.all([
    annotations.deleteMany({}),
    images.deleteMany({}),
    sequences.deleteMany({}),
    db.collection("embeddings").deleteMany({}),
    db.collection("detections").deleteMany({}),
    db.collection("models").deleteMany({}),
    db.collection("pipelineRuns").deleteMany({}),
    projects.deleteMany({}),
  ]);

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

  // Images: re-upload in parallel with a worker pool, then bulk-insert the
  // Mongo rows. The dominant cost is the round trip to Vercel Blob — at 10
  // concurrent uploads, 192 images go through in ~10-15s instead of the
  // ~60-120s the sequential loop took.
  type PendingImage = {
    _id: ObjectId;
    sequenceId: ObjectId;
    projectId: ObjectId;
    blobKey: string;
    width: number;
    height: number;
    capturedAt: Date;
    uploadedAt: Date;
  };
  const imageDocs: PendingImage[] = [];
  const seqImageCount = new Map<string, number>();
  let reuploaded = 0;
  let skippedNoBytes = 0;
  const seedTs = Date.now();

  const queue = baseline.images
    .map((i) => {
      const projectId = projectIdBySlug.get(i.projectSlug);
      const sequenceId = sequenceIdBySlug.get(i.sequenceSlug);
      if (!projectId || !sequenceId) return null;
      return { i, projectId, sequenceId };
    })
    .filter(
      (
        x,
      ): x is {
        i: Baseline["images"][number];
        projectId: ObjectId;
        sequenceId: ObjectId;
      } => x !== null,
    );

  // Reserve image _ids up front so the seqImageCount + annotation FK maps
  // can be built without waiting for uploads to finish.
  for (const { i } of queue) {
    imageIdBySlug.set(i.slug, new ObjectId());
    seqImageCount.set(
      i.sequenceSlug,
      (seqImageCount.get(i.sequenceSlug) ?? 0) + 1,
    );
  }

  const CONCURRENCY = 10;
  let cursor = 0;
  let lastLogged = 0;
  const total = queue.length;
  const workers = Array.from({ length: Math.min(CONCURRENCY, total) }).map(
    async () => {
      while (cursor < total) {
        const idx = cursor++;
        const { i, projectId, sequenceId } = queue[idx];
        const _id = imageIdBySlug.get(i.slug)!;
        let blobKey = `${BLOB_PREFIX}/${projectId.toHexString()}/seed-${i.slug}.jpg`;
        if (i.bytesFile && availableImageBytes.has(i.bytesFile)) {
          try {
            const buf = await readFile(
              resolve(baselineDir, "images", i.bytesFile),
            );
            const key = `${BLOB_PREFIX}/${projectId.toHexString()}/${seedTs}-${i.slug}.jpg`;
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
        imageDocs.push({
          _id,
          sequenceId,
          projectId,
          blobKey,
          width: i.width,
          height: i.height,
          capturedAt: new Date(i.capturedAt),
          uploadedAt: new Date(),
        });

        // Sparse progress log so the JobsClient (or CLI) shows movement
        // without spamming the console.
        const done = imageDocs.length;
        if (done - lastLogged >= 20 || done === total) {
          lastLogged = done;
          log(`[seed]   uploaded ${done}/${total} images`);
        }
      }
    },
  );
  await Promise.all(workers);

  if (imageDocs.length > 0) {
    await images.insertMany(imageDocs, { ordered: false });
  }

  // Update sequence counts in one go.
  await Promise.all(
    [...seqImageCount.entries()].map(([slug, count]) => {
      const seqId = sequenceIdBySlug.get(slug);
      if (!seqId) return Promise.resolve();
      return sequences.updateOne({ _id: seqId }, { $set: { imageCount: count } });
    }),
  );

  // Annotations: bulk insert. Skip rows whose parent images/sequences were
  // dropped (defensive — shouldn't happen with the filtered baseline).
  const annotationDocs = baseline.annotations
    .map((a) => {
      const imageId = imageIdBySlug.get(a.imageSlug);
      const projectId = projectIdBySlug.get(a.projectSlug);
      const sequenceId = sequenceIdBySlug.get(a.sequenceSlug);
      if (!imageId || !projectId || !sequenceId) return null;
      return {
        _id: new ObjectId(),
        imageId,
        projectId,
        sequenceId,
        label: a.label,
        shape: a.shape,
        comment: a.comment,
        source: a.source,
        createdAt: new Date(),
      };
    })
    .filter((d) => d !== null) as Array<{
    _id: ObjectId;
    imageId: ObjectId;
    projectId: ObjectId;
    sequenceId: ObjectId;
    label: "normal" | "anomaly";
    shape: unknown;
    comment: string | null;
    source: "human" | "human-correction";
    createdAt: Date;
  }>;
  if (annotationDocs.length > 0) {
    await annotations.insertMany(annotationDocs, { ordered: false });
  }
  const annotationCount = annotationDocs.length;

  log(
    `[seed] restored: ${baseline.projects.length} projects, ` +
      `${baseline.sequences.length} sequences, ` +
      `${reuploaded} images re-uploaded` +
      (skippedNoBytes > 0 ? ` (${skippedNoBytes} without bytes)` : "") +
      `, ${annotationCount} annotations.`,
  );

  return {
    ok: true,
    projects: baseline.projects.length,
    sequences: baseline.sequences.length,
    images: baseline.images.length,
    annotations: annotationCount,
    imagesReuploaded: reuploaded,
    imagesSkipped: skippedNoBytes,
  };
}

