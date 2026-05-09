import { neon } from "@neondatabase/serverless";
import type { NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

// Convenience tagged-template helper that lazily resolves the connection on first use.
// The Proxy target must be a function for the `apply` trap to fire.
export const sql: NeonQueryFunction<false, false> = new Proxy(
  function () {} as unknown as NeonQueryFunction<false, false>,
  {
    apply(_target, _thisArg, args) {
      return (getDb() as (...a: unknown[]) => unknown)(...args);
    },
    get(_target, prop) {
      return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
    },
  }
);
