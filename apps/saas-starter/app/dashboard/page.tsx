import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import { getTenantContext } from "@/lib/active-organization";

export default async function DashboardPage() {
  const ctx = await getTenantContext();
  if (!ctx) return null;

  if (!ctx.active) {
    return (
      <Box sx={{ maxWidth: 520, mx: "auto", textAlign: "center", py: 6 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Create your first workspace
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          Workspaces hold your team, data, and billing. You can create more later.
        </Typography>
        <Button
          href="/dashboard/organizations/new"
          variant="contained"
          size="large"
        >
          Create workspace
        </Button>
      </Box>
    );
  }

  const stats = [
    {
      label: "Members",
      value: "1",
      delta: "Phase 6 unlocks invites",
      icon: <GroupsOutlinedIcon color="primary" />,
    },
    {
      label: "Workspaces",
      value: String(ctx.orgs.length),
      delta: ctx.orgs.length === 1 ? "Add another anytime" : "All in switcher",
      icon: <BusinessOutlinedIcon color="primary" />,
    },
    {
      label: "MRR",
      value: "$0",
      delta: "Stripe wires in Phase 5",
      icon: <PaidOutlinedIcon color="primary" />,
    },
    {
      label: "Active role",
      value: ctx.active.role,
      delta: ctx.active.role === "admin" ? "Full access" : "Read access",
      icon: <TrendingUpIcon color="primary" />,
    },
  ];

  return (
    <Box>
      <Stack
        direction="row"
        sx={{ alignItems: "flex-end", justifyContent: "space-between", mb: 3 }}
      >
        <Box>
          <Typography variant="h5" component="h1" gutterBottom>
            {ctx.active.name}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Welcome back. Here is what is happening across your workspace.
          </Typography>
        </Box>
        <Chip
          label={`Role: ${ctx.active.role}`}
          color="primary"
          variant="outlined"
          sx={{ textTransform: "capitalize" }}
        />
      </Stack>

      <Grid container spacing={2.5}>
        {stats.map((s) => (
          <Grid key={s.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {s.label}
                  </Typography>
                  {s.icon}
                </Stack>
                <Typography variant="h4" sx={{ mt: 1, textTransform: "capitalize" }}>
                  {s.value}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {s.delta}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
