"use client";

import { usePathname } from "next/navigation";
import NextLink from "next/link";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

const tabs = [
  { href: "/dashboard/settings/profile", label: "Profile" },
  { href: "/dashboard/settings/workspace", label: "Workspace" },
];

export default function SettingsTabs() {
  const pathname = usePathname();
  const value = tabs.findIndex((t) => pathname.startsWith(t.href));
  return (
    <Tabs value={value === -1 ? 0 : value} sx={{ mb: 3 }}>
      {tabs.map((t) => (
        <Tab
          key={t.href}
          label={t.label}
          component={NextLink}
          href={t.href}
        />
      ))}
    </Tabs>
  );
}
