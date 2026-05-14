# AI + SaaS Demo Platform

A Turborepo monorepo bundling **seven production-style demo apps** and a commercial landing page that showcases them as a single portfolio.

Each app runs on a real stack (Next.js 16, React 19, TypeScript strict, Vercel serverless, OpenAI, plus Postgres, MongoDB Atlas, or SQLite depending on the workload), so they're working systems rather than tutorials. Most apps fall back to deterministic stubs when AI keys aren't set, so reviewers can clone-and-run without provisioning every vendor.

Built by [Theuy Limpanont](https://theuy.nl) as a working portfolio for enterprise AI and custom-software engagements.

## What this repo demonstrates

Skills exercised across the portfolio, with the apps that exercise each one:

- **AI integration**: RAG pipelines (`ai-chatbot`, `ai-docs`), OpenAI structured outputs with strict `json_schema` + Zod parsing (`ai-lead-qualification`, `ai-docs`), hybrid semantic + parameterized SQL search (`ai-docs`), open-vocabulary computer vision via Replicate Grounding DINO (`anomaly-detection`), embedding-based anomaly detection on MongoDB Atlas Vector Search (`anomaly-detection`), deterministic stubs that keep every demo interactive without API keys.
- **Data stores**: Neon Postgres (vanilla `pg` and Prisma), MongoDB Atlas with Vector Search, SQLite via Prisma, Pinecone serverless (1024 and 1536-dim indexes), Vercel Blob (private) served through an authenticated proxy.
- **Multi-tenant SaaS**: organization-scoped queries on every request, RBAC with a `can(role, permission)` helper, edge-compatible middleware that protects `/dashboard/*`, NextAuth v5 (Auth.js) with credentials + JWT, last-admin and duplicate-subscription guards (`saas-starter`).
- **Payments**: Stripe Checkout, Customer Portal, signature-verified webhooks, plus a "sync from Stripe" reconciliation path for missed webhooks (`saas-starter`).
- **APIs**: REST route handlers across every app, GraphQL Yoga with live playground (`analytics-dashboard`), Resend transactional email (`landing` contact form).
- **Frontend**: MUI v9 with SSR cache via `@mui/material-nextjs`, Tailwind CSS v4, shadcn/ui primitives on Radix, Recharts, `react-konva` annotation canvas, Keystatic-backed CMS for landing content.
- **Production patterns**: idempotent webhooks, per-route `maxDuration` config, env-as-symlink across the monorepo, separate Neon branches per workload, demo-safe fallbacks, Turborepo task graph with explicit env allowlists.

## Apps

| App | Port | Stack | What it is |
|---|---|---|---|
| [`landing`](./apps/landing) | 3000 | Next.js, MUI, Keystatic, Resend | Commercial homepage; renders the demo catalog from `@repo/config` |
| [`ai-chatbot`](./apps/ai-chatbot) | 3001 | OpenAI, Pinecone, Neon | RAG customer-support chatbot with knowledge-base upload |
| [`ai-docs`](./apps/ai-docs) | 3002 | OpenAI, Pinecone, Neon, Vercel Blob | PDF invoice extraction with hybrid semantic + numeric search |
| [`saas-starter`](./apps/saas-starter) | 3003 | NextAuth v5, Stripe, Neon | Multi-tenant SaaS foundation with RBAC, billing, workspace admin |
| [`analytics-dashboard`](./apps/analytics-dashboard) | 3004 | Prisma, GraphQL Yoga, MUI | Synthetic SaaS dataset with deterministic forecasts and AI narratives |
| [`workflow-automation`](./apps/workflow-automation) | 3005 | OpenAI, Slack, Prisma | Incident triage: OpenAI classifies, rules engine routes, Slack alerts |
| [`ai-lead-qualification`](./apps/ai-lead-qualification) | 3006 | OpenAI structured outputs, Prisma + SQLite, shadcn/ui | Inbound lead pipeline with mock HubSpot / Salesforce / Slack / email fan-out |
| [`anomaly-detection`](./apps/anomaly-detection) | 3007 | MongoDB Atlas Vector Search, Replicate, Konva, NextAuth | Image-sequence anomaly detection with annotation canvas and training metrics |

Each app has its own README with feature list, API reference, and setup steps.

## Shared packages

| Package | Purpose |
|---|---|
| [`@repo/config`](./packages/config) | Single source of truth for the `APPS` catalog the landing page renders |
| [`@repo/ui`](./packages/ui) | Shared MUI components (`DemoCard`) consumed by `landing` |
| [`@repo/lib`](./packages/lib) | Utility helpers (`cx`, `absoluteUrl`) |

Consuming apps declare them in `transpilePackages` in `next.config.ts`, so there's no separate build step.

## Quick start

```bash
# 1. Install (single hoisted node_modules at root)
npm install

# 2. Copy and fill in secrets (most apps run with partial keys; several fall back to deterministic stubs)
cp .env.example .env.local

# 3. Run a single app
npm run dev --workspace=landing                # http://localhost:3000
npm run dev --workspace=ai-chatbot             # http://localhost:3001
npm run dev --workspace=ai-docs                # http://localhost:3002
npm run dev --workspace=saas-starter           # http://localhost:3003
npm run dev --workspace=analytics-dashboard    # http://localhost:3004
npm run dev --workspace=workflow-automation    # http://localhost:3005
npm run dev --workspace=ai-lead-qualification  # http://localhost:3006
npm run dev --workspace=anomaly-detection      # http://localhost:3007

# Or run everything concurrently via Turbo
npm run dev
```

Per-app setup (database migrations, vector-index creation, seed scripts) lives in each app's README.

## Env strategy: one `.env.local`, symlinked

The root `.env.local` is the **single source of truth** for every app. Each app's `apps/<app>/.env.local` is a symlink to it:

```
upwork-demos/.env.local                                  ← real file (gitignored)
   ↑
   ├── apps/landing/.env.local                  → ../../.env.local
   ├── apps/ai-chatbot/.env.local               → ../../.env.local
   ├── apps/ai-docs/.env.local                  → ../../.env.local
   ├── apps/saas-starter/.env.local             → ../../.env.local
   ├── apps/analytics-dashboard/.env.local      → ../../.env.local
   ├── apps/workflow-automation/.env.local      → ../../.env.local
   ├── apps/ai-lead-qualification/.env.local    → ../../.env.local
   └── apps/anomaly-detection/.env.local        → ../../.env.local
```

Next.js reads `.env.local` from each app's directory; the symlink resolves transparently. Edit one file, every app sees the change. The full variable list lives in [`.env.example`](./.env.example), and `turbo.json` declares the per-task env allowlist so cache invalidation tracks the right variables.

### Required variables by app

- `ai-chatbot`, `ai-docs`: `OPENAI_API_KEY`, `DATABASE_URL`, `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, plus `BLOB_READ_WRITE_TOKEN` for `ai-docs`.
- `saas-starter`: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_PRO`.
- `analytics-dashboard`: `ANALYTICS_DATABASE_URL` (own Neon branch); `OPENAI_API_KEY` is optional, the AI narrative falls back to a deterministic summary.
- `workflow-automation`: `WORKFLOW_DATABASE_URL` (own Neon branch), `OPENAI_API_KEY`, optional `SLACK_WEBHOOK_URL`.
- `ai-lead-qualification`: `DATABASE_URL` (defaults to a local SQLite file); `OPENAI_API_KEY` is optional, the qualifier falls back to a heuristic stub.
- `anomaly-detection`: `MONGODB_URI`, `MONGODB_DB`, `BLOB_READ_WRITE_TOKEN`, `AUTH_SECRET`; `REPLICATE_API_TOKEN` is optional (falls back to OpenAI vision, which itself falls back to a deterministic stub).
- `landing`: no secrets for local dev. In production, set `NEXT_PUBLIC_<APP>_URL` for each demo so cards link to the deployed URLs, plus `RESEND_API_KEY`, `RESEND_TO_EMAIL`, `RESEND_FROM_EMAIL` for the contact form.

## Architecture

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Vercel  │  │  OpenAI  │  │ Replicate│  │   Pinecone   │  │ Neon Postgres│  │   MongoDB    │
│ serverless│ │  GPT +   │  │ Grounding│  │   vector     │  │  Prisma / pg │  │  Atlas +     │
│   edge   │  │embeddings│  │   DINO   │  │    search    │  │              │  │ Vector Search│
└──────────┘  └──────────┘  └──────────┘  └──────────────┘  └──────────────┘  └──────────────┘

              ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────────┐
              │  Stripe  │  │  Resend  │  │ Vercel Blob  │  │   NextAuth   │
              │ Checkout │  │  email   │  │  (private)   │  │ v5 + bcrypt  │
              └──────────┘  └──────────┘  └──────────────┘  └──────────────┘
```

Each app picks the subset of services it needs. The monorepo shares deploy mechanics (per-app Vercel project, single root install) but not runtime infrastructure, so blast radius stays per-app.

## Repo layout

```
upwork-demos/
├── apps/
│   ├── landing/                    landing page (3000)
│   ├── ai-chatbot/                 RAG chatbot (3001)
│   ├── ai-docs/                    PDF processing (3002)
│   ├── saas-starter/               multi-tenant SaaS (3003)
│   ├── analytics-dashboard/        forecasts + GraphQL (3004)
│   ├── workflow-automation/        incident triage (3005)
│   ├── ai-lead-qualification/      lead pipeline (3006)
│   └── anomaly-detection/          vector-search anomaly detection (3007)
├── packages/
│   ├── config/                     @repo/config: APPS catalog
│   ├── ui/                         @repo/ui:     shared MUI components
│   └── lib/                        @repo/lib:    utility helpers
├── .env.local                      single source of truth (gitignored)
├── .env.example                    documents required env vars
├── package.json                    npm workspaces + turbo scripts
├── turbo.json                      pipeline config + per-task env allowlists
└── README.md
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run every app in parallel via Turbo |
| `npm run build` | Production build of every app |
| `npm run lint` | Lint every workspace |
| `npm run start` | Start every app from its production build |
| `npm run dev --workspace=<name>` | Run a single app |

## Deploying to Vercel

Each app deploys as its own Vercel project pointing at the same monorepo:

1. Create a Vercel project per app.
2. Set **Root Directory** to `apps/<app-name>`.
3. Vercel auto-detects Next.js and resolves the workspace via `npm install` at the repo root.
4. Add the relevant env-var subset (see above) in project settings.
5. After all apps deploy, set the `NEXT_PUBLIC_<APP>_URL` vars on the `landing` project so demo cards link to the live URLs.

`apps/ai-docs/vercel.json`, `apps/saas-starter/vercel.json`, and `apps/anomaly-detection/vercel.json` configure per-route function `maxDuration` for long-running AI and Stripe operations.

## About

Built by [Theuy Limpanont](https://theuy.nl), a senior engineering partner for enterprise AI and custom-software work. The site, positioning, and case studies live at [theuy.nl](https://theuy.nl).

## License

[MIT](./LICENSE) © Theuy Limpanont