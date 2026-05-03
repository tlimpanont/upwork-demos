import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { syncSubscriptionFromStripe } from "@/services/billing-service";

// Stripe needs the raw body to verify signatures. Pin to Node runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook/stripe] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Misconfigured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      secret,
    );
  } catch (err) {
    console.warn("[webhook/stripe] signature check failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription,
          );
          await syncSubscriptionFromStripe(subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscriptionFromStripe(
          event.data.object as Stripe.Subscription,
        );
        break;
      }
      default:
        // Ignore everything else; we can add cases later as needed.
        break;
    }
  } catch (err) {
    console.error("[webhook/stripe] handler error", event.type, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
