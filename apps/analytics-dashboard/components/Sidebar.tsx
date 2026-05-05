import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import type { SvgIconComponent } from "@mui/icons-material";

export type SidebarItem = {
  value: string;
  label: string;
  Icon: SvgIconComponent;
};

const METRIC_ITEMS: SidebarItem[] = [
  { value: "revenue", label: "Revenue", Icon: PaidRoundedIcon },
  { value: "activeUsers", label: "Active users", Icon: GroupsRoundedIcon },
  { value: "newUsers", label: "New users", Icon: PersonAddRoundedIcon },
  { value: "churnRate", label: "Churn rate", Icon: TrendingDownRoundedIcon },
  { value: "conversions", label: "Conversions", Icon: TaskAltRoundedIcon },
];

export const SIDEBAR_WIDTH = 264;

export default function Sidebar({ currentMetric }: { currentMetric: string }) {
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
              background: "linear-gradient(135deg,#A5B4FC,#7DD3FC)",
              display: "grid",
              placeItems: "center",
              color: "#0B0F19",
            }}
          >
            <BoltRoundedIcon fontSize="small" />
          </Box>
          <Stack spacing={0}>
            <Typography sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}>
              Analytics
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Synthetic SaaS demo
            </Typography>
          </Stack>
        </Stack>

        <SidebarSection label="Metrics">
          {METRIC_ITEMS.map((item) => (
            <NavLink
              key={item.value}
              href={`/?metric=${item.value}`}
              icon={<item.Icon fontSize="small" />}
              label={item.label}
              active={item.value === currentMetric}
            />
          ))}
        </SidebarSection>

        <SidebarSection label="Tools">
          <NavLink
            href="#playground"
            icon={<CodeRoundedIcon fontSize="small" />}
            label="GraphQL playground"
          />
          <NavLink
            href="/api/graphql"
            target="_blank"
            icon={<OpenInNewRoundedIcon fontSize="small" />}
            label="GraphiQL"
          />
        </SidebarSection>
      </Stack>

      <Divider />
      <Box sx={{ p: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          Engine: pure TS · GraphQL Yoga · OpenAI narrator
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
  // Nest Link around Box rather than passing `component={Link}`. Sidebar is a
  // server component and MUI's Box is a client component — passing the Link
  // function across that boundary throws "Functions cannot be passed directly
  // to Client Components".
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
          bgcolor: active ? "rgba(165,180,252,0.14)" : "transparent",
          fontWeight: active ? 700 : 500,
          transition: "background 120ms ease, color 120ms ease",
          "&:hover": {
            bgcolor: active ? "rgba(165,180,252,0.2)" : "rgba(255,255,255,0.04)",
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
