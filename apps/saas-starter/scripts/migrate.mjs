import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set. Add it to .env.local.");
  process.exit(1);
}

const sql = await readFile(join(here, "..", "db", "schema.sql"), "utf8");
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("sslmode=") ? undefined : { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(sql);
  console.log("✓ migrations applied");
} finally {
  await client.end();
}
