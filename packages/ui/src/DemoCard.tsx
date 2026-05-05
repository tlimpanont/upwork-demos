import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import AltRouteRoundedIcon from "@mui/icons-material/AltRouteRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import type { DemoApp, DemoIcon } from "@repo/config";

export type DemoCardProps = {
  app: DemoApp;
};

const ICONS: Record<DemoIcon, React.ElementType> = {
  chat: ChatBubbleRoundedIcon,
  docs: DescriptionRoundedIcon,
  building: ApartmentRoundedIcon,
  chart: ShowChartRoundedIcon,
  route: AltRouteRoundedIcon,
};

const ACCENT: Record<DemoIcon, { base: string; tintLight: string; tintDark: string }> = {
  chat: { base: "#4338CA", tintLight: "#4338CA", tintDark: "#A5B4FC" },
  docs: { base: "#0369A1", tintLight: "#0369A1", tintDark: "#7DD3FC" },
  building: { base: "#047857", tintLight: "#047857", tintDark: "#6EE7B7" },
  chart: { base: "#B45309", tintLight: "#B45309", tintDark: "#FCD34D" },
  route: { base: "#6D28D9", tintLight: "#6D28D9", tintDark: "#C4B5FD" },
};

export default function DemoCard({ app }: DemoCardProps) {
  const Icon = ICONS[app.icon];
  const accent = ACCENT[app.icon];
  const demoHref = app.deepLink ? `${app.href}${app.deepLink}` : app.href;
  // Case study slug matches the app id by convention (ai-chatbot.mdoc etc.).
  const caseStudyHref = `/case-studies/${app.id}`;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        gap: { xs: 2, sm: 3 },
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        transition: "transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          borderColor: accent.base,
          transform: "translateY(-1px)",
          boxShadow: 3,
        },
        "&:hover .demo-arrow": { transform: "translateX(4px)" },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          bgcolor: `${accent.base}1A`,
          color: accent.tintLight,
          "[data-dark] &": { color: accent.tintDark },
        }}
      >
        <Icon fontSize="medium" />
      </Box>

      <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
        <Stack
          direction="row"
          spacing={1.25}
          sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {app.name}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
            {app.tags.map((t) => (
              <Chip
                key={t}
                size="small"
                label={t}
                variant="outlined"
                sx={{
                  height: 22,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  borderColor: "divider",
                  color: "text.secondary",
                }}
              />
            ))}
          </Stack>
        </Stack>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.5,
          }}
        >
          {app.tagline}
        </Typography>
      </Stack>

      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: "center",
          flexShrink: 0,
          alignSelf: { xs: "flex-end", sm: "center" },
        }}
      >
        <Box
          component="a"
          href={caseStudyHref}
          sx={{
            color: "text.secondary",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 14,
            transition: "color 180ms ease",
            "&:hover": { color: "text.primary", textDecoration: "underline" },
          }}
        >
          Case study
        </Box>
        <Stack
          component="a"
          href={demoHref}
          target="_blank"
          rel="noopener noreferrer"
          direction="row"
          spacing={0.75}
          sx={{
            alignItems: "center",
            color: accent.tintLight,
            "[data-dark] &": { color: accent.tintDark },
            textDecoration: "none",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            View demo
          </Typography>
          <ArrowForwardRoundedIcon
            fontSize="small"
            className="demo-arrow"
            sx={{ transition: "transform 180ms ease" }}
          />
        </Stack>
      </Stack>
    </Box>
  );
}
