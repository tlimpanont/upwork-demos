import {
  Activity,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Send,
  XCircle,
} from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { hydrateLead, type IntegrationLogEntry } from "@/lib/db/lead";
import { Topbar } from "@/components/dashboard/topbar";
import { formatDateTime, formatTime } from "@/lib/utils/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Automations · Lumen" };

type Automation = {
  id: IntegrationLogEntry["integration"];
  label: string;
  description: string;
  trigger: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
};

const AUTOMATIONS: Automation[] = [
  {
    id: "salesforce",
    label: "AE pipeline (Salesforce)",
    description: "Push Hot leads to Salesforce, assign to round-robin AE.",
    trigger: "qualification = Hot",
    icon: Send,
    active: true,
  },
  {
    id: "hubspot",
    label: "CRM contact (HubSpot)",
    description: "Create or update HubSpot contacts for any qualified lead.",
    trigger: "qualification ≠ Cold",
    icon: Activity,
    active: true,
  },
  {
    id: "slack",
    label: "Slack ping (#sales-hot)",
    description: "Notify sales channel for every Hot lead with score ≥ 80.",
    trigger: "qualification = Hot",
    icon: MessageSquare,
    active: true,
  },
  {
    id: "email",
    label: "Tiered email sequences",
    description: "Hot → discovery, Warm → 7-day nurture, Cold → self-serve.",
    trigger: "every lead",
    icon: Mail,
    active: true,
  },
];

export default async function AutomationsPage() {
  const recent = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const hydrated = recent.map(hydrateLead);

  // Aggregate by integration: how many delivered/skipped/failed in the last 30 leads.
  const stats = new Map<
    IntegrationLogEntry["integration"],
    { delivered: number; skipped: number; failed: number; lastAt: string | null }
  >();
  const flatLog: (IntegrationLogEntry & { leadId: string; leadName: string })[] =
    [];
  for (const l of hydrated) {
    for (const log of l.integrationLog) {
      const cur = stats.get(log.integration) ?? {
        delivered: 0,
        skipped: 0,
        failed: 0,
        lastAt: null,
      };
      cur[log.status] += 1;
      if (!cur.lastAt || log.at > cur.lastAt) cur.lastAt = log.at;
      stats.set(log.integration, cur);
      flatLog.push({ ...log, leadId: l.id, leadName: l.name });
    }
  }
  flatLog.sort((a, b) => b.at.localeCompare(a.at));

  return (
    <>
      <Topbar
        title="Automations"
        description="The workflows the pipeline runs against every inbound lead."
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {AUTOMATIONS.map((a) => {
            const s = stats.get(a.id) ?? {
              delivered: 0,
              skipped: 0,
              failed: 0,
              lastAt: null,
            };
            return (
              <Card key={a.id} className="border-border/40">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-inset ring-primary/30">
                        <a.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{a.label}</CardTitle>
                        <CardDescription className="pt-0.5">
                          {a.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={a.active ? "success" : "muted"}>
                      {a.active ? "Active" : "Paused"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="rounded-md bg-emerald-500/5 px-2 py-2 ring-1 ring-inset ring-emerald-500/20">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        Delivered
                      </div>
                      <div className="text-base font-semibold text-emerald-300">
                        {s.delivered}
                      </div>
                    </div>
                    <div className="rounded-md bg-muted/30 px-2 py-2 ring-1 ring-inset ring-border">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        Skipped
                      </div>
                      <div className="text-base font-semibold">{s.skipped}</div>
                    </div>
                    <div
                      className={cn(
                        "rounded-md px-2 py-2 ring-1 ring-inset",
                        s.failed > 0
                          ? "bg-rose-500/5 ring-rose-500/20"
                          : "bg-muted/30 ring-border",
                      )}
                    >
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        Failed
                      </div>
                      <div
                        className={cn(
                          "text-base font-semibold",
                          s.failed > 0 ? "text-rose-300" : "",
                        )}
                      >
                        {s.failed}
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Last sync{" "}
                      {s.lastAt
                        ? formatDateTime(s.lastAt)
                        : "—"}
                    </span>
                    <span className="font-mono">Trigger: {a.trigger}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Automation log</CardTitle>
            <CardDescription>
              Most recent dispatches, newest first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {flatLog.length === 0 ? (
              <p className="rounded-md border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
                No automation events yet. Submit a lead to see the pipeline run.
              </p>
            ) : (
              flatLog.slice(0, 30).map((log, i) => (
                <Link
                  key={i}
                  href={`/leads/${log.leadId}`}
                  className="flex items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:border-border/60 hover:bg-muted/30"
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      log.status === "delivered"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : log.status === "failed"
                          ? "bg-rose-500/15 text-rose-300"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {log.status === "delivered" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : log.status === "failed" ? (
                      <XCircle className="h-3.5 w-3.5" />
                    ) : (
                      <span className="text-xs">—</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{log.message}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {log.leadName}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground/70">
                    {formatTime(log.at)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
