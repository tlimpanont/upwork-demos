import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const counts = await safeCounts();

  return (
    <Box sx={{ minHeight: "100vh", py: { xs: 6, md: 10 } }}>
      <Container>
        <Stack spacing={3}>
          <Chip
            label="Phase 1 · scaffold + seed"
            sx={{ alignSelf: "flex-start", bgcolor: "rgba(165,180,252,0.14)", color: "primary.light" }}
          />
          <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}>
            Analytics Dashboard
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 640 }}>
            Synthetic SaaS analytics demo. Phase 1 wires the database and seed.
            Forecasting, GraphQL, and AI insights land in later phases.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              pt: 2,
            }}
          >
            <Stat label="Daily metrics" value={counts.metrics} />
            <Stat label="Users" value={counts.users} />
            <Stat label="Revenue events" value={counts.events} />
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
    const [metrics, users, events] = await Promise.all([
      prisma.dailyMetric.count(),
      prisma.user.count(),
      prisma.revenueEvent.count(),
    ]);
    return { metrics, users, events, connected: true };
  } catch {
    return { metrics: 0, users: 0, events: 0, connected: false };
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
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
        {value.toLocaleString()}
      </Typography>
    </Box>
  );
}
