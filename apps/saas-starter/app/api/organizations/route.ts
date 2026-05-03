import { z } from "zod";
import { error, json, parseJson, requireUser } from "@/lib/api";
import {
  createOrganization,
  listOrganizationsForUser,
  type OrganizationWithRole,
} from "@/services/tenant-service";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const orgs = await listOrganizationsForUser(auth.user.id);
  return json<{ organizations: OrganizationWithRole[] }>({ organizations: orgs });
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await parseJson(req, createSchema);
  if ("error" in body) return body.error;

  try {
    const org = await createOrganization({
      name: body.data.name,
      ownerUserId: auth.user.id,
    });
    return json({ organization: org }, { status: 201 });
  } catch (err) {
    console.error("[api/organizations POST] failed", err);
    return error("Could not create organization", 500);
  }
}
