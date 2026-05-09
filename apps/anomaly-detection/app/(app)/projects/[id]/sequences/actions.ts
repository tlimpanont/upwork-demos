"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/api";
import { findProjectById } from "@/lib/db/repos/projects";
import {
  deleteSequenceCascade,
  ensureSequenceIndexes,
  insertSequence,
} from "@/lib/db/repos/sequences";
import {
  deleteImageCascade,
  findImageById,
} from "@/lib/db/repos/images";
import { bumpImageCount } from "@/lib/db/repos/sequences";
import { deleteByKey } from "@/lib/storage/blob";

const idSchema = z.string().regex(/^[0-9a-fA-F]{24}$/);

export async function createSequenceAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const projectId = idSchema.safeParse(formData.get("projectId"));
  const name = z.string().min(1).max(120).safeParse(formData.get("name"));
  if (!projectId.success || !name.success) return;
  const project = await findProjectById(projectId.data, user.id);
  if (!project) return;
  await ensureSequenceIndexes();
  const sequence = await insertSequence({
    projectId: project._id,
    name: name.data,
  });
  revalidatePath(`/projects/${project._id}/sequences`);
  redirect(`/projects/${project._id}/sequences/${sequence._id}`);
}

export async function deleteSequenceAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const sequenceId = idSchema.safeParse(formData.get("sequenceId"));
  const projectId = idSchema.safeParse(formData.get("projectId"));
  if (!sequenceId.success || !projectId.success) return;
  const project = await findProjectById(projectId.data, user.id);
  if (!project) return;
  await deleteSequenceCascade(sequenceId.data, project._id);
  revalidatePath(`/projects/${project._id}/sequences`);
  redirect(`/projects/${project._id}/sequences`);
}

export async function deleteImageAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const imageId = idSchema.safeParse(formData.get("imageId"));
  if (!imageId.success) return;
  const image = await findImageById(imageId.data);
  if (!image) return;
  const project = await findProjectById(image.projectId, user.id);
  if (!project) return;

  const removed = await deleteImageCascade(imageId.data);
  if (removed) {
    await deleteByKey(removed.blobKey);
    await bumpImageCount(removed.sequenceId, -1);
    revalidatePath(`/projects/${project._id}/sequences/${removed.sequenceId}`);
  }
}
