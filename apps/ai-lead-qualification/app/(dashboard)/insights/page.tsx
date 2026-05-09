import { Brain, Lightbulb, TrendingUp } from "lucide-react";
import { Topbar } from "@/components/dashboard/topbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loadInsightsMetrics } from "@/lib/db/insights";
import { generateInsights } from "@/lib/ai/insights";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI insights — Lumen" };

export default async function InsightsPage() {
  const metrics = await loadInsightsMetrics();
  const insights = await generateInsights(metrics);

  return (
    <>
      <Topbar
        title="AI insights"
        description="Patterns the AI has spotted across your inbound pool."
      />
      <div className="space-y-6 p-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Pipeline summary
              </CardTitle>
              <Badge variant="muted">
                {insights.source === "openai" ? "GPT-4o-mini" : "Heuristic stub"}
              </Badge>
            </div>
            <CardDescription>
              Generated from {formatNumber(metrics.total)} leads.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-base leading-relaxed">
              {insights.summary || "Submit some leads and the summary will appear here."}
            </p>

            {insights.recommendations.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Recommendations
                </div>
                <ul className="space-y-2">
                  {insights.recommendations.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-border/40 bg-card/60 p-3 text-sm"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-xs text-primary">
                        {i + 1}
                      </span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Most common lead signals</CardTitle>
              <CardDescription>
                Tags the AI assigned across all qualifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {metrics.topTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags yet.</p>
              ) : (
                metrics.topTags.map((t) => (
                  <BarRow
                    key={t.tag}
                    label={t.tag}
                    value={t.count}
                    max={metrics.topTags[0]?.count ?? 1}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top services requested</CardTitle>
              <CardDescription>
                What inbound leads are asking about.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {metrics.topServices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                metrics.topServices.map((s) => (
                  <BarRow
                    key={s.service}
                    label={s.service}
                    value={s.count}
                    max={metrics.topServices[0]?.count ?? 1}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>High-converting industries</CardTitle>
              <CardDescription>
                Inferred from company + inquiry text.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.topIndustries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Not enough data yet — add 10+ leads.
                </p>
              ) : (
                metrics.topIndustries.map((i) => (
                  <div key={i.industry} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{i.industry}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {(i.conversionRate * 100).toFixed(0)}% · {i.count} leads
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full",
                          i.conversionRate >= 0.6
                            ? "bg-emerald-500/70"
                            : i.conversionRate >= 0.4
                              ? "bg-amber-500/70"
                              : "bg-sky-500/70",
                        )}
                        style={{ width: `${i.conversionRate * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Lead quality trend
              </CardTitle>
              <Badge
                variant={
                  metrics.scoreDelta > 0
                    ? "success"
                    : metrics.scoreDelta < -0.02
                      ? "hot"
                      : "muted"
                }
              >
                {metrics.scoreDelta > 0 ? "+" : ""}
                {(metrics.scoreDelta * 100).toFixed(1)}% MoM
              </Badge>
            </div>
            <CardDescription>
              Average AI score, last 30 days vs prior 30.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Stat
                label="Avg score (all-time)"
                value={metrics.avgScore == null ? "—" : `${metrics.avgScore}`}
              />
              <Stat
                label="Qualified rate"
                value={`${(metrics.qualifiedRate * 100).toFixed(1)}%`}
              />
              <Stat
                label="Total leads"
                value={formatNumber(metrics.total)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function BarRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max === 0 ? 0 : (value / max) * 100;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="capitalize">{label.replace(/-/g, " ")}</span>
        <span className="font-mono text-xs text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary/70"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
