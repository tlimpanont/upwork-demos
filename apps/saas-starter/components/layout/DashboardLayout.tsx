"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Sidebar, { SIDEBAR_WIDTH } from "./Sidebar";
import Topbar from "./Topbar";

type Org = { id: string; name: string; slug: string; role: "admin" | "member" };

type Props = {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null } | null;
  orgs: Org[];
  activeOrg: Org | null;
};

export default function DashboardLayout({ children, user, orgs, activeOrg }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Topbar
        onOpenSidebar={() => setMobileOpen(true)}
        user={user}
        orgs={orgs}
        activeOrg={activeOrg}
      />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          px: { xs: 2, md: 4 },
          py: { xs: 3, md: 4 },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
