import type { GraphQLContext } from "./context";
import { anomaly, predict, type Point } from "../prediction-engine";
import { generateInsights } from "../ai/insights";

const VALID_METRICS = [
  "revenue",
  "activeUsers",
  "newUsers",
  "churnRate",
  "conversions",
] as const;
export type ValidMetric = (typeof VALID_METRICS)[number];

function validateMetric(m: string): ValidMetric {
  if (!(VALID_METRICS as readonly string[]).includes(m)) {
    throw new Error(
      `Unknown metric "${m}". Valid options: ${VALID_METRICS.join(", ")}.`,
    );
  }
  return m as ValidMetric;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function loadSeries(
  prisma: GraphQLContext["prisma"],
  metric: ValidMetric,
): Promise<Point[]> {
  const rows = await prisma.dailyMetric.findMany({
    orderBy: { date: "asc" },
  });
  return rows.map((r) => ({
    date: isoDate(r.date),
    value: r[metric] as number,
  }));
}

export const resolvers = {
  Query: {
    users: (
      _parent: unknown,
      args: { limit?: number | null },
      ctx: GraphQLContext,
    ) =>
      ctx.prisma.user.findMany({
        take: args.limit ?? 50,
        orderBy: { createdAt: "desc" },
      }),

    revenue: (
      _parent: unknown,
      args: { limit?: number | null },
      ctx: GraphQLContext,
    ) =>
      ctx.prisma.revenueEvent.findMany({
        take: args.limit ?? 100,
        orderBy: { timestamp: "desc" },
      }),

    metrics: (
      _parent: unknown,
      args: { from?: string | null; to?: string | null },
      ctx: GraphQLContext,
    ) => {
      const where: { date?: { gte?: Date; lte?: Date } } = {};
      if (args.from) where.date = { ...where.date, gte: new Date(args.from) };
      if (args.to) where.date = { ...where.date, lte: new Date(args.to) };
      return ctx.prisma.dailyMetric.findMany({
        where,
        orderBy: { date: "asc" },
      });
    },

    predictions: async (
      _parent: unknown,
      args: { metric: string; horizon?: number | null },
      ctx: GraphQLContext,
    ) => {
      const metric = validateMetric(args.metric);
      const horizon = args.horizon ?? 14;
      const series = await loadSeries(ctx.prisma, metric);
      const p = predict(metric, series, horizon);
      return {
        metric: p.metric,
        predictedValue: p.forecast.points[0]?.value ?? 0,
        trend: { direction: p.trend.direction, growthRate: p.trend.growthRate },
        confidence: p.confidence,
        forecast: p.forecast.points,
        horizonDays: p.forecast.horizon,
      };
    },

    anomalies: async (
      _parent: unknown,
      args: { metric: string },
      ctx: GraphQLContext,
    ) => {
      const metric = validateMetric(args.metric);
      const series = await loadSeries(ctx.prisma, metric);
      const found = anomaly(series.map((s) => s.value));
      return found.map((a) => ({
        date: series[a.index]?.date ?? "",
        value: a.value,
        zScore: a.zScore,
      }));
    },

    insights: async (
      _parent: unknown,
      args: { metric: string },
      ctx: GraphQLContext,
    ) => {
      const metric = validateMetric(args.metric);
      const series = await loadSeries(ctx.prisma, metric);
      const p = predict(metric, series, 14);
      const r = await generateInsights(p);
      return {
        metric,
        summary: r.summary,
        anomalyNotes: r.anomalyNotes,
        recommendations: r.recommendations,
      };
    },
  },

  // Stringify dates for spec compatibility (the schema declares them as String).
  User: {
    createdAt: (u: { createdAt: Date | string }) =>
      u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
  },
  Revenue: {
    timestamp: (r: { timestamp: Date | string }) =>
      r.timestamp instanceof Date ? r.timestamp.toISOString() : r.timestamp,
  },
  DailyMetric: {
    date: (m: { date: Date | string }) =>
      m.date instanceof Date ? isoDate(m.date) : m.date,
  },
};
