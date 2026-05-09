import { prisma } from "./prisma";
import { hydrateLead } from "./lead";
import type { InsightsMetrics } from "../ai/insights";

// Industry inference is heuristic — the demo doesn't ask for industry on the
// form. We tag from company size + service mix to keep the dashboards
// interesting without changing the schema.
const INDUSTRY_HEURISTICS: { industry: string; match: RegExp }[] = [
  { industry: "SaaS", match: /saas|api|integration|platform/i },
  { industry: "Ecommerce", match: /shop|commerce|store|retail|brand/i },
  { industry: "Agency", match: /agency|studio|consult|creative/i },
  { industry: "Enterprise", match: /enterprise|bank|insur|health|pharma/i },
  { industry: "Startup", match: /startup|seed|series|founder/i },
];

export async function loadInsightsMetrics(): Promise<InsightsMetrics> {
  const all = await prisma.lead.findMany();
  const hydrated = all.map(hydrateLead);

  const total = hydrated.length;
  const qualified = hydrated.filter(
    (l) => l.qualification === "Hot" || l.qualification === "Warm",
  ).length;
  const qualifiedRate = total === 0 ? 0 : qualified / total;
  const avgScore =
    total === 0
      ? null
      : Math.round(
          hydrated.reduce((s, l) => s + (l.aiScore ?? 0), 0) /
            hydrated.filter((l) => l.aiScore != null).length || 0,
        );

  const tagCounts = new Map<string, number>();
  for (const l of hydrated) {
    for (const t of l.aiTags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  const topTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const serviceCounts = new Map<string, number>();
  for (const l of hydrated) {
    for (const s of l.services)
      serviceCounts.set(s, (serviceCounts.get(s) ?? 0) + 1);
  }
  const topServices = Array.from(serviceCounts.entries())
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const industryStats = new Map<string, { count: number; qualified: number }>();
  for (const l of hydrated) {
    const blob = `${l.company ?? ""} ${l.inquiry}`;
    let industry = "Other";
    for (const h of INDUSTRY_HEURISTICS) {
      if (h.match.test(blob)) {
        industry = h.industry;
        break;
      }
    }
    const cur = industryStats.get(industry) ?? { count: 0, qualified: 0 };
    cur.count += 1;
    if (l.qualification === "Hot" || l.qualification === "Warm") {
      cur.qualified += 1;
    }
    industryStats.set(industry, cur);
  }
  const topIndustries = Array.from(industryStats.entries())
    .filter(([, v]) => v.count >= 2)
    .map(([industry, v]) => ({
      industry,
      count: v.count,
      conversionRate: v.qualified / v.count,
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 5);

  const scoreDelta = computeScoreDelta(hydrated);

  return {
    total,
    qualifiedRate,
    avgScore,
    topTags,
    topServices,
    topIndustries,
    scoreDelta,
  };
}

function computeScoreDelta(hydrated: { createdAt: Date; aiScore: number | null }[]): number {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const recent: number[] = [];
  const prev: number[] = [];
  for (const l of hydrated) {
    if (l.aiScore == null) continue;
    const age = now - l.createdAt.getTime();
    if (age <= 30 * day) recent.push(l.aiScore);
    else if (age <= 60 * day) prev.push(l.aiScore);
  }
  if (recent.length === 0 || prev.length === 0) return 0;
  const avg = (xs: number[]) => xs.reduce((s, n) => s + n, 0) / xs.length;
  const a = avg(recent);
  const b = avg(prev);
  if (b === 0) return 0;
  return (a - b) / b;
}
