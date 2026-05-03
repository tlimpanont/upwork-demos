"use client";

import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { signOutAction } from "@/app/(actions)/auth-actions";
import TenantSwitcher from "./TenantSwitcher";
import { SIDEBAR_WIDTH } from "./Sidebar";

type Org = { id: string; name: string; slug: string; role: "admin" | "member" };

type Props = {
  onOpenSidebar: () => void;
  user: { name?: string | null; email?: string | null } | null;
  orgs: Org[];
  activeOrg: Org | null;
};

function initialsFor(user: Props["user"]): string {
  const source = user?.name?.trim() || user?.email || "";
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function Topbar({ onOpenSidebar, user, orgs, activeOrg }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        ml: { md: `${SIDEBAR_WIDTH}px` },
        bgcolor: "background.default",
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <IconButton
          edge="start"
          onClick={onOpenSidebar}
          sx={{ display: { md: "none" } }}
          aria-label="Open navigation"
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }}>
          <TenantSwitcher orgs={orgs} active={activeOrg} />
        </Box>

        <Tooltip title="Help">
          <IconButton size="small">
            <HelpOutlineOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Notifications">
          <IconButton size="small">
            <NotificationsNoneOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={user?.name ?? user?.email ?? "Account"}>
          <IconButton
            size="small"
            sx={{ ml: 0.5 }}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <Avatar sx={{ width: 28, height: 28, fontSize: 13 }}>
              {initialsFor(user)}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          open={open}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { mt: 1, minWidth: 220 } } }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {user?.name ?? "Signed in"}
            </Typography>
            {user?.email ? (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {user.email}
              </Typography>
            ) : null}
          </Box>
          <Divider />
          <MenuItem href="/dashboard/settings" component="a">
            <ListItemIcon>
              <SettingsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            Settings
          </MenuItem>
          <Divider />
          <Box
            component="form"
            action={signOutAction}
            sx={{ "& button": { width: "100%" } }}
          >
            <MenuItem component="button" type="submit">
              <ListItemIcon>
                <LogoutOutlinedIcon fontSize="small" />
              </ListItemIcon>
              Sign out
            </MenuItem>
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
