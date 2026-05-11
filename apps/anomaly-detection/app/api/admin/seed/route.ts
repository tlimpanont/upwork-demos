import { NextResponse, type NextRequest } from "next/server";
import { join } from "node:path";
import { runSeed } from "@/lib/seed/runner";

export const runtime = "nodejs";
// Re-seeding 192 images takes ~30–60s of blob round trips. 300 is the
// Vercel Pro cap; Hobby caps at 60 and the run may need to be split into
// smaller chunks if hitting that limit becomes a problem.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Protected endpoint that restores the demo workspace from the bundled
// baseline. Two invokers:
//   - Vercel Cron (configured in vercel.json) hits this nightly with the
//     `Authorization: Bearer ${CRON_SECRET}` header that Vercel signs
//     automatically when CRON_SECRET is set in project env vars.
//   - A human can curl with the same secret for one-off resets.

async function handle(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on the deployment." },
      { status: 500 },
    );
  }
  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.MONGODB_URI) {
    return NextResponse.json(
      { error: "MONGODB_URI is not set" },
      { status: 500 },
    );
  }

  // The baseline JSON + images ride along inside the function bundle. See
  // next.config.ts (`outputFileTracingIncludes`) which explicitly opts the
  // scripts/baseline directory into the deployed function output.
  const baselineDir = join(process.cwd(), "scripts", "baseline");

  try {
    const result = await runSeed({
      mongoUri: process.env.MONGODB_URI,
      dbName: process.env.MONGODB_DB ?? "anomaly_detection",
      demoEmail: process.env.DEMO_USER_EMAIL ?? "demo@anomaly.local",
      demoPassword: process.env.DEMO_USER_PASSWORD ?? "demo1234",
      demoName: "Demo Operator",
      baselineDir,
    });
    return NextResponse.json({ ...result, ranAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Seed failed",
        ranAt: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// Vercel Cron sends a GET by default; we accept POST too so a curl-based
// manual reset reads naturally as a write operation.
export const GET = handle;
export const POST = handle;
