import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { APPS } from "@repo/config";
import { DemoCard } from "@repo/ui";

export default function DemoShowcase() {
  return (
    <Box component="section" id="demos" sx={{ py: { xs: 8, md: 12 } }}>
      <Container>
        <Stack
          spacing={1.5}
          sx={{ alignItems: "center", textAlign: "center", mb: { xs: 5, md: 7 } }}
        >
          <Typography
            variant="overline"
            sx={{ color: "primary.light", letterSpacing: "0.18em", fontWeight: 700 }}
          >
            Live demos
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}>
            Three working systems
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: 640, fontSize: { xs: "1rem", md: "1.1rem" } }}
          >
            Click into any demo to use the real product — not a mockup. Each runs on the
            same Vercel + Postgres + AI stack you'd ship to production.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 3, md: 4 },
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, 1fr)",
            },
          }}
        >
          {APPS.map((app) => (
            <DemoCard key={app.id} app={app} />
          ))}
        </Box>
      </Container>
    </Box>
  );
}
