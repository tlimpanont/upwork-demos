"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/api";
import {
  deleteAnnotation,
  ensureAnnotationIndexes,
  insertAnnotation,
  promoteAiAnnotation,
} from "@/lib/db/repos/annotations";
import { findImageById } from "@/lib/db/repos/images";
import { findProjectById } from "@/lib/db/repos/projects";

const idSchema = z.string().regex(/^[0-9a-fA-F]{24}$/);

const ShapeSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("bounding_box"),
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  z.object({
    type: z.literal("polygon"),
    points: z
      .array(z.object({ x: z.number(), y: z.number() }))
      .min(3),
  }),
]);

const createInputSchema = z.object({
  imageId: idSchema,
  label: z.enum(["normal", "anomaly"]),
  shape: ShapeSchema,
  comment: z.string().max(2000).nullable(),
});

export async function saveAnnotationAction(
  input: z.infer<typeof createInputSchema>,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const parsed = createInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid annotation" };
  const user = await requireUser();
  const image = await findImageById(parsed.data.imageId);
  if (!image) return { ok: false, error: "Image not found" };
  const project = await findProjectById(image.projectId, user.id);
  if (!project) return { ok: false, error: "Forbidden" };

  await ensureAnnotationIndexes();
  const annotation = await insertAnnotation({
    imageId: image._id,
    projectId: image.projectId,
    sequenceId: image.sequenceId,
    label: parsed.data.label,
    shape: parsed.data.shape,
    comment: parsed.data.comment,
  });
  revalidatePath(`/projects/${project._id}/annotate`);
  return { ok: true, id: annotation._id };
}

export async function deleteAnnotationAction(input: {
  annotationId: string;
}): Promise<{ ok: boolean }> {
  const idResult = idSchema.safeParse(input.annotationId);
  if (!idResult.success) return { ok: false };
  const user = await requireUser();
  const dbiMod = await import("@/lib/db/mongo");
  const { ObjectId } = await import("mongodb");
  const dbi = await dbiMod.db();
  const doc = await dbi
    .collection<{ _id: import("mongodb").ObjectId; projectId: import("mongodb").ObjectId }>(
      "annotations",
    )
    .findOne({ _id: new ObjectId(idResult.data) });
  if (!doc) return { ok: false };
  const project = await findProjectById(doc.projectId.toHexString(), user.id);
  if (!project) return { ok: false };
  const ok = await deleteAnnotation(idResult.data, project._id);
  if (ok) revalidatePath(`/projects/${project._id}/annotate`);
  return { ok };
}

// "Accept" an AI suggestion: flips source ai → human-correction so it
// survives the next detect run and counts as signed-off ground truth.
export async function acceptAiAnnotationAction(input: {
  annotationId: string;
}): Promise<{ ok: boolean }> {
  const idResult = idSchema.safeParse(input.annotationId);
  if (!idResult.success) return { ok: false };
  const user = await requireUser();
  const dbiMod = await import("@/lib/db/mongo");
  const { ObjectId } = await import("mongodb");
  const dbi = await dbiMod.db();
  const doc = await dbi
    .collection<{ _id: import("mongodb").ObjectId; projectId: import("mongodb").ObjectId }>(
      "annotations",
    )
    .findOne({ _id: new ObjectId(idResult.data) });
  if (!doc) return { ok: false };
  const project = await findProjectById(doc.projectId.toHexString(), user.id);
  if (!project) return { ok: false };
  const ok = await promoteAiAnnotation(idResult.data, project._id);
  if (ok) revalidatePath(`/projects/${project._id}/annotate`);
  return { ok };
}
