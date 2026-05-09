"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Inbox,
  LayoutDashboard,
  Plug,
  Settings,
  Sparkles,
  Workflow,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Inbox },
  { href: "/insights", label: "AI insights", icon: TrendingUp },
  { href: "/automations", label: "Automations", icon: Workflow },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/40 bg-card/30 lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border/40 px-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[oklch(0.7_0.18_285)] to-[oklch(0.72_0.16_200)]">
            <Sparkles className="h-3.5 w-3.5 text-background" />
          </div>
          <span className="text-sm font-semibold">Lumen</span>
        </Link>
        <Badge variant="muted" className="ml-auto">
          Demo
        </Badge>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/30"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/40 p-3">
        <Link
          href="/submit"
          className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <BarChart3 className="h-3.5 w-3.5" />
          Open public form →
        </Link>
      </div>
    </aside>
  );
}