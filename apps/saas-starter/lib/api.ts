import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";
import { auth } from "@/lib/auth";
import { getTenantContext, type TenantContext } from "@/lib/active-organization";

export type ApiError = { error: string; details?: unknown };

export const json = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json<T>(data, init);

export const error = (
  message: string,
  status: number,
  details?: unknown,
) =>
  NextResponse.json<ApiError>(
    details === undefined ? { error: message } : { error: message, details },
    { status },
  );

/**
 * Require a logged-in user. Returns the session user or a 401 response.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: error("Unauthorized", 401) } as const;
  }
  return { user: session.user } as const;
}

/**
 * Require an active tenant context (logged in + has selected org).
 */
export async function requireTenant() {
  const ctx = await getTenantContext();
  if (!ctx) return { error: error("Unauthorized", 401) } as const;
  if (!ctx.active) {
    return { error: error("No active organization", 409) } as const;
  }
  return { ctx: ctx as TenantContext & { active: NonNullable<TenantContext["active"]> } } as const;
}

/**
 * Parse + validate a JSON body. Returns either parsed data or an error response.
 */
export async function parseJson<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<{ data: T } | { error: NextResponse }> {
  const raw = await req.json().catch(() => null);
  const result = schema.safeParse(raw);
  if (!result.success) {
    return { error: error("Invalid request", 400, result.error.issues) };
  }
  return { data: result.data };
}
