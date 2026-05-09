# AI + SaaS Demo Platform

A Turborepo monorepo bundling three production-ready demo apps and a commercial
landing page that showcases them as a unified platform.

Each demo runs the same stack you'd ship to a client (Next.js 16 · TypeScript · Vercel ·
Postgres · OpenAI), so they're real working systems, not tutorials.

## Apps

| App | Port (dev) | Stack | What it is |
|---|---|---|---|
| [`landing`](./apps/landing) | 3000 | Next.js · MUI | Commercial homepage showcasing the three demos |
| [`ai-chatbot`](./apps/ai-chatbot) | 3001 | Next.js · Tailwind · OpenAI · Pinecone · Neon | RAG-powered customer support chatbot with knowledge base upload |
| [`ai-docs`](./apps/ai-docs) | 3002 | Next.js · Tailwind · OpenAI · Pinecone · Neon · Vercel Blob | PDF invoice extraction + hybrid semantic/numeric search |
| [`saas-starter`](./apps/saas-starter) | 3003 | Next.js · MUI · NextAuth · Stripe · Neon | Multi-tenant SaaS starter with auth, RBAC, billing, dashboard |

## Shared packages

| Package | Purpose |
|---|---|
| [`@repo/config`](./packages/config) | Single source of truth for the `APPS` catalog the landing page renders |
| [`@repo/ui`](./packages/ui) | Shared MUI components (`DemoCard`) consumed by `landing` |
| [`@repo/lib`](./packages/lib) | Tiny utility helpers (`cx`, `absoluteUrl`) |

Each consuming app declares them in `transpilePackages` in its `next.config.ts`,
so there's no separate build step.

## Quick start

```bash
# 1. Install everything (single hoisted node_modules at root)
npm install

# 2. Configure secrets: copy and fill in
cp .env.example .env.local

# 3. Run any single app
npm run dev --workspace=landing       # http://localhost:3000
npm run dev --workspace=ai-chatbot    # http://localhost:3001
npm run dev --workspace=ai-docs       # http://localhost:3002
npm run dev --workspace=saas-starter  # http://localhost:3003

# Or run all four concurrently
npm run dev
```

## Env strategy: one `.env.local`, symlinked

The root `.env.local` is the **single source of truth** for every app. Each app's
`apps/<app>/.env.local` is a symlink to it:

```
upwork-demos/.env.local                ← real file (gitignored)
   ↑
   ├── apps/landing/.env.local         → ../../.env.local
   ├── apps/ai-chatbot/.env.local      → ../../.env.local
   ├── apps/ai-docs/.env.local         → ../../.env.local
   └── apps/saas-starter/.env.local    → ../../.env.local
```

Next.js reads `.env.local` from each app's directory as usual; the symlink resolves
transparently. Edit one file, all apps see the change.

See [`.env.example`](./.env.example) for the full list of supported variables.

### Required variables by app

- **`ai-chatbot`, `ai-docs`**: `OPENAI_API_KEY`, `DATABASE_URL`, `PINECONE_API_KEY`,
  `PINECONE_INDEX_NAME`, `BLOB_READ_WRITE_TOKEN`
- **`saas-starter`**: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`,
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_PRO`
- **`landing`**: none required for local dev; in production set
  `NEXT_PUBLIC_AI_CHATBOT_URL`, `NEXT_PUBLIC_AI_DOCS_URL`, `NEXT_PUBLIC_SAAS_STARTER_URL`
  to point demo cards at their deployed URLs

## Architecture

```
┌─────────┐    ┌─────────┐    ┌──────────┐    ┌────────────────┐    ┌─────────────┐
│ Vercel  │───▶│ OpenAI  │───▶│ Pinecone │───▶│ Neon Postgres  │───▶│ Vercel Blob │
└─────────┘    └─────────┘    └──────────┘    └────────────────┘    └─────────────┘
 serverless     GPT-4o +       vector          serverless SQL        object
 edge           embeddings     search                                 storage
```

All four apps share this stack. Auth uses NextAuth (Auth.js v5); billing uses Stripe
Checkout + customer portal.

## Repo layout

```
upwork-demos/
├── apps/
│   ├── landing/            ← commercial homepage (port 3000)
│   ├── ai-chatbot/         ← RAG chatbot (port 3001)
│   ├── ai-docs/            ← PDF processing (port 3002)
│   └── saas-starter/       ← multi-tenant SaaS (port 3003)
├── packages/
│   ├── config/             ← @repo/config: APPS catalog
│   ├── ui/                 ← @repo/ui:     shared MUI components
│   └── lib/                ← @repo/lib:    utility helpers
├── .env.local              ← single source of truth (gitignored)
├── .env.example            ← documents required env vars
├── package.json            ← npm workspaces + turbo scripts
├── turbo.json              ← pipeline config
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

1. Create a Vercel project per app
2. Set the **Root Directory** to `apps/<app-name>`
3. Vercel auto-detects Next.js and the workspace via `npm install` at the repo root
4. Add the env vars from `.env.example` in the project settings
5. After all four are deployed, set the `NEXT_PUBLIC_*_URL` vars on the **landing**
   project so demo cards point at the live URLs

`apps/ai-docs/vercel.json` and `apps/saas-starter/vercel.json` configure per-route
function `maxDuration` for long-running AI/Stripe operations.

## License

[MIT](./LICENSE) © Theuy Limpanont
