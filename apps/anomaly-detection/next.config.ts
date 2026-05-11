import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongodb", "pdfkit", "sharp"],
  // The admin seed route reads from scripts/baseline/ at request time.
  // Next's tracer can't statically detect the runtime path joins, so we
  // include the directory explicitly. Without this the Vercel deploy
  // ships the function without the baseline files and the cron resets
  // every project owner's data to the fallback skeleton.
  outputFileTracingIncludes: {
    "/api/admin/seed": ["./scripts/baseline/**/*"],
  },
};

export default nextConfig;
