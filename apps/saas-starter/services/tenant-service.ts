import { randomBytes } from "node:crypto";
import { pool, query } from "@/lib/db";
import type { Role } from "@/lib/permissions";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type Membership = {
  user_id: string;
  organization_id: string;
  role: Role;
};

export type OrganizationWithRole = Organization & { role: Role };

export type MemberRow = {
  user_id: string;
  email: string;
  name: string | null;
  role: Role;
  joined_at: string;
};

export type InvitationRow = {
  id: string;
  email: string;
  role: Role;
  invited_by_email: string;
  expires_at: string;
  created_at: string;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function listOrganizationsForUser(
  userId: string,
): Promise<OrganizationWithRole[]> {
  const { rows } = await query<OrganizationWithRole>(
    `select o.id, o.name, o.slug, o.created_at, m.role
     from organizations o
     join memberships m on m.organization_id = o.id
     where m.user_id = $1
     order by o.created_at asc`,
    [userId],
  );
  return rows;
}

export async function getMembership(
  userId: string,
  organizationId: string,
): Promise<Membership | null> {
  const { rows } = await query<Membership>(
    `select user_id, organization_id, role
     from memberships
     where user_id = $1 and organization_id = $2
     limit 1`,
    [userId, organizationId],
  );
  return rows[0] ?? null;
}

export async function listMembers(
  organizationId: string,
): Promise<MemberRow[]> {
  const { rows } = await query<MemberRow>(
    `select u.id as user_id, u.email::text as email, u.name, m.role, m.created_at as joined_at
     from memberships m
     join users u on u.id = m.user_id
     where m.organization_id = $1
     order by m.created_at asc`,
    [organizationId],
  );
  return rows;
}

export async function listPendingInvitations(
  organizationId: string,
): Promise<InvitationRow[]> {
  const { rows } = await query<InvitationRow>(
    `select i.id, i.email::text as email, i.role,
            iu.email::text as invited_by_email,
            i.expires_at, i.created_at
     from invitations i
     join users iu on iu.id = i.invited_by
     where i.organization_id = $1 and i.accepted_at is null
     order by i.created_at desc`,
    [organizationId],
  );
  return rows;
}

export async function createInvitation(input: {
  organizationId: string;
  email: string;
  role: Role;
  invitedBy: string;
}): Promise<InvitationRow> {
  const token = randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
  const { rows } = await query<{ id: string; created_at: string; expires_at: string }>(
    `insert into invitations (organization_id, email, role, invited_by, token, expires_at)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (organization_id, email)
       do update set role = excluded.role,
                     invited_by = excluded.invited_by,
                     token = excluded.token,
                     expires_at = excluded.expires_at,
                     accepted_at = null,
                     created_at = now()
     returning id, created_at, expires_at`,
    [input.organizationId, input.email, input.role, input.invitedBy, token, expires],
  );
  const row = rows[0];
  return {
    id: row.id,
    email: input.email,
    role: input.role,
    invited_by_email: "",
    expires_at: row.expires_at,
    created_at: row.created_at,
  };
}

export async function revokeInvitation(input: {
  organizationId: string;
  invitationId: string;
}): Promise<void> {
  await query(
    `delete from invitations where id = $1 and organization_id = $2`,
    [input.invitationId, input.organizationId],
  );
}

export async function createOrganization(input: {
  name: string;
  ownerUserId: string;
}): Promise<Organization> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const base = slugify(input.name) || "workspace";
    let slug = base;
    let attempt = 0;
    for (;;) {
      try {
        const { rows } = await client.query<Organization>(
          `insert into organizations (name, slug, created_by)
           values ($1, $2, $3)
           returning id, name, slug, created_at`,
          [input.name, slug, input.ownerUserId],
        );
        await client.query(
          `insert into memberships (user_id, organization_id, role)
           values ($1, $2, 'admin')`,
          [input.ownerUserId, rows[0].id],
        );
        await client.query("commit");
        return rows[0];
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "23505" && attempt < 5) {
          attempt += 1;
          slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
          continue;
        }
        await client.query("rollback");
        throw err;
      }
    }
  } finally {
    client.release();
  }
}

export async function ensurePersonalOrganization(input: {
  userId: string;
  name: string;
}): Promise<Organization> {
  const existing = await listOrganizationsForUser(input.userId);
  if (existing.length > 0) return existing[0];
  return createOrganization({
    name: `${input.name}'s workspace`,
    ownerUserId: input.userId,
  });
}

async function countAdmins(
  client: { query: typeof pool.query },
  organizationId: string,
): Promise<number> {
  const { rows } = await client.query<{ count: string }>(
    `select count(*)::text as count
     from memberships
     where organization_id = $1 and role = 'admin'`,
    [organizationId],
  );
  return Number(rows[0]?.count ?? "0");
}

/**
 * Change a member's role with a "last admin" guard so an admin can never
 * demote themselves into a locked-out workspace.
 */
export async function changeMemberRole(input: {
  organizationId: string;
  targetUserId: string;
  newRole: Role;
}): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("begin");

    const { rows } = await client.query<{ role: Role }>(
      `select role from memberships
       where organization_id = $1 and user_id = $2
       for update`,
      [input.organizationId, input.targetUserId],
    );
    const current = rows[0];
    if (!current) throw new Error("Member not found");

    if (current.role === "admin" && input.newRole !== "admin") {
      const admins = await countAdmins(client, input.organizationId);
      if (admins <= 1) {
        throw new Error("Workspace must have at least one admin");
      }
    }

    await client.query(
      `update memberships set role = $3
       where organization_id = $1 and user_id = $2`,
      [input.organizationId, input.targetUserId, input.newRole],
    );
    await client.query("commit");
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateOrganization(input: {
  organizationId: string;
  name: string;
}): Promise<Organization> {
  const { rows } = await query<Organization>(
    `update organizations set name = $2, updated_at = now()
     where id = $1
     returning id, name, slug, created_at`,
    [input.organizationId, input.name],
  );
  if (!rows[0]) throw new Error("Organization not found");
  return rows[0];
}

export async function deleteOrganization(input: {
  organizationId: string;
}): Promise<void> {
  await query(`delete from organizations where id = $1`, [input.organizationId]);
}

export async function removeMember(input: {
  organizationId: string;
  targetUserId: string;
}): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query<{ role: Role }>(
      `select role from memberships
       where organization_id = $1 and user_id = $2
       for update`,
      [input.organizationId, input.targetUserId],
    );
    const current = rows[0];
    if (!current) {
      await client.query("rollback");
      return; // already gone
    }
    if (current.role === "admin") {
      const admins = await countAdmins(client, input.organizationId);
      if (admins <= 1) {
        throw new Error("Workspace must have at least one admin");
      }
    }
    await client.query(
      `delete from memberships
       where organization_id = $1 and user_id = $2`,
      [input.organizationId, input.targetUserId],
    );
    await client.query("commit");
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}
