import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import type { DemoApp, DemoIcon } from "@repo/config";

export type DemoCardProps = {
  app: DemoApp;
};

const ICONS: Record<DemoIcon, React.ElementType> = {
  chat: ChatBubbleRoundedIcon,
  docs: DescriptionRoundedIcon,
  building: ApartmentRoundedIcon,
};

// Each accent is the WCAG-safe shade. White text on these passes 4.5:1, and the
// same color used on `${accent}14` tinted bg (chips, icons) passes 4.5:1 too.
// Lighter tinted backgrounds still feel airy because the alpha is only 8–10%.
const ACCENT: Record<DemoIcon, string> = {
  chat: "#4338CA", // indigo-700 — 7.7:1 vs white (matches theme primary)
  docs: "#0369A1", // sky-700   — 6.5:1 vs white
  building: "#047857", // emerald-700 — 5.0:1 vs white
};

export default function DemoCard({ app }: DemoCardProps) {
  const Icon = ICONS[app.icon];
  const accent = ACCENT[app.icon];
  const href = app.deepLink ? `${app.href}${app.deepLink}` : app.href;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
        borderColor: "divider",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
          borderColor: accent,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: { xs: 3, md: 4 } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: `${accent}1A`,
              color: accent,
            }}
          >
            <Icon fontSize="medium" />
          </Box>
          <Chip
            size="small"
            label="Live demo"
            sx={{
              bgcolor: `${accent}14`,
              color: accent,
              fontWeight: 600,
              border: 0,
            }}
          />
        </Stack>

        <Typography variant="h5" component="h3" sx={{ fontWeight: 700, mb: 1 }}>
          {app.name}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, fontWeight: 500 }}
        >
          {app.tagline}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.65 }}>
          {app.description}
        </Typography>

        <Stack spacing={1.25}>
          {app.features.map((feature) => (
            <Stack
              key={feature}
              direction="row"
              spacing={1.25}
              sx={{ alignItems: "flex-start" }}
            >
              <CheckCircleRoundedIcon
                sx={{ fontSize: 18, color: accent, mt: "2px", flexShrink: 0 }}
              />
              <Typography variant="body2" color="text.primary">
                {feature}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>

      <CardActions sx={{ p: { xs: 3, md: 4 }, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          endIcon={<LaunchRoundedIcon />}
          sx={{
            bgcolor: accent,
            "&:hover": { bgcolor: accent, filter: "brightness(0.92)" },
          }}
        >
          {app.cta}
        </Button>
      </CardActions>
    </Card>
  );
}
