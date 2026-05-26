import NextAuth from "next-auth";
import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";
import { authConfig } from "@/lib/auth.config";

// Combined proxy: demo-gate lead capture (set by the landing site) plus
// the original NextAuth session enforcement.
//
//   1. Demo gate: bounces visitors without the `demo_gate_passed` cookie
//      back to the landing site's gate page, preserving the original URL
//      via ?return_to. Bypassed in non-production unless
//      ENFORCE_DEMO_GATE=1.
//   2. NextAuth: only invoked for the paths the SaaS starter actually
//      protects (dashboard + auth pages). Mirrors the previous narrow
//      matcher so we don't pay a session lookup on every page request.
//      The actual decisions (anon users on /dashboard -> /login,
//      logged-in users on /login -> /dashboard) live in
//      lib/auth.config.ts `authorized()`.

const { auth } = NextAuth(authConfig);

const DEMO_ID = "saas-starter";
const DEMO_GATE_COOKIE = "demo_gate_passed";
const AUTH_PATHS = /^\/(dashboard|login|signup)(\/|$)/;

function landingBaseUrl(): string {
  if (process.env.LANDING_URL) return process.env.LANDING_URL;
  return process.env.NODE_ENV === "production"
    ? "https://theuy.nl"
    : "http://localhost:3000";
}

function demoGateRedirect(req: NextRequest): NextResponse | null {
  const enforce =
    process.env.NODE_ENV === "production" ||
    process.env.ENFORCE_DEMO_GATE === "1";
  if (!enforce) return null;
  if (req.cookies.get(DEMO_GATE_COOKIE)?.value) return null;
  const url = new URL(`/${DEMO_ID}`, landingBaseUrl());
  url.searchParams.set("return_to", req.nextUrl.toString());
  return NextResponse.redirect(url);
}

export async function proxy(req: NextRequest, event: NextFetchEvent) {
  const gate = demoGateRedirect(req);
  if (gate) return gate;
  if (AUTH_PATHS.test(req.nextUrl.pathname)) {
    // `auth(req, event)` runs the NextAuth proxy path: session load ->
    // authorized() callback -> NextResponse. The casts bridge
    // NextRequest -> NextAuthRequest typing (auth() augments .auth
    // internally before the callback ever sees it) and disambiguate
    // the overloaded auth() signature, which TypeScript otherwise
    // resolves to the NextApiResponse pages-router form.
    const authProxy = auth as unknown as (
      req: NextRequest,
      event: NextFetchEvent,
    ) => Promise<Response>;
    return authProxy(req, event);
  }
  return NextResponse.next();
}

export const config = {
  // Broad matcher so the demo gate covers every user-facing route.
  // Excludes Next.js internals, /api/* (so webhook receivers and AJAX
  // from already-gated visitors aren't redirected), favicon / robots /
  // sitemap, and any path with a file extension.
  matcher: [
    "/((?!_next/|api/|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\..*).*)",
  ],
};
