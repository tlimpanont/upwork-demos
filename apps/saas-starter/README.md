# Multi-Tenant SaaS Starter

Production-ready foundation for a multi-tenant SaaS: authentication, organizations, role-based access, Stripe billing, and an admin dashboard. Fully serverless and deploys to Vercel.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript strict)
- **MUI v9** (Material UI) + Emotion + `@mui/material-nextjs` for SSR cache
- **Auth.js v5** (NextAuth) with credentials provider + JWT sessions, edge-compatible middleware
- **Neon Postgres** via `pg`
- **Stripe** for Checkout, Customer Portal, signature-verified webhooks
- **Zod** for boundary validation

## Features

- Email/password auth with bcrypt hashing and route-protecting proxy
- Multi-tenant by design: every server query is scoped by an active-organization context (cookie + membership validation on every request)
- Role-based access control: `admin` / `member`, with permission helpers (`can(role, permission)`)
- Workspace switcher in the topbar; users can belong to many organizations
- Member invites, role changes, removal, with a "last admin" guard so a workspace can never become admin-less
- Stripe-billed subscriptions per workspace: Checkout, Customer Portal, webhook-driven status updates
- "Sync from Stripe" recovery button (pulls truth from Stripe when a webhook was missed)
- Duplicate-subscription guard: checks Stripe (not the local DB) before creating a Checkout session
- Settings for display name, password change, workspace rename, and danger-zone workspace deletion (cancels Stripe sub, cascades all org data)

## Project structure

```
app/
  (actions)/                  Server actions, grouped by domain
  api/
    auth/[...nextauth]/       NextAuth handler
    billing/checkout/         POST → Stripe Checkout URL
    billing/portal/           POST → Stripe Customer Portal URL
    billing/sync/             POST → reconcile DB from Stripe
    organizations/            GET / POST workspace CRUD
    webhooks/stripe/          Signature-verified webhook
  dashboard/
    billing/                  Plan card, sync, status-aware UI
    organizations/            List + create workspace
    settings/{profile,workspace}/
    users/                    Members + invites + admin actions
  login/, signup/             Auth shells with server actions
components/
  auth/AuthShell.tsx          Centered card layout for auth pages
  layout/                     DashboardLayout, Sidebar, Topbar, TenantSwitcher
  ui/                         DataTable, FormField (reusable MUI primitives)
db/schema.sql                 Postgres schema (idempotent)
lib/
  active-organization.ts      Per-request tenant context (cookie + membership check)
  api.ts                      Boundary helpers: requireUser, requireTenant, parseJson
  auth.config.ts              Edge-safe NextAuth config (no Node modules)
  auth.ts                     Full config: credentials provider + bcrypt
  db.ts                       Postgres pool (HMR-safe singleton)
  permissions.ts              Role / Permission / can()
  stripe.ts                   Stripe client (HMR-safe singleton)
proxy.ts                      Next.js 16 middleware that protects /dashboard/*
scripts/migrate.mjs           DB migration runner (npm run db:migrate)
services/                     billing-service, tenant-service, user-service
```

## Quick start

### 1. Install

```bash
git clone <this-repo> && cd <this-repo>
npm install
```

### 2. Provision dependencies

- **Neon Postgres**: create a project at https://console.neon.tech and copy the connection string.
- **Stripe**: create a Pro Product with a recurring Price at https://dashboard.stripe.com/test/products. Copy the `sk_test_...` from https://dashboard.stripe.com/test/apikeys and the `price_...` ID.
- **Stripe CLI**: `brew install stripe/stripe-cli/stripe && stripe login` (only needed for local webhook testing).

### 3. Environment

```bash
cp .env.example .env.local
```

Fill in:

```dotenv
DATABASE_URL=postgres://user:password@host/db?sslmode=require
AUTH_SECRET=                                  # openssl rand -base64 32
AUTH_URL=http://localhost:3000

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=                        # from `stripe listen` output
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_...
```

### 4. Migrate the database

```bash
npm run db:migrate
```

The schema is idempotent (`create extension if not exists`, `create table if not exists`, etc.). Re-run any time.

### 5. Run

```bash
npm run dev
# in a second terminal, for billing:
npm run stripe-listen
```

The CLI prints `Your webhook signing secret is whsec_...`. Paste that into `STRIPE_WEBHOOK_SECRET` in `.env.local`, then restart `npm run dev`.

Open http://localhost:3000.

## Demo flow

1. **`/signup`**: name + email + password auto-creates `<your name>'s workspace` and signs you in.
2. **Topbar workspace switcher**: create a second workspace; flip between them.
3. **`/dashboard/users`**: invite a teammate (email + role), see them in the pending invitations table; revoke if needed. Promote/demote/remove via the row menu.
4. **`/dashboard/billing`**: click **Subscribe to Pro** → Stripe Checkout (test card `4242 4242 4242 4242`, any future expiry, any CVC) → returns to billing page. Webhook flips the chip to **Active**.
5. **Manage subscription**: opens Stripe's Customer Portal. Cancel at period end; the webhook flips the chip to **Canceling** with a "Cancels on" date.
6. **`/dashboard/settings`**: update your display name, change password, rename the workspace, or delete it (admin-only, cancels the Stripe sub on the way out).

## Architecture notes

**Multi-tenant isolation.** Every tenant-scoped server query takes `organizationId` from `requireTenantContext()`, which derives it from a signed HTTP-only cookie *and* validates the user is actually a member on every request. Org IDs are never accepted from the client.

**Edge-safe middleware split.** Auth.js v5 middleware runs in the Edge runtime where `pg` and `bcrypt` aren't available. `lib/auth.config.ts` is the edge-safe shared config (used by `proxy.ts`); `lib/auth.ts` extends it with the credentials provider and Postgres lookup. Same callbacks, same JWT, two execution environments.

**Stripe is the source of truth.** The duplicate-subscription guard, the "Sync from Stripe" button, and the webhook handler all derive state by asking Stripe, never the local DB. Webhooks can be dropped (especially in dev when `stripe listen` isn't running); the recovery paths assume that and reconcile from Stripe.

**Last-admin guard.** `changeMemberRole` and `removeMember` open a transaction, count current admins, and refuse the operation if it would leave the workspace admin-less. Means an admin can't lock themselves out by demoting themselves when they're the only one.

## Deploying to Vercel

1. Push the repo to GitHub.
2. Import the project at https://vercel.com/new. Vercel detects Next.js and configures the build.
3. **Environment variables**: add everything from `.env.local` to Vercel's project settings, with two changes for production:
   - `AUTH_URL` → your Vercel domain (e.g. `https://acme.vercel.app`)
   - `STRIPE_WEBHOOK_SECRET` → the **production** secret from the Stripe Dashboard (see step 5)
4. **Migrate the production database** locally:
   ```bash
   DATABASE_URL=<your prod connection string> npm run db:migrate
   ```
5. **Register the production webhook** at https://dashboard.stripe.com/test/webhooks (or live mode):
   - Endpoint URL: `https://<your-domain>/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
   - Reveal the signing secret and add it to Vercel as `STRIPE_WEBHOOK_SECRET`.
6. Redeploy.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with HMR |
| `npm run build` | Production build (TypeScript + bundling) |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply `db/schema.sql` to `DATABASE_URL` (idempotent) |
| `npm run stripe-listen` | Forward Stripe webhooks to localhost for development |

## License

[MIT](./LICENSE)
