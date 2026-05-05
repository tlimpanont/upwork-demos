import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { executeGraphQL } from "@/lib/graphql/execute";
import KpiCards, { type Kpi } from "@/components/KpiCards";
import MetricSwitcher from "@/components/MetricSwitcher";
import MetricChart, {
  type ChartAnomaly,
  type ChartPoint,
} from "@/components/MetricChart";
import AiInsightsPanel from "@/components/AiInsightsPanel";
import GraphQlPlayground from "@/components/GraphQlPlayground";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

const VALID_METRICS = [
  "revenue",
  "activeUsers",
  "newUsers",
  "churnRate",
  "conversions",
] as const;
type Metric = (typeof VALID_METRICS)[number];

const METRIC_META: Record<Metric, { label: string; format: (v: number) => string }> = {
  revenue: { label: "Revenue", format: (v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
  activeUsers: { label: "Active users", format: (v) => v.toLocaleString(undefined, { maximumFractionDigits: 0 }) },
  newUsers: { label: "New users", format: (v) => v.toLocaleString(undefined, { maximumFractionDigits: 0 }) },
  churnRate: { label: "Churn rate", format: (v) => `${(v * 100).toFixed(2)}%` },
  conversions: { label: "Conversions", format: (v) => v.toLocaleString(undefined, { maximumFractionDigits: 0 }) },
};

const QUERY = /* GraphQL */ `
  query Dashboard($metric: Metric!) {
    metrics {
      date
      revenue
      activeUsers
      newUsers
      churnRate
      conversions
    }
    predictions(metric: $metric, horizon: 14) {
      metric
      predictedValue
      confidence
      horizonDays
      trend { direction growthRate }
      forecast { date value }
    }
    anomalies(metric: $metric) {
      date
      value
      zScore
    }
    insights(metric: $metric) {
      metric
      summary
      anomalyNotes
      recommendations
    }
  }
`;

type DailyMetricRow = {
  date: string;
  revenue: number;
  activeUsers: number;
  newUsers: number;
  churnRate: number;
  conversions: number;
};

type DashboardData = {
  metrics: DailyMetricRow[];
  predictions: {
    metric: string;
    predictedValue: number;
    confidence: number;
    horizonDays: number;
    trend: { direction: "up" | "down" | "flat"; growthRate: number };
    forecast: { date: string; value: number }[];
  };
  anomalies: { date: string; value: number; zScore: number }[];
  insights: {
    metric: string;
    summary: string;
    anomalyNotes: string[];
    recommendations: string[];
  };
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ metric?: string }>;
}) {
  const params = await searchParams;
  const metric: Metric = (VALID_METRICS as readonly string[]).includes(params.metric ?? "")
    ? (params.metric as Metric)
    : "revenue";
  const meta = METRIC_META[metric];

  let data: DashboardData | null = null;
  let error: string | null = null;
  try {
    data = await executeGraphQL<DashboardData>(QUERY, { metric });
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar currentMetric={metric} />
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, py: { xs: 3, md: 5 }, px: { xs: 2.5, md: 5 } }}>
        <Stack spacing={3.5}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={2.5}
            sx={{
              alignItems: { xs: "flex-start", lg: "center" },
              justifyContent: "space-between",
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Chip
                  label="Synthetic data · deterministic seed"
                  sx={{ bgcolor: "rgba(165,180,252,0.14)", color: "primary.light", fontWeight: 600 }}
                />
                <Chip
                  label="GraphQL · /api/graphql"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {meta.label}
              </Typography>
              <Typography color="text.secondary">
                Predictions and anomalies from a deterministic engine. AI narrates the numbers — never recomputes them.
              </Typography>
            </Stack>
            {/* Mobile-only: sidebar is hidden on small screens, expose the switcher inline. */}
            <Box sx={{ display: { xs: "block", md: "none" }, width: "100%" }}>
              <MetricSwitcher current={metric} />
            </Box>
          </Stack>

          {error && (
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "error.main", color: "common.white" }}>
              <Typography variant="body2">Failed to load data: {error}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                If the database is empty, run <code>npm run db:push</code> then <code>npm run db:seed</code>.
              </Typography>
            </Box>
          )}

          {data && <DashboardBody metric={metric} meta={meta} data={data} />}
        </Stack>
      </Box>
    </Box>
  );
}

function DashboardBody({
  metric,
  meta,
  data,
}: {
  metric: Metric;
  meta: (typeof METRIC_META)[Metric];
  data: DashboardData;
}) {
  const series = data.metrics.map((m) => ({ date: m.date, value: m[metric] }));
  const last = series.at(-1);
  const recent = series.slice(-30).map((p) => p.value);
  const previous = series.slice(-60, -30).map((p) => p.value);
  const recentMean = mean(recent);
  const previousMean = mean(previous);
  const periodChange = previousMean === 0 ? 0 : (recentMean - previousMean) / previousMean;
  const forecastEnd = data.predictions.forecast.at(-1);

  const kpis: Kpi[] = [
    {
      label: `${meta.label} · today`,
      value: last ? meta.format(last.value) : "—",
      hint: last?.date,
    },
    {
      label: "30-day vs prior 30",
      value: formatPct(periodChange),
      delta: {
        direction: periodChange > 0.001 ? "up" : periodChange < -0.001 ? "down" : "flat",
        value: formatPct(periodChange),
      },
      hint: "rolling mean",
    },
    {
      label: `Forecast · day +${data.predictions.horizonDays}`,
      value: forecastEnd ? meta.format(forecastEnd.value) : "—",
      hint: forecastEnd?.date,
    },
    {
      label: "Confidence",
      value: data.predictions.confidence.toFixed(2),
      hint:
        data.predictions.trend.direction === "up"
          ? `+${(data.predictions.trend.growthRate * 100).toFixed(2)}%/day`
          : data.predictions.trend.direction === "down"
            ? `${(data.predictions.trend.growthRate * 100).toFixed(2)}%/day`
            : "flat",
    },
  ];

  const points: ChartPoint[] = [
    ...series.map((s) => ({ date: s.date, historical: s.value, forecast: null })),
    ...data.predictions.forecast.map((f, i) => ({
      date: f.date,
      historical: i === 0 && last ? last.value : null,
      forecast: f.value,
    })),
  ];
  if (last && data.predictions.forecast[0]) {
    const lastIdx = points.findIndex((p) => p.date === last.date);
    if (lastIdx >= 0) points[lastIdx].forecast = last.value;
  }
  const anomalies: ChartAnomaly[] = data.anomalies.map((a) => ({
    date: a.date,
    value: a.value,
    zScore: a.zScore,
  }));

  return (
    <Stack spacing={3.5}>
      <KpiCards items={kpis} />
      <MetricChart metricLabel={meta.label} points={points} anomalies={anomalies} />
      <Box
        id="playground"
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          scrollMarginTop: 24,
        }}
      >
        <AiInsightsPanel insight={data.insights} />
        <GraphQlPlayground />
      </Box>
    </Stack>
  );
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

function formatPct(x: number): string {
  const sign = x > 0 ? "+" : "";
  return `${sign}${(x * 100).toFixed(1)}%`;
}
