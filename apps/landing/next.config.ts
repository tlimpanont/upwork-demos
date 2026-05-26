import type { NextConfig } from "next";

// Demo URLs are no longer redirected at the edge. Each `/<demo-id>` URL
// is now handled by `app/[demoId]/page.tsx`, which shows a lightweight
// lead-capture gate. The page reads the `demo_gate_passed` cookie and
// only forwards visitors to the real demo (prod subdomain or local dev
// port) after the gate has been satisfied. The destination URL pattern
// lives in `lib/demo-gate.ts`.

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/config", "@repo/lib"],
};

export default nextConfig;
