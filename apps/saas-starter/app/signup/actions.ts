"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import {
  createUserWithCredentials,
  findUserByEmail,
} from "@/services/user-service";
import { ensurePersonalOrganization } from "@/services/tenant-service";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignupState = { error?: string } | null;

export async function signupAction(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password } = parsed.data;

  const existing = await findUserByEmail(email);
  if (existing) {
    return { error: "An account with that email already exists" };
  }

  const user = await createUserWithCredentials({ name, email, password });
  await ensurePersonalOrganization({ userId: user.id, name });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created. Please sign in." };
    }
    throw error;
  }
}
