"use client";

import { usePathname } from "next/navigation";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

export const SIDEBAR_WIDTH = 256;

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const items: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: <DashboardOutlinedIcon /> },
  { href: "/dashboard/users", label: "Users", icon: <GroupsOutlinedIcon /> },
  { href: "/dashboard/organizations", label: "Organizations", icon: <BusinessOutlinedIcon /> },
  { href: "/dashboard/billing", label: "Billing", icon: <CreditCardOutlinedIcon /> },
  { href: "/dashboard/settings", label: "Settings", icon: <SettingsOutlinedIcon /> },
];

type Props = {
  mobileOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ mobileOpen, onClose }: Props) {
  const pathname = usePathname();

  const content = (
    <Box>
      <Toolbar sx={{ px: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.25,
              background:
                "linear-gradient(135deg, #5B5BFE 0%, #0EA5E9 100%)",
            }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Acme SaaS
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 2 }}>
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NextLink}
                href={item.href}
                selected={active}
                onClick={onClose}
                sx={{
                  borderRadius: 2,
                  "&.Mui-selected": {
                    bgcolor: "action.selected",
                    "& .MuiListItemIcon-root": { color: "primary.main" },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: { sx: { fontSize: 14, fontWeight: 500 } },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH },
        }}
      >
        {content}
      </Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH, boxSizing: "border-box" },
        }}
      >
        {content}
      </Drawer>
    </Box>
  );
}
