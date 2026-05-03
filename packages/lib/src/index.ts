export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function absoluteUrl(path: string, base?: string): string {
  const root =
    base ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window === "undefined" ? "http://localhost:3000" : window.location.origin);
  return new URL(path, root).toString();
}
