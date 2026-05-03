import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { requireTenantContext } from "@/lib/active-organization";
import { can, Permission, type Role } from "@/lib/permissions";
import WorkspaceForm from "./WorkspaceForm";
import DangerZone from "./DangerZone";

export default async function WorkspaceSettingsPage() {
  const ctx = await requireTenantContext();
  const canManage = can(ctx.active.role as Role, Permission.ManageMembers);

  return (
    <Stack spacing={3} sx={{ maxWidth: 640 }}>
      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h6" gutterBottom>
            Workspace
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            How this workspace appears to its members.
          </Typography>
          <WorkspaceForm
            defaultName={ctx.active.name}
            slug={ctx.active.slug}
            canEdit={canManage}
          />
        </CardContent>
      </Card>

      {canManage ? (
        <DangerZone workspaceName={ctx.active.name} canDelete={canManage} />
      ) : null}
    </Stack>
  );
}
