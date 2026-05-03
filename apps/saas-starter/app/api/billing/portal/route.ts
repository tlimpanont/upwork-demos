import { error, json, requireTenant } from "@/lib/api";
import { can, Permission, type Role } from "@/lib/permissions";
import { createBillingPortalSession } from "@/services/billing-service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const tenant = await requireTenant();
  if ("error" in tenant) return tenant.error;
  const { ctx } = tenant;

  if (!can(ctx.active.role as Role, Permission.ManageBilling)) {
    return error("Forbidden", 403);
  }

  const origin =
    req.headers.get("origin") ??
    process.env.AUTH_URL ??
    "http://localhost:3000";

  const session = await createBillingPortalSession({
    organizationId: ctx.active.id,
    origin,
  });
  if (!session) {
    return error("No customer record yet — subscribe first", 400);
  }
  return json(session);
}
