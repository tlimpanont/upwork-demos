import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { MongoClient, ObjectId } from "mongodb";
import { get } from "@vercel/blob";

// Snapshots the current Mongo + Vercel Blob state into
// scripts/baseline/ as the demo's starting point. The companion seed
// script (`scripts/seed.ts`) restores from these files.
//
// What gets dumped:
//   - Every project + its description, rule, and domain
//   - Every sequence under those projects
//   - Every image (metadata + the raw bytes downloaded from blob storage)
//   - Every annotation
// What gets dropped (intentionally — too noisy / installation-specific):
//   - Users (the seed always restores to a single demo account)
//   - Embeddings, models, detections, pipelineRuns (re-created at runtime)
//
// The owner of every project is rewritten to a placeholder slug so the
// seed can re-attribute everything to whichever demo user it creates.

const BASELINE_DIR = resolve(__dirname, "baseline");
const IMAGES_DIR = resolve(BASELINE_DIR, "images");

type ProjectDoc = {
  _id: ObjectId;
  ownerId: ObjectId;
  name: string;
  description: string | null;
  anomalyDescription?: string | null;
  domain: string;
  createdAt: Date;
  updatedAt: Date;
};

type SequenceDoc = {
  _id: ObjectId;
  projectId: ObjectId;
  name: string;
  imageCount: number;
  createdAt: Date;
};

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

type AnnotationDoc = {
  _id: ObjectId;
  imageId: ObjectId;
  projectId: ObjectId;
  sequenceId: ObjectId;
  label: "normal" | "anomaly";
  shape: unknown;
  comment: string | null;
  source: "human" | "ai" | "human-correction";
  createdAt: Date;
};

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn(
      "[dump] BLOB_READ_WRITE_TOKEN not set — image bytes will be skipped (metadata still dumped).",
    );
  }
  const dbName = process.env.MONGODB_DB ?? "anomaly_detection";
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(dbName);

    const projects = await db
      .collection<ProjectDoc>("projects")
      .find({})
      .toArray();
    if (projects.length === 0) {
      console.log("[dump] no projects found — nothing to dump.");
      return;
    }
    const projectIds = projects.map((p) => p._id);

    const [sequences, images, annotations] = await Promise.all([
      db
        .collection<SequenceDoc>("sequences")
        .find({ projectId: { $in: projectIds } })
        .toArray(),
      db
        .collection<ImageDoc>("images")
        .find({ projectId: { $in: projectIds } })
        .toArray(),
      db
        .collection<AnnotationDoc>("annotations")
        .find({ projectId: { $in: projectIds } })
        .toArray(),
    ]);

    await mkdir(IMAGES_DIR, { recursive: true });

    // Download blob bytes for every image so the seed can re-upload them
    // into whatever blob store the next operator is using.
    const failed: string[] = [];
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      for (const img of images) {
        try {
          const result = await get(img.blobKey, { access: "private" });
          if (!result || result.statusCode !== 200) {
            failed.push(img.blobKey);
            continue;
          }
          const buffer = Buffer.from(
            await new Response(result.stream).arrayBuffer(),
          );
          const filename = `${img._id.toHexString()}.jpg`;
          await writeFile(resolve(IMAGES_DIR, filename), buffer);
        } catch (err) {
          failed.push(
            `${img.blobKey} (${err instanceof Error ? err.message : "error"})`,
          );
        }
      }
    }

    const baseline = {
      version: 1,
      generatedAt: new Date().toISOString(),
      projects: projects.map((p) => ({
        // Stable slug we can reuse to upsert without colliding on ObjectId.
        slug: p._id.toHexString(),
        name: p.name,
        description: p.description,
        anomalyDescription: p.anomalyDescription ?? null,
        domain: p.domain,
      })),
      sequences: sequences.map((s) => ({
        projectSlug: s.projectId.toHexString(),
        slug: s._id.toHexString(),
        name: s.name,
      })),
      images: images.map((i) => ({
        sequenceSlug: i.sequenceId.toHexString(),
        projectSlug: i.projectId.toHexString(),
        slug: i._id.toHexString(),
        // The seed re-uploads from this filename; null when the bytes
        // couldn't be downloaded (no blob token, missing object, etc.).
        bytesFile: process.env.BLOB_READ_WRITE_TOKEN
          ? `${i._id.toHexString()}.jpg`
          : null,
        width: i.width,
        height: i.height,
        capturedAt: i.capturedAt.toISOString(),
      })),
      annotations: annotations.map((a) => ({
        imageSlug: a.imageId.toHexString(),
        projectSlug: a.projectId.toHexString(),
        sequenceSlug: a.sequenceId.toHexString(),
        label: a.label,
        shape: a.shape,
        comment: a.comment,
        // Promote "ai" annotations to "human-correction" on dump so a
        // freshly seeded demo starts with confirmed ground truth and no
        // stale machine output that will get wiped on the first detect.
        source:
          a.source === "ai" ? ("human-correction" as const) : a.source,
      })),
    };

    await writeFile(
      resolve(BASELINE_DIR, "baseline.json"),
      JSON.stringify(baseline, null, 2),
    );

    console.log(
      `[dump] wrote ${projects.length} projects · ${sequences.length} sequences · ` +
        `${images.length} images · ${annotations.length} annotations`,
    );
    if (failed.length > 0) {
      console.warn(
        `[dump] ${failed.length} image bytes could not be downloaded:`,
      );
      for (const f of failed) console.warn("  -", f);
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
