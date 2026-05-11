import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { hash } from "bcryptjs";
import { MongoClient, ObjectId, type Db } from "mongodb";
import { put } from "@vercel/blob";
import sharp from "sharp";

// Shared seed runner used by both the CLI (`npm run db:seed`) and the
// protected /api/admin/seed endpoint that the Vercel cron hits nightly.
//
// What the seed does:
//   1. Drop every project-scoped collection (users are preserved).
//   2. Upsert the demo user with a fast 8-round bcrypt hash.
//   3. Create one Solar project + one sequence using hardcoded metadata.
//   4. Re-upload every JPEG under scripts/baseline/images/ to Vercel Blob
//      in parallel and insert the corresponding image rows.
//
// No annotations or detections are seeded — the demo starts with a clean
// workspace so visitors see the full Detect → Annotate → Train loop on
// empty state.

const BLOB_PREFIX = "anomaly-detection";

// Hardcoded project metadata for the one project the demo ships with.
// Edit here to change the seeded title / description / detection rule.
const SOLAR_PROJECT = {
  name: "Solar project",
  description:
    "Thermal sweep of a solar panel array. Demo workspace pre-loaded with 192 chronologically ordered frames — hit Detect on any image to localize hotspots, soot streaks, or other anomalies against the saved detection rule.",
  anomalyDescription: "dark spot, crack, soot streak, debris",
  domain: "solar" as const,
  sequenceName: "Site A",
};

// First frame in the seeded sequence is stamped with this date; subsequent
// frames are stamped one minute later each to keep the chronological
// viewer ordering deterministic.
const SEQUENCE_BASE_DATE = new Date("2026-05-01T09:00:00Z");
const SEQUENCE_FRAME_INTERVAL_MS = 60_000;

export type SeedOptions = {
  mongoUri: string;
  dbName: string;
  demoEmail: string;
  demoPassword: string;
  demoName?: string;
  // Absolute path to the directory that contains the `images/` subfolder
  // with the baseline JPEGs.
  baselineDir: string;
  // Optional logger; defaults to console.log so the CLI sees streaming
  // output and the serverless endpoint can route to its own sink.
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
    await wipeOperationalCollections(db, log);

    const ownerId = await upsertDemoUser(db, opts);
    log(`[seed] demo user ${opts.demoEmail} (${ownerId.toHexString()})`);

    const projectId = await createSolarProject(db, ownerId);
    log(`[seed] project ${SOLAR_PROJECT.name} (${projectId.toHexString()})`);

    const sequenceId = await createSequence(
      db,
      projectId,
      SOLAR_PROJECT.sequenceName,
    );
    log(
      `[seed] sequence ${SOLAR_PROJECT.sequenceName} (${sequenceId.toHexString()})`,
    );

    const { reuploaded, skipped } = await uploadAndInsertImages(
      db,
      projectId,
      sequenceId,
      opts.baselineDir,
      log,
    );

    return {
      ok: true,
      projects: 1,
      sequences: 1,
      images: reuploaded,
      annotations: 0,
      imagesReuploaded: reuploaded,
      imagesSkipped: skipped,
    };
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
}

async function wipeOperationalCollections(
  db: Db,
  log: (m: string) => void,
): Promise<void> {
  log("[seed] dropping all project-scoped data (users preserved).");
  await Promise.all([
    db.collection("annotations").deleteMany({}),
    db.collection("images").deleteMany({}),
    db.collection("sequences").deleteMany({}),
    db.collection("embeddings").deleteMany({}),
    db.collection("detections").deleteMany({}),
    db.collection("models").deleteMany({}),
    db.collection("pipelineRuns").deleteMany({}),
    db.collection("projects").deleteMany({}),
  ]);
}

async function upsertDemoUser(
  db: Db,
  opts: SeedOptions,
): Promise<ObjectId> {
  // 8-round bcrypt: ~60ms compare on Vercel hardware instead of the ~500ms
  // we'd pay at 12 rounds. The demo password is public so a higher cost
  // factor offers no real security benefit.
  const passwordHash = await hash(opts.demoPassword, 8);
  const users = db.collection("users");
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

async function createSolarProject(
  db: Db,
  ownerId: ObjectId,
): Promise<ObjectId> {
  const _id = new ObjectId();
  const now = new Date();
  await db.collection("projects").insertOne({
    _id,
    ownerId,
    name: SOLAR_PROJECT.name,
    description: SOLAR_PROJECT.description,
    anomalyDescription: SOLAR_PROJECT.anomalyDescription,
    domain: SOLAR_PROJECT.domain,
    createdAt: now,
    updatedAt: now,
  });
  return _id;
}

async function createSequence(
  db: Db,
  projectId: ObjectId,
  name: string,
): Promise<ObjectId> {
  const _id = new ObjectId();
  await db.collection("sequences").insertOne({
    _id,
    projectId,
    name,
    imageCount: 0,
    createdAt: new Date(),
  });
  return _id;
}

// Worker-pool image upload + bulk Mongo insert. The dominant cost is the
// blob round trip; 10 concurrent uploads cuts wall time from ~60-120s to
// ~10-15s for 192 frames.
const UPLOAD_CONCURRENCY = 10;

async function uploadAndInsertImages(
  db: Db,
  projectId: ObjectId,
  sequenceId: ObjectId,
  baselineDir: string,
  log: (m: string) => void,
): Promise<{ reuploaded: number; skipped: number }> {
  const imagesDir = resolve(baselineDir, "images");
  let filenames: string[];
  try {
    filenames = (await readdir(imagesDir)).filter((f) =>
      /\.(jpe?g|png|webp)$/i.test(f),
    );
  } catch {
    log(`[seed] no images directory at ${imagesDir}; skipping.`);
    return { reuploaded: 0, skipped: 0 };
  }
  // Deterministic order so capturedAt timestamps line up with filenames
  // across re-seeds.
  filenames.sort();

  if (filenames.length === 0) {
    log(`[seed] images directory is empty; skipping.`);
    return { reuploaded: 0, skipped: 0 };
  }

  type Pending = { idx: number; filename: string };
  const queue: Pending[] = filenames.map((filename, idx) => ({
    idx,
    filename,
  }));

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
  const imageDocs: ImageDoc[] = [];
  let reuploaded = 0;
  let skipped = 0;
  let cursor = 0;
  let lastLogged = 0;
  const seedTs = Date.now();
  const total = queue.length;

  const workers = Array.from({
    length: Math.min(UPLOAD_CONCURRENCY, total),
  }).map(async () => {
    while (cursor < total) {
      const idx = cursor++;
      const { filename } = queue[idx];
      try {
        const buf = await readFile(resolve(imagesDir, filename));
        // Read dimensions from the rotated (post-EXIF) bytes so what we
        // store matches what the vision model and Konva canvas later see.
        const meta = await sharp(buf).rotate().metadata();
        const width = meta.width ?? 0;
        const height = meta.height ?? 0;
        if (!width || !height) {
          log(`[seed] skipping ${filename} (unreadable dimensions)`);
          skipped += 1;
          continue;
        }
        const key = `${BLOB_PREFIX}/${projectId.toHexString()}/${seedTs}-${idx
          .toString()
          .padStart(4, "0")}.jpg`;
        await put(key, buf, {
          access: "private",
          contentType: "image/jpeg",
          addRandomSuffix: false,
        });
        imageDocs.push({
          _id: new ObjectId(),
          sequenceId,
          projectId,
          blobKey: key,
          width,
          height,
          capturedAt: new Date(
            SEQUENCE_BASE_DATE.getTime() + idx * SEQUENCE_FRAME_INTERVAL_MS,
          ),
          uploadedAt: new Date(),
        });
        reuploaded += 1;
      } catch (err) {
        log(
          `[seed] upload failed for ${filename}: ${err instanceof Error ? err.message : err}`,
        );
        skipped += 1;
      }
      const done = reuploaded + skipped;
      if (done - lastLogged >= 20 || done === total) {
        lastLogged = done;
        log(`[seed]   uploaded ${done}/${total} images`);
      }
    }
  });
  await Promise.all(workers);

  if (imageDocs.length > 0) {
    await db.collection("images").insertMany(imageDocs, { ordered: false });
    await db
      .collection("sequences")
      .updateOne(
        { _id: sequenceId },
        { $set: { imageCount: imageDocs.length } },
      );
  }

  return { reuploaded, skipped };
}
