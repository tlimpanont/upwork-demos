import type Stripe from "stripe";
import { query } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export class AlreadySubscribedError extends Error {
  readonly code = "ALREADY_SUBSCRIBED";
  constructor() {
    super("Workspace already has an active subscription");
    this.name = "AlreadySubscribedError";
  }
}

const LIVE_STATUSES: ReadonlySet<Stripe.Subscription.Status> = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
]);

export type SubscriptionRow = {
  organization_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status:
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "unpaid"
    | "paused"
    | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export async function getSubscriptionForOrganization(
  organizationId: string,
): Promise<SubscriptionRow | null> {
  const { rows } = await query<SubscriptionRow>(
    `select organization_id, stripe_customer_id, stripe_subscription_id,
            stripe_price_id, status, current_period_end, cancel_at_period_end
     from subscriptions where organization_id = $1`,
    [organizationId],
  );
  return rows[0] ?? null;
}

async function ensureCustomer(input: {
  organizationId: string;
  organizationName: string;
  userEmail: string;
}): Promise<string> {
  const sub = await getSubscriptionForOrganization(input.organizationId);
  if (sub?.stripe_customer_id) return sub.stripe_customer_id;

  const customer = await stripe.customers.create({
    name: input.organizationName,
    email: input.userEmail,
    metadata: { organization_id: input.organizationId },
  });

  await query(
    `insert into subscriptions (organization_id, stripe_customer_id)
     values ($1, $2)
     on conflict (organization_id)
       do update set stripe_customer_id = excluded.stripe_customer_id,
                     updated_at = now()`,
    [input.organizationId, customer.id],
  );
  return customer.id;
}

export async function createCheckoutSession(input: {
  organizationId: string;
  organizationName: string;
  userEmail: string;
  priceId: string;
  origin: string;
}): Promise<{ url: string }> {
  const customerId = await ensureCustomer({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    userEmail: input.userEmail,
  });

  // Guard: ask Stripe (the source of truth) whether the customer already has
  // a live subscription. The local DB row can be stale if a webhook was
  // dropped, so we never trust it for this check.
  const existing = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });
  if (existing.data.some((s) => LIVE_STATUSES.has(s.status))) {
    throw new AlreadySubscribedError();
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: `${input.origin}/dashboard/billing?status=success`,
    cancel_url: `${input.origin}/dashboard/billing?status=canceled`,
    client_reference_id: input.organizationId,
    subscription_data: {
      metadata: { organization_id: input.organizationId },
    },
    allow_promotion_codes: true,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { url: session.url };
}

export async function createBillingPortalSession(input: {
  organizationId: string;
  origin: string;
}): Promise<{ url: string } | null> {
  const sub = await getSubscriptionForOrganization(input.organizationId);
  if (!sub?.stripe_customer_id) return null;
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${input.origin}/dashboard/billing`,
  });
  return { url: session.url };
}

/**
 * Pull the latest state from Stripe and rewrite the DB row. Useful as a
 * recovery path when a webhook wasn't delivered (e.g. local dev with
 * `stripe listen` not running). Returns the updated row, or null if no
 * subscription state exists for this org on Stripe at all.
 */
export async function resyncFromStripe(
  organizationId: string,
): Promise<SubscriptionRow | null> {
  const existing = await getSubscriptionForOrganization(organizationId);
  if (!existing?.stripe_customer_id) {
    console.warn(
      "[billing/resync] no stripe_customer_id for org",
      organizationId,
    );
    return null;
  }

  // Always scan all subscriptions on the customer; never trust the pinned ID,
  // which can be stale (e.g. webhook for an early sub never delivered).
  const list = await stripe.subscriptions.list({
    customer: existing.stripe_customer_id,
    status: "all",
    limit: 50,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[billing/resync] org=${organizationId} customer=${existing.stripe_customer_id} found ${list.data.length} subs:`,
      list.data.map((s) => ({
        id: s.id,
        status: s.status,
        cancel_at_period_end: s.cancel_at_period_end,
        cancel_at: s.cancel_at
          ? new Date(s.cancel_at * 1000).toISOString()
          : null,
        created: new Date(s.created * 1000).toISOString(),
      })),
    );
  }

  const sorted = [...list.data].sort((a, b) => b.created - a.created);
  // Prefer the newest "live" sub. A sub with cancel_at_period_end=true is still
  // live until its period ends.
  const live = sorted.find(
    (s) =>
      s.status === "active" ||
      s.status === "trialing" ||
      s.status === "past_due" ||
      s.status === "unpaid" ||
      s.status === "paused",
  );
  let subscription: Stripe.Subscription | null = live ?? sorted[0] ?? null;

  if (!subscription) {
    // Nothing on Stripe; flatten the local row to a "no subscription" state
    // but keep the customer ID so the next subscribe reuses it.
    await query(
      `update subscriptions
       set stripe_subscription_id = null,
           stripe_price_id = null,
           status = null,
           current_period_end = null,
           cancel_at_period_end = false,
           updated_at = now()
       where organization_id = $1`,
      [organizationId],
    );
    return getSubscriptionForOrganization(organizationId);
  }

  // Make sure the metadata link is set so future webhooks can attribute it.
  if (
    !subscription.metadata?.organization_id ||
    subscription.metadata.organization_id !== organizationId
  ) {
    try {
      subscription = await stripe.subscriptions.update(subscription.id, {
        metadata: { organization_id: organizationId },
      });
    } catch (err) {
      console.warn("[billing/resync] could not attach metadata", err);
    }
  }

  await syncSubscriptionFromStripe(subscription);
  return getSubscriptionForOrganization(organizationId);
}

/**
 * Reconcile a Stripe Subscription object into the DB. Called from the webhook on
 * `customer.subscription.*` events and from `checkout.session.completed`.
 */
export async function syncSubscriptionFromStripe(
  subscription: Stripe.Subscription,
): Promise<void> {
  const organizationId =
    (subscription.metadata?.organization_id as string | undefined) ??
    null;
  if (!organizationId) {
    // Nothing to attribute this to. Log and skip.
    console.warn(
      "[billing] subscription event missing organization_id metadata",
      subscription.id,
    );
    return;
  }

  const item = subscription.items.data[0];

  // In the modern Stripe API, `cancel_at` is the canonical "scheduled to
  // cancel" signal. `cancel_at_period_end` is a legacy boolean that's
  // unreliable in newer API versions. Treat either-or as canceling.
  const isCanceling =
    Boolean(subscription.cancel_at) || subscription.cancel_at_period_end;

  // Prefer the cancel timestamp (so the UI shows "Cancels on …"); otherwise
  // the regular renewal date.
  const periodEnd = subscription.cancel_at
    ? new Date(subscription.cancel_at * 1000)
    : typeof item?.current_period_end === "number"
      ? new Date(item.current_period_end * 1000)
      : null;

  await query(
    `insert into subscriptions (
       organization_id, stripe_customer_id, stripe_subscription_id,
       stripe_price_id, status, current_period_end, cancel_at_period_end, updated_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, now())
     on conflict (organization_id) do update set
       stripe_customer_id     = excluded.stripe_customer_id,
       stripe_subscription_id = excluded.stripe_subscription_id,
       stripe_price_id        = excluded.stripe_price_id,
       status                 = excluded.status,
       current_period_end     = excluded.current_period_end,
       cancel_at_period_end   = excluded.cancel_at_period_end,
       updated_at             = now()`,
    [
      organizationId,
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
      subscription.id,
      item?.price.id ?? null,
      subscription.status,
      periodEnd,
      isCanceling,
    ],
  );
}
