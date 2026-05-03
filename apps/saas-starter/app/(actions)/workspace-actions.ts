"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ACTIVE_ORG_COOKIE, requireTenantContext } from "@/lib/active-organization";
import { can, Permission, type Role } from "@/lib/permissions";
import { stripe } from "@/lib/stripe";
import {
  deleteOrganization,
  updateOrganization,
} from "@/services/tenant-service";
import { getSubscriptionForOrganization } from "@/services/billing-service";

const updateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
});

export type WorkspaceState = { error?: string; success?: string } | null;

export async function updateWorkspaceAction(
  _prev: WorkspaceState,
  formData: FormData,
): Promise<WorkspaceState> {
  const ctx = await requireTenantContext();
  if (!can(ctx.active.role as Role, Permission.ManageMembers)) {
    return { error: "Only admins can update the workspace" };
  }
  const parsed = updateSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await updateOrganization({
    organizationId: ctx.active.id,
    name: parsed.data.name,
  });
  revalidatePath("/dashboard", "layout");
  return { success: "Workspace updated" };
}

export async function deleteWorkspaceAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!can(ctx.active.role as Role, Permission.ManageMembers)) {
    throw new Error("Forbidden");
  }
  // Defense in depth: caller types the workspace name to confirm.
  const confirmation = String(formData.get("confirmName") ?? "");
  if (confirmation !== ctx.active.name) {
    throw new Error("Workspace name did not match");
  }

  // Cancel any active Stripe subscription before tearing down the org row.
  const sub = await getSubscriptionForOrganization(ctx.active.id);
  if (sub?.stripe_subscription_id && sub.status !== "canceled") {
    try {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id);
    } catch (err) {
      console.warn("[delete-workspace] could not cancel subscription", err);
    }
  }

  await deleteOrganization({ organizationId: ctx.active.id });

  // Drop the active-org cookie so the next request falls back cleanly.
  (await cookies()).delete(ACTIVE_ORG_COOKIE);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}
