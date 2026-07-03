import Image from "next/image";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import TrackClick from "./TrackClick";

type HeroContent = {
  chip: string;
  headingLead: string;
  headingAccent: string;
  subheading: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  supportingBullets: readonly string[];
};

export default function HeroSection({ content }: { content: HeroContent }) {
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
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 5, md: 8 }}
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack
            spacing={3}
            sx={{
              alignItems: { xs: "center", md: "flex-start" },
              textAlign: { xs: "center", md: "left" },
              flex: 1,
            }}
          >
            <Chip
              label={content.chip}
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
              sx={{ fontSize: { xs: "2.5rem", sm: "3.25rem", md: "4rem" } }}
            >
              {content.headingLead}{" "}
              <Box
                component="span"
                sx={{
                  background: "linear-gradient(90deg,#A5B4FC,#7DD3FC)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {content.headingAccent}
              </Box>
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                maxWidth: 620,
                fontWeight: 400,
                fontSize: { xs: "1.05rem", md: "1.15rem" },
              }}
            >
              {content.subheading}
            </Typography>

            {content.supportingBullets.length > 0 && (
              <Stack
                component="ul"
                spacing={1}
                sx={{
                  m: 0,
                  p: 0,
                  listStyle: "none",
                  alignItems: { xs: "center", md: "flex-start" },
                  maxWidth: 620,
                  width: "100%",
                  pt: 0.5,
                }}
              >
                {content.supportingBullets.map((b) => (
                  <Stack
                    key={b}
                    component="li"
                    direction="row"
                    spacing={1.25}
                    sx={{
                      alignItems: "flex-start",
                      textAlign: { xs: "center", md: "left" },
                    }}
                  >
                    <CheckCircleRoundedIcon
                      sx={{
                        color: "primary.light",
                        fontSize: 20,
                        mt: "2px",
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      sx={{ color: "text.primary", fontSize: "0.98rem" }}
                    >
                      {b}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ pt: 1, width: { xs: "100%", sm: "auto" } }}
            >
              <TrackClick event="cta_secondary" data={{ surface: "hero", target: content.secondaryCta.href }}>
              <Button
                size="large"
                variant="contained"
                href={content.secondaryCta.href}
                endIcon={<ArrowForwardRoundedIcon />}
              >
                {content.secondaryCta.label}
              </Button>
              </TrackClick>
            </Stack>
          </Stack>

          <Box
            sx={{
              position: "relative",
              flexShrink: 0,
              width: { xs: 220, sm: 260, md: 320 },
              height: { xs: 220, sm: 260, md: 320 },
              borderRadius: "50%",
              overflow: "hidden",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.08), 0 30px 60px -20px rgba(99,102,241,0.45), 0 0 80px -10px rgba(56,189,248,0.25)",
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, rgba(165,180,252,0.20), transparent 35%, transparent 65%, rgba(125,211,252,0.18))",
                pointerEvents: "none",
              },
            }}
          >
            <Image
              src="/profile-pic-theuy.jpeg"
              alt="Theuy Limpanont"
              fill
              priority
              sizes="(max-width: 600px) 220px, (max-width: 900px) 260px, 320px"
              style={{ objectFit: "cover" }}
            />
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
