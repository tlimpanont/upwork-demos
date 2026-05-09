// Pin locale to en-US so the same Date renders identically on the server
// and on the client — otherwise React hydration mismatches every time the
// browser locale isn't en-US (en-GB, fr-FR, etc.).

const DATETIME_FMT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const TIME_FMT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const NUMBER_FMT = new Intl.NumberFormat("en-US");

export function formatDateTime(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return DATETIME_FMT.format(dt);
}

export function formatDate(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return DATE_FMT.format(dt);
}

export function formatTime(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return TIME_FMT.format(dt);
}

export function formatNumber(n: number): string {
  return NUMBER_FMT.format(n);
}
