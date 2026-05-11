import Image from "next/image";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

type AboutContent = {
  overline: string;
  heading: string;
  body: string;
  bullets: readonly string[];
};

export default function AboutSection({ content }: { content: AboutContent }) {
  return (
    <Box
      component="section"
      id="about"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: "rgba(255, 255, 255, 0.02)",
        borderBlock: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 5, md: 8 }}
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Box
            sx={{
              position: "relative",
              flexShrink: 0,
              width: { xs: 180, sm: 220, md: 260 },
              height: { xs: 180, sm: 220, md: 260 },
              borderRadius: "50%",
              overflow: "hidden",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.08), 0 25px 50px -15px rgba(99,102,241,0.4)",
            }}
          >
            <Image
              src="/profile-pic-theuy.jpeg"
              alt="Theuy Limpanont"
              fill
              sizes="(max-width: 600px) 180px, (max-width: 900px) 220px, 260px"
              style={{ objectFit: "cover" }}
            />
          </Box>

          <Stack
            spacing={2.5}
            sx={{
              flex: 1,
              alignItems: { xs: "center", md: "flex-start" },
              textAlign: { xs: "center", md: "left" },
            }}
          >
            <Typography
              variant="overline"
              sx={{
                color: "primary.light",
                letterSpacing: "0.18em",
                fontWeight: 700,
              }}
            >
              {content.overline}
            </Typography>
            <Typography
              variant="h2"
              sx={{ fontSize: { xs: "1.8rem", md: "2.4rem" } }}
            >
              {content.heading}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ maxWidth: 640, fontSize: { xs: "1rem", md: "1.1rem" } }}
            >
              {content.body}
            </Typography>
            {content.bullets.length > 0 && (
              <Stack
                component="ul"
                spacing={1}
                sx={{
                  m: 0,
                  p: 0,
                  listStyle: "none",
                  alignItems: { xs: "center", md: "flex-start" },
                  pt: 0.5,
                }}
              >
                {content.bullets.map((b) => (
                  <Stack
                    key={b}
                    component="li"
                    direction="row"
                    spacing={1.25}
                    sx={{ alignItems: "flex-start" }}
                  >
                    <CheckCircleRoundedIcon
                      sx={{
                        color: "primary.light",
                        fontSize: 20,
                        mt: "2px",
                        flexShrink: 0,
                      }}
                    />
                    <Typography sx={{ color: "text.primary" }}>{b}</Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
