/**
 * Run once to set up (or migrate) the Neon database.
 * Drops the old pgvector documents table and creates the lightweight
 * document_sources table used by the Pinecone-backed vector store.
 * Usage: npx tsx scripts/setup-db.ts
 */
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // Remove old pgvector table if it exists
  await sql`DROP TABLE IF EXISTS documents`;

  await sql`
    CREATE TABLE IF NOT EXISTS document_sources (
      source      TEXT PRIMARY KEY,
      chunk_count INT NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT now()
    )
  `;

  console.log("✓ Database ready");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});