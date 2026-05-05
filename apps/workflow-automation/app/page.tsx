import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { prisma } from "@/lib/prisma";
import { narrate, type SystemMetrics, type SystemInsights } from "@/lib/ai/insights";
import type { Status, Workflow } from "@/prisma/generated/client";
import Sidebar from "@/components/Sidebar";
import KpiCards, { type Kpi } from "@/components/KpiCards";
import WorkflowTable, { type WorkflowRow } from "@/components/WorkflowTable";
import AiInsightsPanel from "@/components/AiInsightsPanel";
import IngestForm from "@/components/IngestForm";

export const dynamic = "force-dynamic";

type StatusFilter = "all" | "completed" | "failed" | "in_progress";

function parseStatusFilter(s?: string): StatusFilter {
  if (s === "completed" || s === "failed" || s === "in_progress") return s;
  return "all";
}

function statusWhere(filter: StatusFilter): { status?: { in: Status[] } | Status } | undefined {
  if (filter === "all") return undefined;
  if (filter === "in_progress") {
    return { status: { in: ["pending", "classified", "routed"] } };
  }
  return { status: filter };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = parseStatusFilter(params.status);

  let connected = false;
  let metrics: SystemMetrics | null = null;
  let insights: SystemInsights | null = null;
  let insightsError: string | null = null;
  let rows: Workflow[] = [];
  let totalForFilter = 0;

  try {
    [metrics, rows, totalForFilter] = await Promise.all([
      aggregateMetrics(),
      prisma.workflow.findMany({
        where: statusWhere(statusFilter),
        orderBy: { startedAt: "desc" },
        take: 50,
      }),
      prisma.workflow.count({ where: statusWhere(statusFilter) }),
    ]);
    connected = true;
  } catch (e) {
    insightsError = (e as Error).message;
  }

  if (metrics && metrics.total > 0) {
    try {
      insights = await narrate(metrics);
    } catch (e) {
      insightsError = (e as Error).message;
    }
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar currentStatus={statusFilter} />
      <Box
        component="main"
        sx={{ flexGrow: 1, minWidth: 0, py: { xs: 3, md: 5 }, px: { xs: 2.5, md: 5 } }}
      >
        <Stack spacing={3.5}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Chip
                label="Synthetic data · deterministic seed"
                sx={{
                  bgcolor: "rgba(196,181,253,0.16)",
                  color: "primary.light",
                  fontWeight: 600,
                }}
              />
              <Chip
                label="REST · /api/ingest /api/workflows /api/insights"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Workflow pipeline
            </Typography>
            <Typography color="text.secondary">
              OpenAI classifies inputs (category, priority, intent). A deterministic
              rules engine — never the LLM — decides where they go.
            </Typography>
          </Stack>

          {!connected && (
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "error.main", color: "common.white" }}>
              <Typography variant="body2">Failed to load data: {insightsError}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                If the database is empty, run <code>npm run db:push</code> then{" "}
                <code>npm run db:seed</code>.
              </Typography>
            </Box>
          )}

          {connected && metrics && (
            <KpiCards items={buildKpis(metrics)} />
          )}

          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
            }}
          >
            <AiInsightsPanel insights={insights} failedToLoad={insightsError} />
            <IngestForm />
          </Box>

          {connected && (
            <WorkflowTable
              rows={rows.map(toRow)}
              totalLabel={`Showing ${rows.length} of ${totalForFilter}${
                statusFilter === "all" ? "" : ` · filter: ${statusFilter}`
              }`}
            />
          )}
        </Stack>
      </Box>
    </Box>
  );
}

function buildKpis(m: SystemMetrics): Kpi[] {
  return [
    { label: "Total workflows", value: m.total.toLocaleString() },
    {
      label: "Success rate",
      value: `${(m.successRate * 100).toFixed(1)}%`,
      tone: m.successRate >= 0.9 ? "success" : m.successRate >= 0.75 ? "warning" : "error",
      hint: `${m.completed.toLocaleString()} completed · ${m.failed.toLocaleString()} failed`,
    },
    {
      label: "Avg processing time",
      value: m.avgDurationMs == null ? "—" : `${m.avgDurationMs.toFixed(0)} ms`,
      hint: m.peakHourUtc == null ? undefined : `peak hour ${m.peakHourUtc}:00 UTC`,
    },
    {
      label: "In progress",
      value: m.inProgress.toLocaleString(),
      tone: m.inProgress > 50 ? "warning" : "default",
      hint: "queue depth",
    },
  ];
}

async function aggregateMetrics(): Promise<SystemMetrics> {
  const [total, completed, failed, inProgress, avgDuration, byTarget] = await Promise.all([
    prisma.workflow.count(),
    prisma.workflow.count({ where: { status: "completed" } }),
    prisma.workflow.count({ where: { status: "failed" } }),
    prisma.workflow.count({
      where: { status: { in: ["pending", "classified", "routed"] } },
    }),
    prisma.workflow.aggregate({
      _avg: { durationMs: true },
      where: { status: "completed", durationMs: { not: null } },
    }),
    prisma.workflow.groupBy({
      by: ["routedTo"],
      _count: { _all: true },
      orderBy: { _count: { routedTo: "desc" } },
    }),
  ]);

  const categoryRows = await prisma.$queryRaw<
    Array<{ category: string | null; count: bigint }>
  >`
    SELECT classification->>'category' AS category, COUNT(*) AS count
    FROM "Workflow"
    WHERE classification IS NOT NULL
    GROUP BY classification->>'category'
    ORDER BY count DESC
  `;

  const peakHourRows = await prisma.$queryRaw<
    Array<{ hour: number; count: bigint }>
  >`
    SELECT EXTRACT(hour FROM "startedAt")::int AS hour, COUNT(*) AS count
    FROM "Workflow"
    GROUP BY hour
    ORDER BY count DESC
    LIMIT 1
  `;

  const successRate = total === 0 ? 0 : completed / total;
  const avgDurationMs = avgDuration._avg.durationMs ?? null;

  return {
    total,
    completed,
    failed,
    inProgress,
    successRate,
    avgDurationMs,
    categoryDistribution: categoryRows
      .filter((r) => r.category !== null)
      .map((r) => ({ category: r.category as string, count: Number(r.count) })),
    routingDistribution: byTarget
      .filter((r) => r.routedTo !== null)
      .map((r) => ({ routedTo: r.routedTo as string, count: r._count._all })),
    peakHourUtc: peakHourRows[0]?.hour ?? null,
  };
}

function toRow(w: Workflow): WorkflowRow {
  return {
    id: w.id,
    inputType: w.inputType,
    inputText: w.inputText,
    classification: w.classification as WorkflowRow["classification"],
    routedTo: w.routedTo,
    matchedRule: w.matchedRule,
    status: w.status,
    startedAt: w.startedAt.toISOString(),
    completedAt: w.completedAt?.toISOString() ?? null,
    durationMs: w.durationMs,
    errorMessage: w.errorMessage,
    actions: (w.actions as WorkflowRow["actions"]) ?? [],
  };
}
