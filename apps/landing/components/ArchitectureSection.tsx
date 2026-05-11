import type { SvgIconComponent } from "@mui/icons-material";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import TerminalRoundedIcon from "@mui/icons-material/TerminalRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import CloudRoundedIcon from "@mui/icons-material/CloudRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";

const ICONS: Record<string, SvgIconComponent> = {
  frontend: CodeRoundedIcon,
  backend: TerminalRoundedIcon,
  ai: PsychologyRoundedIcon,
  data: StorageRoundedIcon,
  cloud: CloudRoundedIcon,
  integrations: HubRoundedIcon,
};

type ArchitectureContent = {
  overline: string;
  heading: string;
  intro: string;
  groups: readonly {
    name: string;
    items: readonly string[];
    icon: string;
  }[];
};

export default function ArchitectureSection({
  content,
}: {
  content: ArchitectureContent;
}) {
  return (
    <Box
      component="section"
      id="technology"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: "rgba(255, 255, 255, 0.02)",
        borderBlock: "1px solid",
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
            sx={{ maxWidth: 660, fontSize: { xs: "1rem", md: "1.1rem" } }}
          >
            {content.intro}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 2.5, md: 3 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
          }}
        >
          {content.groups.map((g) => {
            const Icon = ICONS[g.icon] ?? CodeRoundedIcon;
            return (
              <Paper
                key={g.name}
                variant="outlined"
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 3,
                  bgcolor: "background.paper",
                }}
              >
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: "center" }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: "rgba(165,180,252,0.14)",
                        color: "primary.light",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Icon fontSize="small" />
                    </Box>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      {g.name}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                    {g.items.map((item) => (
                      <Chip
                        key={item}
                        label={item}
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.04)",
                          borderColor: "divider",
                          border: "1px solid",
                          color: "text.primary",
                          fontWeight: 500,
                        }}
                      />
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
