import bcrypt from "bcryptjs";
import {
  findUserByEmail,
  insertUser,
  ensureUserIndexes,
} from "@/lib/db/repos/users";
import type { SafeUser } from "@/lib/db/schemas";

const BCRYPT_ROUNDS = 10;

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<SafeUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { _id: user._id, email: user.email, name: user.name };
}

export async function registerUser(input: {
  email: string;
  password: string;
  name?: string | null;
}): Promise<SafeUser> {
  await ensureUserIndexes();
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new Error("ACCOUNT_EXISTS");
  }
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  return insertUser({
    email: input.email,
    passwordHash,
    name: input.name ?? null,
  });
}
