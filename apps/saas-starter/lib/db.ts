import { Pool, type PoolConfig } from "pg";

declare global {
  var __pgPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const config: PoolConfig = {
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    ssl: connectionString.includes("sslmode=") ? undefined : { rejectUnauthorized: false },
  };
  return new Pool(config);
}

export const pool: Pool = global.__pgPool ?? createPool();
if (process.env.NODE_ENV !== "production") global.__pgPool = pool;

export async function query<T = unknown>(
  text: string,
  params?: ReadonlyArray<unknown>,
): Promise<{ rows: T[]; rowCount: number }> {
  const res = await pool.query(text, params as unknown[] | undefined);
  return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
}
