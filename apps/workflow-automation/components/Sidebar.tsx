import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import AltRouteRoundedIcon from "@mui/icons-material/AltRouteRounded";
import AllInclusiveRoundedIcon from "@mui/icons-material/AllInclusiveRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import type { SvgIconComponent } from "@mui/icons-material";

export type SidebarItem = {
  value: string;
  label: string;
  Icon: SvgIconComponent;
};

const STATUS_FILTERS: SidebarItem[] = [
  { value: "all", label: "All workflows", Icon: AllInclusiveRoundedIcon },
  { value: "completed", label: "Completed", Icon: CheckCircleRoundedIcon },
  { value: "in_progress", label: "In progress", Icon: HourglassTopRoundedIcon },
  { value: "failed", label: "Failed", Icon: ErrorRoundedIcon },
];

export const SIDEBAR_WIDTH = 264;

export default function Sidebar({ currentStatus }: { currentStatus: string }) {
  return (
    <Box
      component="aside"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        borderRight: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
      }}
    >
      <Stack spacing={3} sx={{ p: 3, flexGrow: 1 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.75,
              background: "linear-gradient(135deg,#C4B5FD,#7C3AED)",
              display: "grid",
              placeItems: "center",
              color: "#0B0F19",
            }}
          >
            <AltRouteRoundedIcon fontSize="small" />
          </Box>
          <Stack spacing={0}>
            <Typography sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}>
              Workflows
            </Typography>
            <Typography variant="caption" color="text.secondary">
              AI classifies · rules route
            </Typography>
          </Stack>
        </Stack>

        <SidebarSection label="View">
          {STATUS_FILTERS.map((item) => (
            <NavLink
              key={item.value}
              href={item.value === "all" ? "/" : `/?status=${item.value}`}
              icon={<item.Icon fontSize="small" />}
              label={item.label}
              active={item.value === currentStatus}
            />
          ))}
        </SidebarSection>

        <SidebarSection label="Tools">
          <NavLink
            href="#ingest"
            icon={<SendRoundedIcon fontSize="small" />}
            label="Test ingest"
          />
          <NavLink
            href="/api/workflows?limit=5"
            target="_blank"
            icon={<OpenInNewRoundedIcon fontSize="small" />}
            label="Raw API"
          />
        </SidebarSection>
      </Stack>

      <Divider />
      <Box sx={{ p: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          Engine: pure TS rules · OpenAI classifier · Zod-validated I/O
        </Typography>
      </Box>
    </Box>
  );
}

function SidebarSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: 700,
          px: 1,
          mb: 0.5,
        }}
      >
        {label}
      </Typography>
      {children}
    </Stack>
  );
}

function NavLink({
  href,
  icon,
  label,
  active,
  target,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  target?: string;
}) {
  // Same Link-around-Box pattern as analytics-dashboard so the function value
  // doesn't cross the RSC boundary.
  return (
    <Link href={href} target={target} style={{ textDecoration: "none" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          px: 1.25,
          py: 1,
          borderRadius: 2,
          color: active ? "primary.light" : "text.secondary",
          bgcolor: active ? "rgba(196,181,253,0.16)" : "transparent",
          fontWeight: active ? 700 : 500,
          transition: "background 120ms ease, color 120ms ease",
          "&:hover": {
            bgcolor: active ? "rgba(196,181,253,0.24)" : "rgba(255,255,255,0.04)",
            color: active ? "primary.light" : "text.primary",
          },
        }}
      >
        <Box sx={{ display: "grid", placeItems: "center", color: "inherit" }}>
          {icon}
        </Box>
        <Typography variant="body2" sx={{ color: "inherit", fontWeight: "inherit" }}>
          {label}
        </Typography>
      </Box>
    </Link>
  );
}
