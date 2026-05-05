export type DemoIcon = "chat" | "docs" | "building" | "chart";

export type DemoApp = {
  id: "ai-chatbot" | "ai-docs" | "saas-starter" | "analytics-dashboard";
  name: string;
  tagline: string;
  description: string;
  features: readonly string[];
  // Short stack/tech labels shown as compact chips on the demo row.
  tags: readonly string[];
  cta: string;
  icon: DemoIcon;
  href: string;
  deepLink?: string;
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
    deepLink: "/admin",
  },
  {
    id: "ai-docs",
    name: "AI Document Processing",
    tagline: "Extract structured data from PDFs using AI",
    description:
      "Drop in invoices and business documents — GPT-4o extracts vendor, totals, tax, and line items into structured JSON, then indexes everything for hybrid semantic + numeric search.",
    features: [
      "Invoice parsing with structured outputs",
      "Hybrid semantic + exact-numeric search",
      "Vercel Blob storage + Pinecone index",
    ],
    tags: ["GPT-4o", "Vercel Blob", "Pinecone"],
    cta: "View Live Demo",
    icon: "docs",
    href: "/ai-docs",
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
    deepLink: "/login",
  },
  {
    id: "analytics-dashboard",
    name: "AI Analytics Dashboard",
    tagline: "SaaS analytics with prediction engine + GraphQL + AI insights",
    description:
      "A synthetic SaaS dataset, a deterministic forecasting engine, and a GraphQL API — with AI-generated narratives that explain the trend, flag anomalies, and recommend actions.",
    features: [
      "Forecasts + anomaly detection in pure TS",
      "GraphQL Yoga API with live playground",
      "AI insights layer (OpenAI explains, never calculates)",
    ],
    tags: ["Prisma", "GraphQL", "Forecasting"],
    cta: "View Live Demo",
    icon: "chart",
    href: "/analytics-dashboard",
  },
] as const;
