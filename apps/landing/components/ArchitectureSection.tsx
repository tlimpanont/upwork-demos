import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import CloudRoundedIcon from "@mui/icons-material/CloudRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import InventoryRoundedIcon from "@mui/icons-material/InventoryRounded";
import EastRoundedIcon from "@mui/icons-material/EastRounded";

const ICONS: Record<string, React.ElementType> = {
  cloud: CloudRoundedIcon,
  psychology: PsychologyRoundedIcon,
  hub: HubRoundedIcon,
  storage: StorageRoundedIcon,
  inventory: InventoryRoundedIcon,
};

type ArchitectureContent = {
  overline: string;
  heading: string;
  intro: string;
  layers: readonly {
    name: string;
    detail: string;
    icon: string;
    accent: string;
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
      id="architecture"
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
          sx={{ alignItems: "center", textAlign: "center", mb: { xs: 5, md: 7 } }}
        >
          <Typography
            variant="overline"
            sx={{ color: "primary.light", letterSpacing: "0.18em", fontWeight: 700 }}
          >
            {content.overline}
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}>
            {content.heading}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: 660, fontSize: { xs: "1rem", md: "1.1rem" } }}
          >
            {content.intro}
          </Typography>
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 2, md: 1.5 }}
          sx={{ alignItems: "stretch", justifyContent: "center" }}
        >
          {content.layers.map((layer, idx) => {
            const Icon = ICONS[layer.icon] ?? CloudRoundedIcon;
            return (
              <Stack
                key={layer.name}
                direction={{ xs: "row", md: "row" }}
                spacing={{ xs: 1.5, md: 1 }}
                sx={{ alignItems: "center", flex: 1 }}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    flex: 1,
                    p: { xs: 2.5, md: 3 },
                    borderRadius: 3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: 1,
                    bgcolor: "background.paper",
                    transition: "transform 180ms ease, border-color 180ms ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      borderColor: layer.accent,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: `${layer.accent}1F`,
                      color: layer.accent,
                      mb: 0.5,
                    }}
                  >
                    <Icon />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {layer.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {layer.detail}
                  </Typography>
                </Paper>
                {idx < content.layers.length - 1 && (
                  <EastRoundedIcon
                    sx={{
                      color: "text.secondary",
                      opacity: 0.5,
                      display: { xs: "none", md: "block" },
                    }}
                  />
                )}
              </Stack>
            );
          })}
        </Stack>
      </Container>
    </Box>
  );
}
