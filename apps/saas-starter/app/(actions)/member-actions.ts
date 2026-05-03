"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenantContext } from "@/lib/active-organization";
import { can, Permission, type Role } from "@/lib/permissions";
import {
  changeMemberRole,
  createInvitation,
  removeMember,
  revokeInvitation,
} from "@/services/tenant-service";

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["admin", "member"]).default("member"),
});

export type InviteState = { error?: string; success?: string } | null;

export async function inviteMemberAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const ctx = await requireTenantContext();
  if (!can(ctx.active.role as Role, Permission.ManageMembers)) {
    return { error: "You don't have permission to invite members" };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role") ?? "member",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await createInvitation({
    organizationId: ctx.active.id,
    email: parsed.data.email,
    role: parsed.data.role,
    invitedBy: ctx.user.id,
  });

  revalidatePath("/dashboard/users");
  return { success: `Invitation sent to ${parsed.data.email}` };
}

export async function revokeInvitationAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!can(ctx.active.role as Role, Permission.ManageMembers)) {
    throw new Error("Forbidden");
  }
  const id = String(formData.get("invitationId") ?? "");
  if (!id) throw new Error("Missing invitation id");
  await revokeInvitation({ organizationId: ctx.active.id, invitationId: id });
  revalidatePath("/dashboard/users");
}

const roleSchema = z.enum(["admin", "member"]);

export async function changeMemberRoleAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!can(ctx.active.role as Role, Permission.ManageMembers)) {
    throw new Error("Forbidden");
  }
  const targetUserId = String(formData.get("userId") ?? "");
  const parsed = roleSchema.safeParse(formData.get("role"));
  if (!targetUserId || !parsed.success) throw new Error("Invalid input");

  await changeMemberRole({
    organizationId: ctx.active.id,
    targetUserId,
    newRole: parsed.data,
  });
  revalidatePath("/dashboard/users");
}

export async function removeMemberAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!can(ctx.active.role as Role, Permission.ManageMembers)) {
    throw new Error("Forbidden");
  }
  const targetUserId = String(formData.get("userId") ?? "");
  if (!targetUserId) throw new Error("Missing user id");

  await removeMember({
    organizationId: ctx.active.id,
    targetUserId,
  });
  revalidatePath("/dashboard/users");
}
