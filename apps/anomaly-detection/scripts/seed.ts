import { resolve } from "node:path";
import { runSeed } from "../lib/seed/runner";

// Thin CLI wrapper around lib/seed/runner.ts so a developer can re-seed
// from the terminal (`npm run db:seed`). The same runner is mounted at
// /api/admin/seed for the Vercel cron job that resets the demo nightly.

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }
  await runSeed({
    mongoUri: process.env.MONGODB_URI,
    dbName: process.env.MONGODB_DB ?? "anomaly_detection",
    demoEmail: process.env.DEMO_USER_EMAIL ?? "demo@anomaly.local",
    demoPassword: process.env.DEMO_USER_PASSWORD ?? "demo1234",
    demoName: "Demo Operator",
    baselineDir: resolve(__dirname, "baseline"),
  });
  console.log(
    `[seed] done. Sign in as ${process.env.DEMO_USER_EMAIL ?? "demo@anomaly.local"} / ${process.env.DEMO_USER_PASSWORD ?? "demo1234"}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
