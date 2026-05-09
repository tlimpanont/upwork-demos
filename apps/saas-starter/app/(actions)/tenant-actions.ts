"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { ACTIVE_ORG_COOKIE } from "@/lib/active-organization";
import {
  createOrganization,
  getMembership,
  listOrganizationsForUser,
} from "@/services/tenant-service";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

async function setActiveCookie(orgId: string) {
  (await cookies()).set(ACTIVE_ORG_COOKIE, orgId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
}

export async function setActiveOrganizationAction(formData: FormData) {
  const orgId = String(formData.get("organizationId") ?? "");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");

  // Validate the user is a member; never trust the form value.
  const membership = await getMembership(session.user.id, orgId);
  if (!membership) throw new Error("Not a member of that organization");

  await setActiveCookie(orgId);
  revalidatePath("/dashboard", "layout");
}

const createOrgSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
});

export type CreateOrgState = { error?: string } | null;

export async function createOrganizationAction(
  _prev: CreateOrgState,
  formData: FormData,
): Promise<CreateOrgState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthenticated" };

  const parsed = createOrgSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const org = await createOrganization({
    name: parsed.data.name,
    ownerUserId: session.user.id,
  });
  await setActiveCookie(org.id);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function listMyOrganizationsAction() {
  const session = await auth();
  if (!session?.user?.id) return [];
  return listOrganizationsForUser(session.user.id);
}
