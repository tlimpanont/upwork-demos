import type { SvgIconComponent } from "@mui/icons-material";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";

type Service = {
  title: string;
  price: string;
  duration: string;
  body: string;
  bullets: readonly string[];
  Icon: SvgIconComponent;
};

const SERVICES: readonly Service[] = [
  {
    title: "AI-powered SaaS MVP",
    price: "From €30,000",
    duration: "6–8 weeks · fixed scope, fixed price",
    body: "Your product, live and earning revenue. Auth, Stripe billing, multi-tenant data, and your first AI feature — all deployed.",
    bullets: [
      "Auth, RBAC, Stripe Checkout + webhooks",
      "Multi-tenant Postgres with audit-grade isolation",
      "One AI feature integrated end-to-end",
      "Deployed on Vercel with monitoring",
    ],
    Icon: LayersRoundedIcon,
  },
  {
    title: "AI feature for an existing SaaS",
    price: "From €15,000",
    duration: "3–4 weeks · drop-in for live products",
    body: "Add a production-grade AI capability to your existing app — RAG, structured extraction, or an agent — wired into your auth and billing.",
    bullets: [
      "RAG with grounded citations",
      "Schema-typed extraction (Zod)",
      "Hybrid semantic + numeric search",
      "Eval harness + cost monitoring",
    ],
    Icon: PsychologyRoundedIcon,
  },
  {
    title: "AI audit & roadmap",
    price: "€125 / hour · from €4,000",
    duration: "1 week · diagnostic + 90-day plan",
    body: "Senior architectural review of your current system or AI strategy. You walk away with a written plan you can hand to any team.",
    bullets: [
      "Code & architecture review",
      "AI cost / quality / latency analysis",
      "90-day technical roadmap",
      "Optional: implementation handover",
    ],
    Icon: AccountTreeRoundedIcon,
  },
];

export default function ServicesSection() {
  return (
    <Box
      component="section"
      id="services"
      sx={{
        py: { xs: 8, md: 12 },
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container>
        <Stack
          spacing={1.5}
          sx={{ alignItems: "center", textAlign: "center", mb: { xs: 5, md: 7 } }}
        >
          <Typography
            variant="overline"
            sx={{ color: "primary.light", letterSpacing: "0.18em", fontWeight: 700 }}
          >
            How I help
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}>
            From idea to production-ready
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: 640, fontSize: { xs: "1rem", md: "1.1rem" } }}
          >
            Three things I'm hired for — and the patterns I bring with me, so you
            don't pay for me to invent the wheel each engagement.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 3, md: 4 },
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          }}
        >
          {SERVICES.map(({ title, price, duration, body, bullets, Icon }) => (
            <Paper
              key={title}
              variant="outlined"
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Stack spacing={2} sx={{ flexGrow: 1 }}>
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
                <Stack spacing={0.5}>
                  <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
                    {title}
                  </Typography>
                  <Typography sx={{ color: "primary.light", fontWeight: 700 }}>
                    {price}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    {duration}
                  </Typography>
                </Stack>
                <Typography color="text.secondary">{body}</Typography>
                <Stack
                  component="ul"
                  spacing={1}
                  sx={{
                    m: 0,
                    p: 0,
                    listStyle: "none",
                    color: "text.secondary",
                    pt: 1,
                  }}
                >
                  {bullets.map((b) => (
                    <Stack
                      key={b}
                      component="li"
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "flex-start" }}
                    >
                      <Box
                        sx={{
                          mt: "0.55rem",
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: "primary.light",
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2">{b}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}