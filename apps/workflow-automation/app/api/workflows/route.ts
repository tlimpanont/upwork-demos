import { prisma } from "@/lib/prisma";
import {
  type Status,
  type RoutingTarget,
  Prisma,
} from "@/prisma/generated/client";

const VALID_STATUSES: readonly Status[] = [
  "pending",
  "classified",
  "routed",
  "completed",
  "failed",
];
const VALID_TARGETS: readonly RoutingTarget[] = [
  "finance",
  "engineering",
  "fraud",
  "general",
  "escalation",
  "unknown",
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const routedTo = url.searchParams.get("routedTo");
  const category = url.searchParams.get("category");
  const limit = clamp(Number(url.searchParams.get("limit") ?? 50), 1, 200);
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));

  const where: Prisma.WorkflowWhereInput = {};
  if (status && (VALID_STATUSES as readonly string[]).includes(status)) {
    where.status = status as Status;
  }
  if (routedTo && (VALID_TARGETS as readonly string[]).includes(routedTo)) {
    where.routedTo = routedTo as RoutingTarget;
  }
  if (category) {
    // Postgres jsonb path query: classification->>'category' = $category.
    where.classification = { path: ["category"], equals: category };
  }

  const [items, total] = await Promise.all([
    prisma.workflow.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.workflow.count({ where }),
  ]);

  return Response.json({ items, total, limit, offset });
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
