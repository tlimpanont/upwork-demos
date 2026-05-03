import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";

const POINTS = [
  {
    title: "Production-ready architecture",
    body: "Each demo uses the same patterns we ship to paying customers: typed APIs, server actions, audit-grade auth, and proper error handling.",
    Icon: VerifiedRoundedIcon,
  },
  {
    title: "Built for scalability",
    body: "Serverless by default. Postgres scales to millions of rows, Pinecone to billions of vectors, and Vercel handles the traffic spikes for you.",
    Icon: TrendingUpRoundedIcon,
  },
  {
    title: "Used for real SaaS products",
    body: "These aren't tutorial apps. The same building blocks power live products — auth, billing, multi-tenant data, and AI workflows that earn revenue.",
    Icon: RocketLaunchRoundedIcon,
  },
];

export default function TrustSection() {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 12 } }}>
      <Container>
        <Stack
          spacing={1.5}
          sx={{ alignItems: "center", textAlign: "center", mb: { xs: 5, md: 7 } }}
        >
          <Typography
            variant="overline"
            sx={{ color: "primary.light", letterSpacing: "0.18em", fontWeight: 700 }}
          >
            Why this matters
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}>
            Demos that ship, not toys
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 3, md: 4 },
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          }}
        >
          {POINTS.map(({ title, body, Icon }) => (
            <Stack key={title} spacing={2}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: "rgba(165,180,252,0.14)",
                  color: "primary.light",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon />
              </Box>
              <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
              <Typography color="text.secondary">{body}</Typography>
            </Stack>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
