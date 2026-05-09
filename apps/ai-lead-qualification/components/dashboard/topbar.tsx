import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Topbar({
  title,
  description,
  breadcrumbs,
  action,
}: {
  title: string;
  description?: string;
  breadcrumbs?: { href?: string; label: string }[];
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/40 bg-card/20 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        {breadcrumbs?.length ? (
          <nav className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
            {breadcrumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {c.href ? (
                  <Link href={c.href} className="hover:text-foreground">
                    {c.label}
                  </Link>
                ) : (
                  <span>{c.label}</span>
                )}
                {i < breadcrumbs.length - 1 ? (
                  <ChevronRight className="h-3 w-3" />
                ) : null}
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {action ?? (
          <Button asChild variant="gradient" size="sm">
            <Link href="/submit">
              <Plus className="h-4 w-4" />
              New lead
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}