import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { KPICard } from "@/components/dashboard/kpi-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  loadKPIs,
  loadLeadsOverTime,
  loadQualificationBreakdown,
  loadScoreDistribution,
} from "@/lib/db/analytics";
import { prisma } from "@/lib/db/prisma";
import { hydrateLead } from "@/lib/db/lead";
import { ScoreDistributionChart } from "@/components/charts/score-distribution-chart";
import { LeadsOverTimeChart } from "@/components/charts/leads-over-time-chart";
import { QualificationBreakdown } from "@/components/charts/qualification-breakdown";
import { Badge } from "@/components/ui/badge";
import { qualificationBadgeVariant } from "@/components/leads/qualification-badge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard · Lumen" };

export default async function DashboardPage() {
  const [kpis, scoreDist, byDay, qualMix, recentRaw] = await Promise.all([
    loadKPIs(),
    loadScoreDistribution(),
    loadLeadsOverTime(30),
    loadQualificationBreakdown(),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);
  const recent = recentRaw.map(hydrateLead);

  return (
    <>
      <Topbar
        title="Overview"
        description="The state of your inbound pipeline at a glance."
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            label="Total leads"
            value={kpis.total}
            delta={kpis.trend.totalDelta}
          />
          <KPICard
            label="Qualified"
            value={kpis.qualified}
            delta={kpis.trend.qualifiedDelta}
          />
          <KPICard
            label="Conversion rate"
            value={kpis.conversionRate}
            delta={kpis.trend.conversionDelta}
            format="percent"
          />
          <KPICard
            label="Avg lead score"
            value={kpis.avgScore}
            format="score"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Leads over time</CardTitle>
              <CardDescription>
                Total submissions and qualified leads in the last 30 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeadsOverTimeChart data={byDay} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Qualification mix</CardTitle>
              <CardDescription>All-time breakdown.</CardDescription>
            </CardHeader>
            <CardContent>
              <QualificationBreakdown data={qualMix} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Score distribution</CardTitle>
              <CardDescription>How AI scored the inbound pool.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreDistributionChart data={scoreDist} />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent leads</CardTitle>
              <CardDescription>
                Last 6 inbound submissions and the AI&apos;s recommendation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {recent.length === 0 ? (
                <p className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                  No leads yet.{" "}
                  <Link href="/submit" className="text-primary hover:underline">
                    Submit one
                  </Link>{" "}
                  to see the pipeline run.
                </p>
              ) : (
                recent.map((l) => (
                  <Link
                    key={l.id}
                    href={`/leads/${l.id}`}
                    className="flex items-center justify-between rounded-lg border border-transparent bg-muted/20 px-3 py-2.5 text-sm transition-colors hover:border-border/60 hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{l.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {l.company ?? "—"}
                        </span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {l.recommendedAction ?? "Pending qualification…"}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pl-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {l.aiScore ?? "—"}
                      </span>
                      {l.qualification ? (
                        <Badge
                          variant={qualificationBadgeVariant(l.qualification)}
                        >
                          {l.qualification}
                        </Badge>
                      ) : (
                        <Badge variant="muted">Pending</Badge>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}