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
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import type { DemoApp, DemoIcon } from "@repo/config";

export type DemoCardProps = {
  app: DemoApp;
};

const ICONS: Record<DemoIcon, React.ElementType> = {
  chat: ChatBubbleRoundedIcon,
  docs: DescriptionRoundedIcon,
  building: ApartmentRoundedIcon,
  chart: ShowChartRoundedIcon,
};

// `base` is used for icon bg fill, hover border, and the contained CTA button
// background — white text on each base passes ≥4.5:1 contrast.
// `tint` is the chip/icon-bg text color. In light mode that text sits on a tinted
// near-white surface, so we keep the dark `base`. In dark mode the same tint
// sits on a near-black surface, so we flip to the light shade.
const ACCENT: Record<DemoIcon, { base: string; tintLight: string; tintDark: string }> = {
  chat: { base: "#4338CA", tintLight: "#4338CA", tintDark: "#A5B4FC" },
  docs: { base: "#0369A1", tintLight: "#0369A1", tintDark: "#7DD3FC" },
  building: { base: "#047857", tintLight: "#047857", tintDark: "#6EE7B7" },
  chart: { base: "#B45309", tintLight: "#B45309", tintDark: "#FCD34D" },
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
          borderColor: accent.base,
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
              bgcolor: `${accent.base}1A`,
              color: accent.tintLight,
              "[data-dark] &": {
                color: accent.tintDark,
              },
            }}
          >
            <Icon fontSize="medium" />
          </Box>
          <Chip
            size="small"
            label="Live demo"
            sx={{
              bgcolor: `${accent.base}14`,
              color: accent.tintLight,
              fontWeight: 600,
              border: 0,
              "[data-dark] &": {
                color: accent.tintDark,
              },
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
                sx={{
                  fontSize: 18,
                  color: accent.tintLight,
                  mt: "2px",
                  flexShrink: 0,
                  "[data-dark] &": {
                    color: accent.tintDark,
                  },
                }}
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
            bgcolor: accent.base,
            "&:hover": { bgcolor: accent.base, filter: "brightness(0.92)" },
          }}
        >
          {app.cta}
        </Button>
      </CardActions>
    </Card>
  );
}
