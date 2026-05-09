"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/api";
import {
  deleteProject,
  ensureProjectIndexes,
  insertProject,
  updateProject,
} from "@/lib/db/repos/projects";

const DomainEnum = z.enum([
  "solar",
  "manufacturing",
  "medical",
  "security",
  "agriculture",
  "other",
]);

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().nullable(),
  domain: DomainEnum.default("other"),
});

const updateSchema = createSchema.extend({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

export async function createProjectAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const user = await requireUser();
  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    domain: formData.get("domain") || "other",
  });
  if (!parsed.success) {
    return { error: "Project name is required (max 120 chars)." };
  }
  await ensureProjectIndexes();
  const project = await insertProject({
    ownerId: user.id,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    domain: parsed.data.domain,
  });
  revalidatePath("/projects");
  redirect(`/projects/${project._id}`);
}

export async function updateProjectAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const user = await requireUser();
  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description") || null,
    domain: formData.get("domain") || "other",
  });
  if (!parsed.success) {
    return { error: "Invalid project update." };
  }
  const updated = await updateProject(parsed.data.id, user.id, {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    domain: parsed.data.domain,
  });
  if (!updated) return { error: "Project not found." };
  revalidatePath(`/projects/${parsed.data.id}`);
  revalidatePath("/projects");
  return null;
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-fA-F]{24}$/.test(id)) return;
  await deleteProject(id, user.id);
  revalidatePath("/projects");
  redirect("/projects");
}
