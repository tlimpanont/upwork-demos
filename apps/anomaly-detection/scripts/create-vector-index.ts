import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";

// Creates the Atlas Vector Search index on the `embeddings` collection.
// Atlas Search indexes are managed via the search-index admin API and require
// the cluster to be running on Atlas (M0 free-tier works). The driver method
// is idempotent: re-running won't error if the index already exists.

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }
  const dbName = process.env.MONGODB_DB ?? "anomaly_detection";

  const indexPath = resolve(__dirname, "../db/atlas-vector-index.json");
  const raw = await readFile(indexPath, "utf-8");
  const definition = JSON.parse(raw) as {
    name: string;
    type: "vectorSearch";
    definition: Record<string, unknown>;
  };

  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const collection = client.db(dbName).collection("embeddings");
    await collection.createIndex({ projectId: 1, label: 1 });

    const existing = await collection.listSearchIndexes().toArray();
    const already = existing.find((i) => i.name === definition.name);
    if (already) {
      console.log(`[vector-index] '${definition.name}' already exists`);
      return;
    }
    await collection.createSearchIndex(definition);
    console.log(`[vector-index] created '${definition.name}'`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
