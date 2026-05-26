import { NextResponse, type NextRequest } from "next/server";

// Demo gate enforcement: redirects visitors without the
// `demo_gate_passed` cookie back to the landing site's gate page,
// preserving the original URL via ?return_to so they land on the page
// they actually wanted after passing the gate.
//
// In non-production this is bypassed by default to keep local dev
// frictionless. Set ENFORCE_DEMO_GATE=1 to exercise the gate locally.
//
// The matcher excludes Next.js internals, /api/* (so webhook receivers
// and AJAX from already-gated visitors aren't redirected), favicon /
// robots / sitemap, and any path that looks like a static asset
// (has a file extension).

const DEMO_ID = "ai-chatbot";
const DEMO_GATE_COOKIE = "demo_gate_passed";

function landingBaseUrl(): string {
  if (process.env.LANDING_URL) return process.env.LANDING_URL;
  return process.env.NODE_ENV === "production"
    ? "https://theuy.nl"
    : "http://localhost:3000";
}

export function proxy(req: NextRequest) {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.ENFORCE_DEMO_GATE !== "1"
  ) {
    return NextResponse.next();
  }

  if (req.cookies.get(DEMO_GATE_COOKIE)?.value) {
    return NextResponse.next();
  }

  const url = new URL(`/${DEMO_ID}`, landingBaseUrl());
  url.searchParams.set("return_to", req.nextUrl.toString());
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/|api/|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\..*).*)",
  ],
};
