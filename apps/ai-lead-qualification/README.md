# AI Lead Qualification & CRM Automation

A polished SaaS MVP that demonstrates an end-to-end inbound pipeline:

1. **Capture** — public form collects lead details and inquiry text.
2. **Qualify** — OpenAI scores fit, urgency, and budget; assigns a Hot/Warm/Cold tier; produces a 2-sentence summary, recommended action, and tags.
3. **Route** — qualified leads are fanned out to mock HubSpot, Salesforce, Slack, and email integrations under deterministic policies (Hot fans out everywhere; Warm hits CRM + nurture; Cold gets self-serve).
4. **Surface** — a dashboard renders KPIs, charts, a filterable leads table, lead-detail timelines, automation logs, and AI-generated insights.

The whole flow runs in under five seconds end-to-end, and **works without an OpenAI API key** — the qualifier falls back to a deterministic heuristic stub so the demo stays interactive.

---

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** primitives (Radix under the hood)
- **Prisma** + **SQLite** for zero-config persistence
- **OpenAI** (`gpt-4o-mini`) for qualification and insights
- **Recharts** for dashboard visualizations
- **React Hook Form** + **Zod** for the public form

## Running locally

From the monorepo root:

```bash
npm install
```

Then in `apps/ai-lead-qualification`:

```bash
# Create a .env.local with at least DATABASE_URL=file:./dev.db
cp .env.example .env.local

# Provision the SQLite DB and seed 30 demo leads
npm run db:push
npm run db:seed

# Boot the app on http://localhost:3006
npm run dev
```

Pages of interest:

| URL | What it is |
| --- | --- |
| `/` | Landing page (hero, features, dashboard preview, CTA) |
| `/submit` | Public lead capture form — runs the full pipeline on submit |
| `/dashboard` | KPIs, leads-over-time, score distribution, qualification mix |
| `/leads` | Filterable, sortable, searchable leads table |
| `/leads/[id]` | Full lead detail: AI analysis, inquiry, timeline, notes |
| `/insights` | AI-generated narrative + tag/service/industry analytics |
| `/automations` | Per-integration delivery stats and recent automation log |
| `/integrations` | Cards for HubSpot, Salesforce, Slack, email, custom webhook |
| `/settings` | Profile, API keys, qualifier model config (visual) |
| `/login`, `/register`, `/forgot-password` | Stubbed auth — any submit routes to `/dashboard` |

## Architecture

```
app/                              Next.js App Router
  (auth)/                         Stubbed auth pages (route group)
  (dashboard)/                    Protected-feel dashboard layout
    dashboard/                    KPIs + charts overview
    leads/                        Table + per-lead detail with notes/status
    automations/                  Integration delivery stats + log
    integrations/                 Connect/configure cards
    insights/                     AI-narrated pipeline analysis
    settings/                     Workspace + qualifier settings
  submit/                         Public lead capture page + server action

components/
  ui/                             shadcn/ui primitives (button, card, table, …)
  dashboard/                      Sidebar, topbar, KPI card
  charts/                         Recharts wrappers (score, time, mix)
  forms/                          Lead form + auth form
  leads/                          Table, badges, status select, notes

lib/
  ai/qualify.ts                   OpenAI qualifier + deterministic stub fallback
  ai/insights.ts                  Insights narration + stub fallback
  crm/                            Mock HubSpot / Salesforce / Slack / Email adapters
    dispatch.ts                   Fan-out engine: per-integration policy + log
  db/                             Prisma client + read-side hydration helpers
    analytics.ts                  KPI / chart aggregations
    insights.ts                   Tag/service/industry roll-ups
  forms/lead-schema.ts            Zod schema for the public form
  pipeline.ts                     Orchestrator: ingest → qualify → dispatch → save
  utils/cn.ts                     Tailwind class merger

prisma/schema.prisma              SQLite Lead model (JSON-encoded arrays)
scripts/seed.ts                   30 hand-crafted leads across SaaS/agency/enterprise
```

### The boundary that matters

`lib/pipeline.ts → ingestLead()` is the single ingest entry point. Both the public form's server action and (if you add one) any REST/webhook endpoint call this same function. That keeps qualification + dispatch identical across every channel a lead can come from.

The qualifier is split between `lib/ai/qualify.ts` (OpenAI + Zod-validated parsing) and a **deterministic stub** in the same file. If `OPENAI_API_KEY` isn't set or the call fails, the stub takes over — heuristic over budget/size/urgency keywords — so the rest of the pipeline always has a valid `Qualification` object to dispatch on.

### Mock CRM integrations

Each integration in `lib/crm/` exports an `Integration` object with `shouldFire(qualification)` and `deliver({ lead, qualification })`. The dispatcher in `dispatch.ts` walks the list, records `delivered` / `skipped` / `failed` for every step, and returns an `IntegrationLogEntry[]` that gets persisted on the lead.

Real integrations would replace the body of `deliver()` with actual API calls. The contract — the entry it returns — would not change, so dashboards keep working.

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | SQLite by default: `file:./dev.db`. Swap for Postgres in production. |
| `OPENAI_API_KEY` | Optional | Without it, qualification + insights run from the deterministic stub. |

## Notes

- **Auth** is intentionally stubbed for the demo — `/login` accepts any input and routes to `/dashboard`. Wiring real NextAuth is a one-day job and out of scope here.
- **SQLite** stores `services`, `aiTags`, `integrationLog`, and `notes` as JSON-encoded strings. `lib/db/lead.ts:hydrateLead` is the single boundary that parses them; every read path goes through it.
- The qualifier is intentionally model-agnostic — only the parsing layer in `qualify.ts` knows the shape. Swap models in `settings` (visual) or directly in code.
