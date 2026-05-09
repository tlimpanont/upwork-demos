export type DemoIcon =
  | "chat"
  | "docs"
  | "building"
  | "chart"
  | "route"
  | "target";

export type DemoApp = {
  id:
    | "ai-chatbot"
    | "ai-docs"
    | "saas-starter"
    | "analytics-dashboard"
    | "workflow-automation"
    | "ai-lead-qualification";
  name: string;
  tagline: string;
  description: string;
  features: readonly string[];
  // Short stack/tech labels shown as compact chips on the demo row.
  tags: readonly string[];
  cta: string;
  icon: DemoIcon;
  href: string;
  // Port the app binds to in local dev. The landing redirect uses this when
  // running locally so /<id> hits http://localhost:<devPort> instead of the
  // production subdomain.
  devPort: number;
};

export const APPS: readonly DemoApp[] = [
  {
    id: "ai-chatbot",
    name: "AI Customer Support",
    tagline: "AI chatbot with knowledge base and RAG",
    description:
      "A retrieval-augmented chatbot that answers customer questions grounded in your own documents. Upload a PDF, ask in natural language, get cited answers in seconds.",
    features: [
      "Instant answers from your knowledge base",
      "Document-grounded responses (no hallucinations)",
      "OpenAI + Pinecone vector search",
    ],
    tags: ["RAG", "OpenAI", "Pinecone"],
    cta: "View Live Demo",
    icon: "chat",
    href: "/ai-chatbot",
    devPort: 3001,
  },
  {
    id: "ai-docs",
    name: "AI Document Processing",
    tagline: "Extract structured data from PDFs using AI",
    description:
      "Drop in invoices and business documents. GPT-4o extracts vendor, totals, tax, and line items into structured JSON, then indexes everything for hybrid semantic + numeric search.",
    features: [
      "Invoice parsing with structured outputs",
      "Hybrid semantic + exact-numeric search",
      "Vercel Blob storage + Pinecone index",
    ],
    tags: ["GPT-4o", "Vercel Blob", "Pinecone"],
    cta: "View Live Demo",
    icon: "docs",
    href: "/ai-docs",
    devPort: 3002,
  },
  {
    id: "saas-starter",
    name: "SaaS Starter Platform",
    tagline: "Multi-tenant SaaS with auth, billing, and dashboard",
    description:
      "Production-ready foundation for B2B SaaS: organizations, role-based access control, NextAuth, Stripe checkout & customer portal, and a polished MUI admin dashboard.",
    features: [
      "Stripe Checkout + customer portal",
      "Role-based access control (RBAC)",
      "Multi-tenant data isolation",
    ],
    tags: ["NextAuth v5", "Stripe", "RBAC"],
    cta: "View Live Demo",
    icon: "building",
    href: "/saas-starter",
    devPort: 3003,
  },
  {
    id: "analytics-dashboard",
    name: "AI Analytics Dashboard",
    tagline: "SaaS analytics with prediction engine + GraphQL + AI insights",
    description:
      "A synthetic SaaS dataset, a deterministic forecasting engine, and a GraphQL API, with AI-generated narratives that explain the trend, flag anomalies, and recommend actions.",
    features: [
      "Forecasts + anomaly detection in pure TS",
      "GraphQL Yoga API with live playground",
      "AI insights layer (OpenAI explains, never calculates)",
    ],
    tags: ["Prisma", "GraphQL", "Forecasting"],
    cta: "View Live Demo",
    icon: "chart",
    href: "/analytics-dashboard",
    devPort: 3004,
  },
  {
    id: "workflow-automation",
    name: "AI Incident Triage",
    tagline: "Urgent tickets get routed to Slack in seconds",
    description:
      "Every incoming ticket gets classified by OpenAI (category, priority, intent). A deterministic rules engine (not the LLM) decides where it goes; fraud and outages fire a Slack alert in the same request. Dashboard shows the full pipeline live.",
    features: [
      "OpenAI classification with Zod-validated outputs",
      "Deterministic rules engine in pure TS",
      "Slack delivery for fraud + escalation routes",
    ],
    tags: ["OpenAI", "Slack", "Rules engine"],
    cta: "View Live Demo",
    icon: "route",
    href: "/workflow-automation",
    devPort: 3005,
  },
  {
    id: "ai-lead-qualification",
    name: "AI Lead Qualification",
    tagline: "Score inbound leads and fan them out to your CRM in <5s",
    description:
      "Public form runs an OpenAI structured-output qualifier (score, confidence, signals matrix, est. ARR, follow-up email draft), then a tier-driven dispatcher pushes Hot leads to Salesforce + Slack, Warm into HubSpot + nurture, Cold to self-serve. Every signal ties to a quoted phrase; every dispatch is logged.",
    features: [
      "OpenAI structured outputs (json_schema strict) + Zod parse",
      "Mock HubSpot / Salesforce / Slack / email fan-out per tier",
      "Auditable signals + AI-drafted follow-up email per lead",
    ],
    tags: ["OpenAI", "Structured outputs", "CRM"],
    cta: "View Live Demo",
    icon: "target",
    href: "/ai-lead-qualification",
    devPort: 3006,
  },
] as const;
