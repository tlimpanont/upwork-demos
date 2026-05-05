import { prisma } from "../lib/prisma";
import { buildDailyMetrics, buildUsersAndRevenue } from "../lib/data/seed";

async function main() {
  console.log("[seed] computing dataset…");
  const metrics = buildDailyMetrics();
  const { users, events } = buildUsersAndRevenue(metrics);
  console.log(
    `[seed] computed ${metrics.length} daily metrics, ${users.length} users, ${events.length} revenue events`,
  );

  console.log("[seed] wiping existing rows…");
  // Order matters because of FK from RevenueEvent → User.
  await prisma.revenueEvent.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.dailyMetric.deleteMany({});

  console.log("[seed] writing daily metrics…");
  await prisma.dailyMetric.createMany({ data: metrics });

  console.log("[seed] writing users…");
  // `plan` is carried on UserRow only to derive RevenueEvents — strip before insert.
  const userRows = users.map(({ plan: _plan, ...u }) => u);
  const userChunks = chunk(userRows, 1000);
  for (const c of userChunks) {
    await prisma.user.createMany({ data: c });
  }

  console.log("[seed] writing revenue events…");
  const eventChunks = chunk(events, 2000);
  for (const c of eventChunks) {
    await prisma.revenueEvent.createMany({ data: c });
  }

  const counts = {
    metrics: await prisma.dailyMetric.count(),
    users: await prisma.user.count(),
    events: await prisma.revenueEvent.count(),
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
