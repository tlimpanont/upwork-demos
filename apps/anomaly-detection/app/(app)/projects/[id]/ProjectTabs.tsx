"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type Tab = { label: string; suffix: string };

const TABS: Tab[] = [
  { label: "Overview", suffix: "" },
  { label: "Sequences", suffix: "/sequences" },
  { label: "Annotate", suffix: "/annotate" },
  { label: "Train", suffix: "/train" },
  { label: "Detect", suffix: "/detect" },
  { label: "Reports", suffix: "/reports" },
  { label: "Settings", suffix: "/settings" },
];

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  return (
    <nav className="flex flex-wrap gap-1 border-b border-border/60">
      {TABS.map((tab) => {
        const href = `${base}${tab.suffix}`;
        const active =
          tab.suffix === ""
            ? pathname === base
            : pathname.startsWith(href);
        return (
          <Link
            key={tab.suffix}
            href={href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
