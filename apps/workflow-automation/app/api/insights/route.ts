import { prisma } from "@/lib/prisma";
import { narrate, type SystemMetrics } from "@/lib/ai/insights";

export async function GET() {
  try {
    const metrics = await aggregateMetrics();
    const insights = await narrate(metrics);
    return Response.json({ metrics, insights });
  } catch (e) {
    return Response.json(
      { error: "Failed to compute insights", message: (e as Error).message },
      { status: 500 },
    );
  }
}

async function aggregateMetrics(): Promise<SystemMetrics> {
  const [total, completed, failed, inProgress, avgDuration, byTarget] =
    await Promise.all([
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

  // Category and peak-hour need raw SQL because category lives inside a
  // jsonb column and Prisma's groupBy only works on real columns.
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
      .map((r) => ({
        routedTo: r.routedTo as string,
        count: r._count._all,
      })),
    peakHourUtc: peakHourRows[0]?.hour ?? null,
  };
}
