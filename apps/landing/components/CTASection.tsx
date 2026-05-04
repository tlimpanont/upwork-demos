import Image from "next/image";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";

type CTAContent = {
  heading: string;
  body: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
};

export default function CTASection({ content }: { content: CTAContent }) {
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
            <Stack spacing={2.5} sx={{ maxWidth: 620 }}>
              <Stack direction="row" spacing={1.75} sx={{ alignItems: "center" }}>
                <Box
                  sx={{
                    position: "relative",
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    overflow: "hidden",
                    flexShrink: 0,
                    boxShadow: "0 0 0 2px rgba(255,255,255,0.18)",
                  }}
                >
                  <Image
                    src="/profile-pic-theuy.jpeg"
                    alt="Theuy Limpanont"
                    fill
                    sizes="48px"
                    style={{ objectFit: "cover" }}
                  />
                </Box>
                <Stack spacing={0.25}>
                  <Typography
                    variant="body2"
                    sx={{ color: "common.white", fontWeight: 700 }}
                  >
                    Theuy Limpanont
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255,255,255,0.7)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Netherlands · CET · Replies within 4h
                  </Typography>
                </Stack>
              </Stack>
              <Typography
                variant="h2"
                sx={{ fontSize: { xs: "1.85rem", md: "2.5rem" }, color: "common.white" }}
              >
                {content.heading}
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: { xs: "1rem", md: "1.1rem" },
                }}
              >
                {content.body}
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
                href={content.primaryCta.href}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{
                  bgcolor: "#14A800",
                  color: "common.white",
                  "&:hover": { bgcolor: "#108A00" },
                }}
              >
                {content.primaryCta.label}
              </Button>
              <Button
                size="large"
                variant="outlined"
                href={content.secondaryCta.href}
                startIcon={<CalendarMonthRoundedIcon />}
                sx={{
                  borderColor: "rgba(255,255,255,0.7)",
                  color: "common.white",
                  "&:hover": {
                    borderColor: "common.white",
                    bgcolor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                {content.secondaryCta.label}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}