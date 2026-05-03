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

type Layer = {
  name: string;
  detail: string;
  Icon: React.ElementType;
  accent: string;
};

// Light shades of each brand color so icons pop on a dark page surface.
// Each accent passes ≥ 7:1 against the page background for SC 1.4.11.
const LAYERS: Layer[] = [
  {
    name: "Vercel",
    detail: "Serverless edge runtime",
    Icon: CloudRoundedIcon,
    accent: "#FFFFFF",
  },
  {
    name: "OpenAI",
    detail: "GPT-4o + embeddings",
    Icon: PsychologyRoundedIcon,
    accent: "#34D399",
  },
  {
    name: "Pinecone",
    detail: "Vector search",
    Icon: HubRoundedIcon,
    accent: "#A5B4FC",
  },
  {
    name: "Neon Postgres",
    detail: "Serverless SQL",
    Icon: StorageRoundedIcon,
    accent: "#7DD3FC",
  },
  {
    name: "Vercel Blob",
    detail: "Object storage",
    Icon: InventoryRoundedIcon,
    accent: "#FCD34D",
  },
];

export default function ArchitectureSection() {
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
            Architecture
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}>
            Boring stack, modern tools
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: 660, fontSize: { xs: "1rem", md: "1.1rem" } }}
          >
            One coherent stack across all three demos. Battle-tested infrastructure that
            scales to production without a rewrite.
          </Typography>
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 2, md: 1.5 }}
          sx={{ alignItems: "stretch", justifyContent: "center" }}
        >
          {LAYERS.map((layer, idx) => (
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
                  <layer.Icon />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {layer.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {layer.detail}
                </Typography>
              </Paper>
              {idx < LAYERS.length - 1 && (
                <EastRoundedIcon
                  sx={{
                    color: "text.secondary",
                    opacity: 0.5,
                    display: { xs: "none", md: "block" },
                  }}
                />
              )}
            </Stack>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
