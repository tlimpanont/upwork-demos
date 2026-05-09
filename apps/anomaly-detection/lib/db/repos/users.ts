import { ObjectId } from "mongodb";
import { db } from "../mongo";
import type { SafeUser, User } from "../schemas";

type UserDoc = {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  name: string | null;
  createdAt: Date;
};

function toSafe({ _id, email, name }: UserDoc): SafeUser {
  return { _id: _id.toHexString(), email, name };
}

function toUser({ _id, ...rest }: UserDoc): User {
  return { _id: _id.toHexString(), ...rest };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const collection = (await db()).collection<UserDoc>("users");
  const doc = await collection.findOne({ email: email.toLowerCase() });
  return doc ? toUser(doc) : null;
}

export async function findUserById(id: string): Promise<SafeUser | null> {
  const collection = (await db()).collection<UserDoc>("users");
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  return doc ? toSafe(doc) : null;
}

export async function insertUser(input: {
  email: string;
  passwordHash: string;
  name: string | null;
}): Promise<SafeUser> {
  const collection = (await db()).collection<Omit<UserDoc, "_id">>("users");
  const doc = {
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    name: input.name,
    createdAt: new Date(),
  };
  const { insertedId } = await collection.insertOne(doc);
  return { _id: insertedId.toHexString(), email: doc.email, name: doc.name };
}

export async function ensureUserIndexes(): Promise<void> {
  const collection = (await db()).collection("users");
  await collection.createIndex({ email: 1 }, { unique: true });
}
