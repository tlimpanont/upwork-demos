import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { requireTenantContext } from "@/lib/active-organization";
import { can, Permission, type Role } from "@/lib/permissions";
import {
  listMembers,
  listPendingInvitations,
  type InvitationRow,
  type MemberRow,
} from "@/services/tenant-service";
import DataTable, { type Column } from "@/components/ui/DataTable";
import InviteMemberDialog from "./InviteMemberDialog";
import MemberActionsMenu from "./MemberActionsMenu";
import { revokeInvitationAction } from "@/app/(actions)/member-actions";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

function buildMemberColumns(
  canManage: boolean,
  currentUserId: string,
): ReadonlyArray<Column<MemberRow>> {
  const cols: Column<MemberRow>[] = [
    {
      key: "user",
      header: "Member",
      cell: (m) => (
        <Stack>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {m.name ?? "—"}
            {m.user_id === currentUserId ? (
              <Typography
                component="span"
                variant="caption"
                sx={{ color: "text.secondary", ml: 1 }}
              >
                (you)
              </Typography>
            ) : null}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {m.email}
          </Typography>
        </Stack>
      ),
    },
    {
      key: "role",
      header: "Role",
      width: 140,
      cell: (m) => (
        <Chip
          size="small"
          label={m.role}
          color={m.role === "admin" ? "primary" : "default"}
          variant={m.role === "admin" ? "filled" : "outlined"}
          sx={{ textTransform: "capitalize" }}
        />
      ),
    },
    {
      key: "joined",
      header: "Joined",
      width: 160,
      cell: (m) => (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {formatDate(m.joined_at)}
        </Typography>
      ),
    },
  ];

  if (canManage) {
    cols.push({
      key: "actions",
      header: "",
      width: 60,
      align: "right",
      cell: (m) => (
        <MemberActionsMenu
          userId={m.user_id}
          email={m.email}
          role={m.role}
          isCurrentUser={m.user_id === currentUserId}
        />
      ),
    });
  }

  return cols;
}

function buildInvitationColumns(
  canManage: boolean,
): ReadonlyArray<Column<InvitationRow>> {
  return [
    {
      key: "email",
      header: "Email",
      cell: (i) => <Typography variant="body2">{i.email}</Typography>,
    },
    {
      key: "role",
      header: "Role",
      width: 140,
      cell: (i) => (
        <Chip
          size="small"
          label={i.role}
          variant="outlined"
          sx={{ textTransform: "capitalize" }}
        />
      ),
    },
    {
      key: "expires",
      header: "Expires",
      width: 160,
      cell: (i) => (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {formatDate(i.expires_at)}
        </Typography>
      ),
    },
    {
      key: "actions",
      header: "",
      width: 80,
      align: "right" as const,
      cell: (i) =>
        canManage ? (
          <form action={revokeInvitationAction}>
            <input type="hidden" name="invitationId" value={i.id} />
            <Button
              type="submit"
              size="small"
              color="inherit"
              startIcon={<DeleteOutlineOutlinedIcon fontSize="small" />}
            >
              Revoke
            </Button>
          </form>
        ) : null,
    },
  ];
}

export default async function UsersPage() {
  const ctx = await requireTenantContext();
  const canManage = can(ctx.active.role as Role, Permission.ManageMembers);

  const [members, invites] = await Promise.all([
    listMembers(ctx.active.id),
    listPendingInvitations(ctx.active.id),
  ]);

  return (
    <Box>
      <Stack
        direction="row"
        sx={{ alignItems: "flex-end", justifyContent: "space-between", mb: 3 }}
      >
        <Box>
          <Typography variant="h5" component="h1" gutterBottom>
            Users
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Members of {ctx.active.name}.
          </Typography>
        </Box>
        <InviteMemberDialog canInvite={canManage} />
      </Stack>

      <DataTable
        rows={members}
        columns={buildMemberColumns(canManage, ctx.user.id)}
        rowKey={(m) => m.user_id}
        empty={{
          title: "No members yet",
          subtitle: "Invite a teammate to get started.",
        }}
      />

      {invites.length > 0 ? (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Pending invitations
          </Typography>
          <DataTable
            rows={invites}
            columns={buildInvitationColumns(canManage)}
            rowKey={(i) => i.id}
          />
        </Box>
      ) : null}
    </Box>
  );
}
