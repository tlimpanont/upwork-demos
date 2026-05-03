import Stripe from "stripe";

declare global {
  var __stripe: Stripe | undefined;
}

function createStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
}

export const stripe: Stripe = global.__stripe ?? createStripe();
if (process.env.NODE_ENV !== "production") global.__stripe = stripe;
