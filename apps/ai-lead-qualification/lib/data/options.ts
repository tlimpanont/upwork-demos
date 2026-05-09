// Single source of truth for the dropdowns on the public form. Reused on the
// dashboard for filters and the seed script for realistic distributions.

export const COMPANY_SIZES = [
  "1 (just me)",
  "2–10",
  "11–50",
  "51–200",
  "201–500",
  "501–1000",
  "1000+",
] as const;

export const BUDGET_RANGES = [
  "No budget yet",
  "<$5k",
  "$5k–$25k",
  "$25k–$100k",
  "$100k+",
] as const;

export const SERVICES = [
  "AI lead qualification",
  "CRM automation",
  "Email workflows",
  "Slack notifications",
  "Sales analytics",
  "Custom integrations",
] as const;

export type CompanySize = (typeof COMPANY_SIZES)[number];
export type BudgetRange = (typeof BUDGET_RANGES)[number];
export type Service = (typeof SERVICES)[number];