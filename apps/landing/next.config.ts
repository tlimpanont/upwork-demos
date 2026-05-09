import type { NextConfig } from "next";
import { APPS } from "@repo/config";

// Demo redirects:
//   prod  → https://upwork-demos-<id>.theuy.nl
//   dev   → http://localhost:<devPort>
// `process.env.NODE_ENV === "production"` covers both `next start` and Vercel
// deployments; everything else (next dev, tests, scripts) goes to localhost.
const PROD_HOST = (id: string) => `https://upwork-demos-${id}.theuy.nl`;
const DEV_HOST = (port: number) => `http://localhost:${port}`;

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/config", "@repo/lib"],
  async redirects() {
    return APPS.flatMap((app) => {
      const url = isProd ? PROD_HOST(app.id) : DEV_HOST(app.devPort);
      return [
        { source: `/${app.id}`, destination: url, permanent: false },
        {
          source: `/${app.id}/:rest*`,
          destination: `${url}/:rest*`,
          permanent: false,
        },
      ];
    });
  },
};

export default nextConfig;
