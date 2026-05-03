import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";

export default function CTASection() {
  return (
    <Box component="section" id="contact" sx={{ pb: { xs: 8, md: 12 }, pt: { xs: 2, md: 4 } }}>
      <Container>
        <Paper
          variant="outlined"
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 4,
            p: { xs: 4, md: 8 },
            background:
              "radial-gradient(800px 380px at 100% 0%, rgba(3,105,161,0.22), transparent 60%), linear-gradient(135deg,#4338CA 0%, #312A9C 100%)",
            color: "common.white",
            border: 0,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 4, md: 6 }}
            sx={{
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
            }}
          >
            <Stack spacing={1.5} sx={{ maxWidth: 620 }}>
              <Typography
                variant="h2"
                sx={{ fontSize: { xs: "1.85rem", md: "2.5rem" }, color: "common.white" }}
              >
                Let's build your system
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: { xs: "1rem", md: "1.1rem" },
                }}
              >
                Available for SaaS builds, AI integrations, and platform engineering work.
                Start with a 30-minute call — no pitch deck, just a working session.
              </Typography>
            </Stack>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ width: { xs: "100%", md: "auto" } }}
            >
              <Button
                size="large"
                variant="contained"
                href="https://www.upwork.com/freelancers/~01e2fb2cd37f32f0ad?viewMode=1"
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{
                  bgcolor: "#14A800",
                  color: "common.white",
                  "&:hover": { bgcolor: "#108A00" },
                }}
              >
                Hire on Upwork
              </Button>
              <Button
                size="large"
                variant="outlined"
                href="mailto:theuy.limpanont@gmail.com"
                startIcon={<ChatBubbleRoundedIcon />}
                sx={{
                  borderColor: "rgba(255,255,255,0.7)",
                  color: "common.white",
                  "&:hover": {
                    borderColor: "common.white",
                    bgcolor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                Email me
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
