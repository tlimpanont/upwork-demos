import type { SvgIconComponent } from "@mui/icons-material";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import OnlinePredictionRoundedIcon from "@mui/icons-material/OnlinePredictionRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";

const ICONS: Record<string, SvgIconComponent> = {
  automation: AutoFixHighRoundedIcon,
  layers: LayersRoundedIcon,
  vision: VisibilityRoundedIcon,
  analytics: InsightsRoundedIcon,
  integration: HubRoundedIcon,
  predictive: OnlinePredictionRoundedIcon,
  psychology: PsychologyRoundedIcon,
  accountTree: AccountTreeRoundedIcon,
};

type ServicesContent = {
  overline: string;
  heading: string;
  intro: string;
  items: readonly {
    title: string;
    body: string;
    bullets: readonly string[];
    icon: string;
  }[];
};

export default function ServicesSection({
  content,
}: {
  content: ServicesContent;
}) {
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
          sx={{
            alignItems: "center",
            textAlign: "center",
            mb: { xs: 5, md: 7 },
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
            sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}
          >
            {content.heading}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: 640, fontSize: { xs: "1rem", md: "1.1rem" } }}
          >
            {content.intro}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 3, md: 4 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
          }}
        >
          {content.items.map(({ title, body, bullets, icon }) => {
            const Icon = ICONS[icon] ?? AutoFixHighRoundedIcon;
            return (
              <Paper
                key={title}
                variant="outlined"
                sx={{
                  p: { xs: 3, md: 3.5 },
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
                  <Typography
                    variant="h5"
                    component="h3"
                    sx={{ fontWeight: 700, fontSize: "1.2rem" }}
                  >
                    {title}
                  </Typography>
                  <Typography color="text.secondary">{body}</Typography>
                  <Stack
                    component="ul"
                    spacing={1}
                    sx={{
                      m: 0,
                      p: 0,
                      listStyle: "none",
                      color: "text.secondary",
                      pt: 0.5,
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
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
