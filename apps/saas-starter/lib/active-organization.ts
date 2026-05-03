import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import {
  listOrganizationsForUser,
  type OrganizationWithRole,
} from "@/services/tenant-service";

export const ACTIVE_ORG_COOKIE = "acme_active_org";

export type TenantContext =
  | {
      user: { id: string; name?: string | null; email?: string | null };
      orgs: OrganizationWithRole[];
      active: OrganizationWithRole;
    }
  | {
      user: { id: string; name?: string | null; email?: string | null };
      orgs: OrganizationWithRole[];
      active: null;
    };

export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const orgs = await listOrganizationsForUser(session.user.id);
  if (orgs.length === 0) {
    return { user: session.user, orgs, active: null };
  }

  const cookieValue = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
  const active = orgs.find((o) => o.id === cookieValue) ?? orgs[0];
  return { user: session.user, orgs, active };
}

export async function requireTenantContext() {
  const ctx = await getTenantContext();
  if (!ctx) throw new Error("Unauthenticated");
  if (!ctx.active) throw new Error("No active organization");
  return { ...ctx, active: ctx.active };
}
