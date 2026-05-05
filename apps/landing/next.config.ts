import type { NextConfig } from "next";

const demos = [
  { path: "ai-chatbot", url: process.env.AI_CHATBOT_URL || "http://localhost:3001" },
  { path: "ai-docs", url: process.env.AI_DOCS_URL || "http://localhost:3002" },
  { path: "saas-starter", url: process.env.SAAS_STARTER_URL || "http://localhost:3003" },
  { path: "analytics-dashboard", url: process.env.ANALYTICS_DASHBOARD_URL || "http://localhost:3004" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/config", "@repo/lib"],
  async redirects() {
    return demos.flatMap(({ path, url }) => [
      { source: `/${path}`, destination: url, permanent: false },
      { source: `/${path}/:rest*`, destination: `${url}/:rest*`, permanent: false },
    ]);
  },
};

export default nextConfig;
