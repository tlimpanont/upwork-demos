// Plain module so both the client form and the server action can import
// the same source-of-truth list. Lives outside actions.ts because
// "use server" files can only export async functions.
export const PROJECT_TYPES = [
  "AI Automation",
  "Custom SaaS",
  "Computer Vision",
  "Analytics Dashboards",
  "ERP / API Integration",
  "Predictive AI",
  "Audit / Roadmap",
  "Other",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];
