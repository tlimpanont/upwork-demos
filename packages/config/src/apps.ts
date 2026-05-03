export type DemoIcon = "chat" | "docs" | "building";

export type DemoApp = {
  id: "ai-chatbot" | "ai-docs" | "saas-starter";
  name: string;
  tagline: string;
  description: string;
  features: readonly string[];
  cta: string;
  icon: DemoIcon;
  href: string;
  deepLink?: string;
};

// NEXT_PUBLIC_* env vars are statically inlined by Next at build time, so
// `process.env.X || 'fallback'` resolves to the deployed URL in production
// and to the local dev port during development.
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
    cta: "View Live Demo",
    icon: "chat",
    href: process.env.NEXT_PUBLIC_AI_CHATBOT_URL || "http://localhost:3001",
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
    cta: "View Live Demo",
    icon: "docs",
    href: process.env.NEXT_PUBLIC_AI_DOCS_URL || "http://localhost:3002",
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
    cta: "View Live Demo",
    icon: "building",
    href: process.env.NEXT_PUBLIC_SAAS_STARTER_URL || "http://localhost:3003",
    deepLink: "/login",
  },
] as const;
