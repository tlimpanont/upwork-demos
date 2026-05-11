// Deterministic, UTC-based formatters. Server and client render the exact
// same string, so they're safe to drop into client components without
// tripping a hydration mismatch.

export function formatDateUTC(input: Date | string): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateTimeUTC(input: Date | string): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${formatDateUTC(d)} ${hh}:${mi} UTC`;
}

// Compact thumbnail-friendly format: "May 1 · 09:23". Short enough to sit
// under a 48–64px thumbnail without wrapping, still readable at a glance.
// UTC-only so SSR and the browser produce the exact same string.
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
export function formatShortDateTimeUTC(input: Date | string): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const mon = MONTHS_SHORT[d.getUTCMonth()] ?? "";
  const day = d.getUTCDate();
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${mon} ${day} · ${hh}:${mi}`;
}
