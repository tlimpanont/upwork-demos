"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/api";
import {
  ensureAnnotationIndexes,
  insertAnnotation,
} from "@/lib/db/repos/annotations";
import {
  findDetectionById,
  setDetectionReviewed,
} from "@/lib/db/repos/detections";
import { findImageById } from "@/lib/db/repos/images";
import { findProjectById } from "@/lib/db/repos/projects";

const idSchema = z.string().regex(/^[0-9a-fA-F]{24}$/);

export async function approveDetectionAction(input: {
  detectionId: string;
}): Promise<{ ok: boolean }> {
  const parsed = idSchema.safeParse(input.detectionId);
  if (!parsed.success) return { ok: false };
  const user = await requireUser();
  const detection = await findDetectionById(parsed.data);
  if (!detection) return { ok: false };
  const project = await findProjectById(detection.projectId, user.id);
  if (!project) return { ok: false };

  await setDetectionReviewed(parsed.data, "approved");

  // Persist each predicted anomaly as a human-correction annotation so the
  // next training run picks them up. Whole-image "normal" detections leave
  // no trace by design — there's nothing to learn from a confirmed normal.
  const image = await findImageById(detection.imageId);
  if (image) {
    await ensureAnnotationIndexes();
    for (const r of detection.results) {
      if (r.label !== "anomaly") continue;
      await insertAnnotation({
        imageId: detection.imageId,
        projectId: detection.projectId,
        sequenceId: image.sequenceId,
        label: "anomaly",
        shape: {
          type: "bounding_box",
          x: r.bbox.x,
          y: r.bbox.y,
          width: r.bbox.width,
          height: r.bbox.height,
        },
        comment: "Confirmed via detection review",
        source: "human-correction",
      });
    }
  }

  revalidatePath(`/projects/${project._id}/detect`);
  return { ok: true };
}

export async function correctDetectionAction(input: {
  detectionId: string;
  newLabel: "normal" | "anomaly";
}): Promise<{ ok: boolean }> {
  const parsed = idSchema.safeParse(input.detectionId);
  if (!parsed.success) return { ok: false };
  const user = await requireUser();
  const detection = await findDetectionById(parsed.data);
  if (!detection) return { ok: false };
  const project = await findProjectById(detection.projectId, user.id);
  if (!project) return { ok: false };

  await setDetectionReviewed(parsed.data, "corrected");

  // Capture the corrected label as an annotation over the whole image so
  // the next training run sees the human ground truth.
  const image = await findImageById(detection.imageId);
  if (image) {
    await ensureAnnotationIndexes();
    await insertAnnotation({
      imageId: detection.imageId,
      projectId: detection.projectId,
      sequenceId: image.sequenceId,
      label: input.newLabel,
      shape: {
        type: "bounding_box",
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      },
      comment: `Corrected to ${input.newLabel} via detection review`,
      source: "human-correction",
    });
  }

  revalidatePath(`/projects/${project._id}/detect`);
  return { ok: true };
}
