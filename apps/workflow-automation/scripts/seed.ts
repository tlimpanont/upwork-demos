import { prisma } from "../lib/prisma";
import { buildWorkflows } from "../lib/data/seed";

async function main() {
  console.log("[seed] computing dataset…");
  const rows = buildWorkflows();
  console.log(`[seed] computed ${rows.length} workflows`);

  console.log("[seed] wiping existing rows…");
  await prisma.workflow.deleteMany({});

  console.log("[seed] writing workflows…");
  // Chunk to keep payload reasonable. Json fields go straight through Prisma.
  const chunks = chunk(rows, 200);
  for (const c of chunks) {
    await prisma.workflow.createMany({
      data: c.map((r) => ({
        id: r.id,
        inputType: r.inputType,
        inputText: r.inputText,
        classification: r.classification as object,
        routedTo: r.routedTo,
        matchedRule: r.matchedRule,
        status: r.status,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        durationMs: r.durationMs,
        errorMessage: r.errorMessage,
        actions: r.actions as object,
      })),
    });
  }

  const counts = {
    total: await prisma.workflow.count(),
    completed: await prisma.workflow.count({ where: { status: "completed" } }),
    failed: await prisma.workflow.count({ where: { status: "failed" } }),
    inProgress: await prisma.workflow.count({
      where: { status: { in: ["pending", "classified", "routed"] } },
    }),
  };
  console.log("[seed] done:", counts);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
