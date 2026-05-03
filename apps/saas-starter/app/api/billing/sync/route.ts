import { error, json, requireTenant } from "@/lib/api";
import { can, Permission, type Role } from "@/lib/permissions";
import { resyncFromStripe } from "@/services/billing-service";

export const runtime = "nodejs";

export async function POST() {
  const tenant = await requireTenant();
  if ("error" in tenant) return tenant.error;
  const { ctx } = tenant;

  if (!can(ctx.active.role as Role, Permission.ManageBilling)) {
    return error("Forbidden", 403);
  }

  try {
    const row = await resyncFromStripe(ctx.active.id);
    return json({ subscription: row });
  } catch (err) {
    console.error("[billing/sync] failed", err);
    return error("Could not sync from Stripe", 500);
  }
}
