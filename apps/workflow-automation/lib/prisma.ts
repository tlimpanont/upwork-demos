import { PrismaClient } from "../prisma/generated/client";

declare global {
  var __wfPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__wfPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") global.__wfPrisma = prisma;
