import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const counts = await safeCounts();

  return (
    <Box sx={{ minHeight: "100vh", py: { xs: 6, md: 10 } }}>
      <Container>
        <Stack spacing={3}>
          <Chip
            label="Phase 1 · scaffold + seed"
            sx={{
              alignSelf: "flex-start",
              bgcolor: "rgba(196,181,253,0.16)",
              color: "primary.light",
              fontWeight: 600,
            }}
          />
          <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}>
            Workflow Automation
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 640 }}>
            AI classifies inputs, deterministic rules route them. Phase 1 wires the
            database and seed; classifier, rules engine, API, and dashboard land in
            later phases.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" },
              pt: 2,
            }}
          >
            <Stat label="Total" value={counts.total} />
            <Stat label="Completed" value={counts.completed} />
            <Stat label="In progress" value={counts.inProgress} />
            <Stat label="Failed" value={counts.failed} />
          </Box>

          {!counts.connected && (
            <Typography variant="body2" color="warning.main">
              Database not reachable. Run <code>npm run db:push</code> then{" "}
              <code>npm run db:seed</code>.
            </Typography>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

async function safeCounts() {
  try {
    const [total, completed, failed, inProgress] = await Promise.all([
      prisma.workflow.count(),
      prisma.workflow.count({ where: { status: "completed" } }),
      prisma.workflow.count({ where: { status: "failed" } }),
      prisma.workflow.count({
        where: { status: { in: ["pending", "classified", "routed"] } },
      }),
    ]);
    return { total, completed, failed, inProgress, connected: true };
  } catch {
    return { total: 0, completed: 0, failed: 0, inProgress: 0, connected: false };
  }
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
      >
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
        {value.toLocaleString()}
      </Typography>
    </Box>
  );
}
