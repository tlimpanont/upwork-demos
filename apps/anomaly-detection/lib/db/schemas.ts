import { z } from "zod";

// String IDs at the boundary; ObjectId only inside the driver layer.
export const ObjectIdString = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const UserSchema = z.object({
  _id: ObjectIdString,
  email: z.string().email(),
  passwordHash: z.string().min(20),
  name: z.string().min(1).nullable(),
  createdAt: z.date(),
});
export type User = z.infer<typeof UserSchema>;
export type SafeUser = Pick<User, "_id" | "email" | "name">;

export const ProjectSchema = z.object({
  _id: ObjectIdString,
  ownerId: ObjectIdString,
  name: z.string().min(1).max(120),
  description: z.string().max(2000).nullable(),
  // Natural-language description of what counts as anomalous in this project.
  // Drives zero-shot detection when no annotations exist; refines the
  // centroid-based detector when annotations are present.
  anomalyDescription: z.string().max(2000).nullable().default(null),
  domain: z
    .enum(["solar", "manufacturing", "medical", "security", "agriculture", "other"])
    .default("other"),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const SequenceSchema = z.object({
  _id: ObjectIdString,
  projectId: ObjectIdString,
  name: z.string().min(1).max(120),
  imageCount: z.number().int().min(0).default(0),
  createdAt: z.date(),
});
export type Sequence = z.infer<typeof SequenceSchema>;

export const ImageSchema = z.object({
  _id: ObjectIdString,
  sequenceId: ObjectIdString,
  projectId: ObjectIdString,
  // Reference Vercel Blob via a relative key; never expose the raw URL to clients.
  blobKey: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  // Caller-supplied chronological timestamp (filename, EXIF, or upload order).
  capturedAt: z.date(),
  uploadedAt: z.date(),
});
export type Image = z.infer<typeof ImageSchema>;

const BoundingBoxPoints = z.object({
  type: z.literal("bounding_box"),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
});

const PolygonPoints = z.object({
  type: z.literal("polygon"),
  points: z.array(z.object({ x: z.number(), y: z.number() })).min(3),
});

export const AnnotationSchema = z.object({
  _id: ObjectIdString,
  imageId: ObjectIdString,
  projectId: ObjectIdString,
  label: z.enum(["normal", "anomaly"]),
  shape: z.discriminatedUnion("type", [BoundingBoxPoints, PolygonPoints]),
  comment: z.string().max(2000).nullable(),
  // Provenance of the annotation:
  //   - "human": drawn manually in the annotate canvas
  //   - "ai": auto-created from a detection run, ready to be overridden
  //   - "human-correction": approved/relabelled detection from the review UI
  source: z.enum(["human", "ai", "human-correction"]).default("human"),
  createdAt: z.date(),
});
export type Annotation = z.infer<typeof AnnotationSchema>;

export const ModelSchema = z.object({
  _id: ObjectIdString,
  projectId: ObjectIdString,
  version: z.string().min(1),
  // Centroid models train from labelled annotations; description models are
  // zero-shot, derived from the project's natural-language detection rule
  // with no annotation pass.
  algorithm: z.enum([
    "openai-embedding-centroid",
    "openai-embedding-description",
  ]),
  // Mean of the held-out normal embeddings. Null for pure description-only
  // (zero-shot) models that never saw annotations.
  centroid: z.array(z.number()).min(1).nullable(),
  // Frozen copy of the project's anomalyDescription at training time, plus
  // its embedding. Lets us refine centroid scores by description proximity
  // and powers zero-shot detection.
  description: z.string().max(2000).nullable(),
  descriptionEmbedding: z.array(z.number()).min(1).nullable(),
  threshold: z.number().min(0).max(2),
  metrics: z.object({
    precision: z.number().min(0).max(1),
    recall: z.number().min(0).max(1),
    f1: z.number().min(0).max(1),
    sampleCount: z.number().int().min(0),
  }),
  // Per-bucket counts from the split. `mode` flags whether the strict
  // sequence-aware split ran or whether we fell back to a shuffled per-
  // annotation split (used when sequence diversity is too low). Null on
  // legacy models (trained before this field existed) and on zero-shot
  // description-only models that skip the split entirely.
  split: z
    .object({
      train: z.number().int().min(0),
      validation: z.number().int().min(0),
      test: z.number().int().min(0),
      mode: z.enum(["sequence", "annotation"]).default("sequence"),
    })
    .nullable(),
  status: z.enum(["training", "completed", "failed"]),
  createdAt: z.date(),
});
export type Model = z.infer<typeof ModelSchema>;

export const DetectionSchema = z.object({
  _id: ObjectIdString,
  modelId: ObjectIdString,
  projectId: ObjectIdString,
  imageId: ObjectIdString,
  // Pipeline status of the detection run itself:
  //   - "pending": queued / in-flight, vision call hasn't returned
  //   - "completed": vision call returned, results + heatmap persisted
  //   - "failed": vision call errored, see `error`
  status: z.enum(["pending", "completed", "failed"]).default("completed"),
  error: z.string().max(2000).nullable().default(null),
  // Per-tile distance grid; empty when the detection ran whole-image only.
  heatmap: z
    .object({
      cols: z.number().int().positive(),
      rows: z.number().int().positive(),
      // Row-major flat array of [0..1] anomaly scores.
      cells: z.array(z.number().min(0).max(1)),
    })
    .nullable(),
  results: z.array(
    z.object({
      label: z.enum(["normal", "anomaly"]),
      confidence: z.number().min(0).max(1),
      bbox: z.object({
        x: z.number().min(0),
        y: z.number().min(0),
        width: z.number().positive(),
        height: z.number().positive(),
      }),
    }),
  ),
  // Reviewer state, separate from pipeline status — a completed detection
  // can still be pending review, approved, or corrected.
  reviewed: z.enum(["pending", "approved", "corrected"]).default("pending"),
  createdAt: z.date(),
});
export type Detection = z.infer<typeof DetectionSchema>;

// A single step inside a pipeline run. Phases are upserted by `name`, so
// the same phase can be re-emitted (e.g. an "embedding" phase whose detail
// updates as more annotations finish).
export const PipelinePhaseSchema = z.object({
  name: z.string().min(1).max(60),
  label: z.string().min(1).max(120),
  state: z.enum(["pending", "running", "done", "failed", "skipped"]),
  startedAt: z.date().nullable(),
  finishedAt: z.date().nullable(),
  detail: z.string().max(500).nullable(),
  // Structured metadata (counts, identifiers, metrics) — rendered verbatim
  // under the phase in the Jobs UI. Keep small; this is not an event log.
  meta: z.record(z.string(), z.unknown()).nullable(),
});
export type PipelinePhase = z.infer<typeof PipelinePhaseSchema>;

// Each long-running operation gets a PipelineRun row so the Jobs page can
// show every active and recent task across the project — training,
// detection, batch runs — in one place with phase-level detail.
export const PipelineRunSchema = z.object({
  _id: ObjectIdString,
  projectId: ObjectIdString,
  kind: z.enum(["training", "detection"]),
  status: z.enum(["running", "completed", "failed"]),
  // Optional foreign keys depending on `kind`. Detection runs reference the
  // image (and the detection row once created); training runs reference the
  // model once saved.
  imageId: ObjectIdString.nullable(),
  detectionId: ObjectIdString.nullable(),
  modelId: ObjectIdString.nullable(),
  // Short human-readable summary shown on the row before expanding.
  summary: z.string().max(300).nullable(),
  phases: z.array(PipelinePhaseSchema),
  error: z.string().max(2000).nullable(),
  startedAt: z.date(),
  finishedAt: z.date().nullable(),
});
export type PipelineRun = z.infer<typeof PipelineRunSchema>;

export const EmbeddingSchema = z.object({
  _id: ObjectIdString,
  projectId: ObjectIdString,
  imageId: ObjectIdString,
  // For region-level embeddings (a single annotation), this points at it.
  // Whole-image embeddings have annotationId = null.
  annotationId: ObjectIdString.nullable(),
  label: z.enum(["normal", "anomaly"]),
  vector: z.array(z.number()).min(1),
  // Captured for diagnostics/debug; not used by the search query.
  caption: z.string().max(4000).nullable(),
  createdAt: z.date(),
});
export type Embedding = z.infer<typeof EmbeddingSchema>;
