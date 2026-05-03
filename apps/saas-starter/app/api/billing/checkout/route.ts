import { z } from "zod";
import { error, json, parseJson, requireTenant } from "@/lib/api";
import { can, Permission, type Role } from "@/lib/permissions";
import {
  AlreadySubscribedError,
  createCheckoutSession,
} from "@/services/billing-service";

export const runtime = "nodejs";

const schema = z.object({ priceId: z.string().min(1) });

export async function POST(req: Request) {
  const tenant = await requireTenant();
  if ("error" in tenant) return tenant.error;
  const { ctx } = tenant;

  if (!can(ctx.active.role as Role, Permission.ManageBilling)) {
    return error("Forbidden", 403);
  }

  const body = await parseJson(req, schema);
  if ("error" in body) return body.error;

  const origin =
    req.headers.get("origin") ??
    process.env.AUTH_URL ??
    "http://localhost:3000";

  try {
    const { url } = await createCheckoutSession({
      organizationId: ctx.active.id,
      organizationName: ctx.active.name,
      userEmail: ctx.user.email ?? "",
      priceId: body.data.priceId,
      origin,
    });
    return json({ url });
  } catch (err) {
    if (err instanceof AlreadySubscribedError) {
      return error(err.message, 409, { code: err.code });
    }
    console.error("[billing/checkout] failed", err);
    return error("Could not create checkout session", 500);
  }
}
