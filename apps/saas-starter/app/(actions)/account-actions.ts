"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth, updateSession } from "@/lib/auth";
import {
  changeUserPassword,
  updateUserName,
} from "@/services/user-service";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
});

export type ProfileState = { error?: string; success?: string } | null;

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await updateUserName({ userId: session.user.id, name: parsed.data.name });
  await updateSession({ user: { name: parsed.data.name } });

  revalidatePath("/dashboard", "layout");
  return { success: "Profile updated" };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "New passwords don't match",
    path: ["confirmPassword"],
  });

export type PasswordState = { error?: string; success?: string } | null;

export async function changePasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await changeUserPassword({
    userId: session.user.id,
    currentPassword: parsed.data.currentPassword,
    newPassword: parsed.data.newPassword,
  });
  if (result === "wrong-current-password") {
    return { error: "Current password is incorrect" };
  }
  return { success: "Password updated" };
}
