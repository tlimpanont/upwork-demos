import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: string;
};

export type SafeUser = {
  id: string;
  email: string;
  name: string | null;
};

const BCRYPT_ROUNDS = 10;

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await query<UserRow>(
    "select id, email, password_hash, name, created_at from users where email = $1 limit 1",
    [email],
  );
  return rows[0] ?? null;
}

export async function createUserWithCredentials(input: {
  email: string;
  password: string;
  name?: string | null;
}): Promise<SafeUser> {
  const password_hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const { rows } = await query<SafeUser>(
    `insert into users (email, password_hash, name)
     values ($1, $2, $3)
     returning id, email, name`,
    [input.email, password_hash, input.name ?? null],
  );
  return rows[0];
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<SafeUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  return { id: user.id, email: user.email, name: user.name };
}

export async function updateUserName(input: {
  userId: string;
  name: string;
}): Promise<SafeUser> {
  const { rows } = await query<SafeUser>(
    `update users set name = $2, updated_at = now()
     where id = $1
     returning id, email, name`,
    [input.userId, input.name],
  );
  if (!rows[0]) throw new Error("User not found");
  return rows[0];
}

export type ChangePasswordResult = "ok" | "wrong-current-password";

export async function changeUserPassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<ChangePasswordResult> {
  const { rows } = await query<{ password_hash: string }>(
    `select password_hash from users where id = $1 limit 1`,
    [input.userId],
  );
  const row = rows[0];
  if (!row) throw new Error("User not found");

  const ok = await bcrypt.compare(input.currentPassword, row.password_hash);
  if (!ok) return "wrong-current-password";

  const newHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  await query(
    `update users set password_hash = $2, updated_at = now() where id = $1`,
    [input.userId, newHash],
  );
  return "ok";
}
