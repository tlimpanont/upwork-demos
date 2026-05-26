import { APPS, type DemoApp } from "@repo/config";

// Cookie set after a visitor submits the demo gate form. Presence (any
// value) means "already qualified"; we don't store anything sensitive,
// just enough to skip the form on subsequent demo opens. 30 days mirrors
// a reasonable B2B sales-touch window.
export const DEMO_GATE_COOKIE = "demo_gate_passed";
export const DEMO_GATE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const PROD_HOST = (id: string) => `https://upwork-demos-${id}.theuy.nl`;
const DEV_HOST = (port: number) => `http://localhost:${port}`;

export function findDemoById(id: string): DemoApp | undefined {
  return APPS.find((app) => app.id === id);
}

// Mirrors the redirect targets that previously lived in next.config.ts.
// Kept in sync intentionally; if the prod URL pattern changes, update
// both places.
export function demoDestinationUrl(app: DemoApp): string {
  const isProd = process.env.NODE_ENV === "production";
  return isProd ? PROD_HOST(app.id) : DEV_HOST(app.devPort);
}

// Validate a return_to URL handed to the gate page (?return_to=…) or to
// the server action. We only honour URLs that point at this exact demo's
// origin — otherwise the gate could be used as an open redirect into any
// site. Returns the normalised URL string, or null if rejected.
export function normaliseReturnTo(app: DemoApp, raw: string | null | undefined): string | null {
  if (!raw) return null;
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return null;
  }
  const allowed = new URL(demoDestinationUrl(app));
  if (target.origin !== allowed.origin) return null;
  return target.toString();
}

// Cookie attributes for the gate-passed cookie. In production we set
// Domain=.theuy.nl (configurable via DEMO_GATE_COOKIE_DOMAIN) so that
// each demo subdomain's middleware can read the cookie and decide
// whether to enforce the gate. In dev we leave Domain undefined — the
// cookie becomes host-only on localhost, which browsers happily share
// across ports, covering landing:3000 → demo:3001-3007.
export function demoGateCookieAttributes() {
  const isProd = process.env.NODE_ENV === "production";
  const domain = process.env.DEMO_GATE_COOKIE_DOMAIN
    || (isProd ? ".theuy.nl" : undefined);
  return {
    name: DEMO_GATE_COOKIE,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: DEMO_GATE_COOKIE_MAX_AGE_SECONDS,
    ...(domain ? { domain } : {}),
  };
}