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
  // Tag corrections fed back from the detection page so we can split them out
  // of the original training set when measuring drift.
  source: z.enum(["human", "human-correction"]).default("human"),
  createdAt: z.date(),
});
export type Annotation = z.infer<typeof AnnotationSchema>;

export const ModelSchema = z.object({
  _id: ObjectIdString,
  projectId: ObjectIdString,
  version: z.string().min(1),
  algorithm: z.literal("openai-embedding-centroid"),
  // Mean of the cosine distances from the held-out normal split; mean + 2σ
  // becomes the default anomaly threshold.
  centroid: z.array(z.number()).min(1),
  threshold: z.number().min(0).max(2),
  metrics: z.object({
    precision: z.number().min(0).max(1),
    recall: z.number().min(0).max(1),
    f1: z.number().min(0).max(1),
    sampleCount: z.number().int().min(0),
  }),
  status: z.enum(["training", "completed", "failed"]),
  createdAt: z.date(),
});
export type Model = z.infer<typeof ModelSchema>;

export const DetectionSchema = z.object({
  _id: ObjectIdString,
  modelId: ObjectIdString,
  projectId: ObjectIdString,
  imageId: ObjectIdString,
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
  reviewed: z.enum(["pending", "approved", "corrected"]).default("pending"),
  createdAt: z.date(),
});
export type Detection = z.infer<typeof DetectionSchema>;

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
