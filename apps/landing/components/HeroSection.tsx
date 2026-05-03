import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";

export default function HeroSection() {
  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        overflow: "hidden",
        pt: { xs: 8, md: 14 },
        pb: { xs: 8, md: 14 },
        background:
          "radial-gradient(1100px 520px at 50% -120px, rgba(129,140,248,0.22), transparent 70%), radial-gradient(900px 420px at 80% 100%, rgba(56,189,248,0.10), transparent 65%)",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container>
        <Stack spacing={3.5} sx={{ alignItems: "center", textAlign: "center" }}>
          <Chip
            label="Production-ready demos · built for clients"
            sx={{
              bgcolor: "rgba(129,140,248,0.14)",
              color: "primary.light",
              fontWeight: 600,
              border: 0,
            }}
          />
          <Typography
            component="h1"
            variant="h1"
            sx={{
              fontSize: { xs: "2.5rem", sm: "3.25rem", md: "4.25rem" },
              maxWidth: 900,
            }}
          >
            AI-Powered SaaS Systems{" "}
            <Box
              component="span"
              sx={{
                background: "linear-gradient(90deg,#A5B4FC,#7DD3FC)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Ready for Production
            </Box>
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              maxWidth: 720,
              fontWeight: 400,
              fontSize: { xs: "1.05rem", md: "1.2rem" },
            }}
          >
            Customer Support AI, Document Processing, and multi-tenant SaaS platforms —
            three working systems, one consistent stack, deployed on Vercel.
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ pt: 1, width: { xs: "100%", sm: "auto" } }}
          >
            <Button
              size="large"
              variant="contained"
              href="#demos"
              endIcon={<ArrowForwardRoundedIcon />}
            >
              View Demos
            </Button>
            <Button
              size="large"
              variant="outlined"
              href="#contact"
              startIcon={<CalendarMonthRoundedIcon />}
              sx={{
                borderColor: "rgba(255, 255, 255, 0.32)",
                color: "text.primary",
                "&:hover": {
                  borderColor: "text.primary",
                  bgcolor: "rgba(255, 255, 255, 0.06)",
                },
              }}
            >
              Book a Call
            </Button>
          </Stack>

          <Stack
            direction="row"
            spacing={4}
            sx={{ justifyContent: "center", flexWrap: "wrap", pt: 4 }}
          >
            {["Next.js 16", "OpenAI", "Pinecone", "Neon Postgres", "Vercel"].map((label) => (
              <Typography
                key={label}
                variant="caption"
                sx={{
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "text.secondary",
                  fontWeight: 600,
                }}
              >
                {label}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
