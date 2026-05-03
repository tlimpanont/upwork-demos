import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { requireTenantContext } from "@/lib/active-organization";
import DataTable, { type Column } from "@/components/ui/DataTable";

type Row = {
  id: string;
  name: string;
  slug: string;
  role: "admin" | "member";
  created_at: string;
  active: boolean;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const columns: ReadonlyArray<Column<Row>> = [
  {
    key: "name",
    header: "Workspace",
    cell: (r) => (
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {r.name}
        </Typography>
        {r.active ? (
          <Chip size="small" label="Active" color="primary" variant="outlined" />
        ) : null}
      </Stack>
    ),
  },
  {
    key: "slug",
    header: "Slug",
    cell: (r) => (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {r.slug}
      </Typography>
    ),
  },
  {
    key: "role",
    header: "Your role",
    width: 140,
    cell: (r) => (
      <Chip
        size="small"
        label={r.role}
        variant={r.role === "admin" ? "filled" : "outlined"}
        color={r.role === "admin" ? "primary" : "default"}
        sx={{ textTransform: "capitalize" }}
      />
    ),
  },
  {
    key: "created",
    header: "Created",
    width: 160,
    cell: (r) => (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {formatDate(r.created_at)}
      </Typography>
    ),
  },
];

export default async function OrganizationsPage() {
  const ctx = await requireTenantContext();
  const rows: Row[] = ctx.orgs.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    role: o.role,
    created_at: o.created_at,
    active: o.id === ctx.active.id,
  }));

  return (
    <Box>
      <Stack
        direction="row"
        sx={{ alignItems: "flex-end", justifyContent: "space-between", mb: 3 }}
      >
        <Box>
          <Typography variant="h5" component="h1" gutterBottom>
            Organizations
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Workspaces you belong to.
          </Typography>
        </Box>
        <Button
          href="/dashboard/organizations/new"
          variant="contained"
          startIcon={<AddOutlinedIcon />}
        >
          New workspace
        </Button>
      </Stack>

      <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} />
    </Box>
  );
}
