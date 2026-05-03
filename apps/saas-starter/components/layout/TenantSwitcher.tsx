"use client";

import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckIcon from "@mui/icons-material/Check";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import { setActiveOrganizationAction } from "@/app/(actions)/tenant-actions";

type Org = {
  id: string;
  name: string;
  slug: string;
  role: "admin" | "member";
};

type Props = {
  orgs: Org[];
  active: Org | null;
};

export default function TenantSwitcher({ orgs, active }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [pending, startTransition] = useTransition();
  const open = Boolean(anchorEl);

  const handleSwitch = (orgId: string) => {
    setAnchorEl(null);
    if (orgId === active?.id) return;
    const fd = new FormData();
    fd.set("organizationId", orgId);
    startTransition(() => setActiveOrganizationAction(fd));
  };

  return (
    <Box>
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        startIcon={<BusinessOutlinedIcon fontSize="small" />}
        endIcon={<KeyboardArrowDownIcon fontSize="small" />}
        disabled={pending}
        sx={{
          borderColor: "divider",
          textTransform: "none",
          fontWeight: 500,
          maxWidth: 240,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {active?.name ?? "Select workspace"}
        </Typography>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { mt: 1, minWidth: 260 } } }}
      >
        <Typography
          variant="overline"
          sx={{ px: 2, color: "text.secondary", display: "block" }}
        >
          Workspaces
        </Typography>
        {orgs.map((org) => (
          <MenuItem
            key={org.id}
            onClick={() => handleSwitch(org.id)}
            selected={org.id === active?.id}
          >
            <ListItemIcon>
              {org.id === active?.id ? (
                <CheckIcon fontSize="small" />
              ) : (
                <BusinessOutlinedIcon fontSize="small" />
              )}
            </ListItemIcon>
            <Box sx={{ flexGrow: 1, mr: 1 }}>
              <Typography variant="body2">{org.name}</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {org.slug}
              </Typography>
            </Box>
            <Chip
              label={org.role}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: 11, textTransform: "capitalize" }}
            />
          </MenuItem>
        ))}
        <Divider />
        <MenuItem href="/dashboard/organizations/new" component="a">
          <ListItemIcon>
            <AddOutlinedIcon fontSize="small" />
          </ListItemIcon>
          New workspace
        </MenuItem>
      </Menu>
    </Box>
  );
}
