import { PrismaClient } from "../../prisma/generated/client";

declare global {
  var __alqPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__alqPrisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") global.__alqPrisma = prisma;