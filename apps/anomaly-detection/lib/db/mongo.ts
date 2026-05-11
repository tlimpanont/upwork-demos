import { MongoClient, type Db } from "mongodb";

// HMR-safe singleton: in dev, hot reloads would otherwise create a new client
// per request and exhaust the Atlas connection pool. We pin the client onto
// `globalThis` so Next.js dev-time recompiles reuse the same connection.

declare global {
  var __mongoClient: MongoClient | undefined;
}

function client(): MongoClient {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }
  if (!globalThis.__mongoClient) {
    globalThis.__mongoClient = new MongoClient(process.env.MONGODB_URI, {
      // Serverless-friendly pool: keep small, don't pin idle sockets.
      maxPoolSize: 5,
      minPoolSize: 0,
      // Fail fast instead of waiting the default 30s when Atlas is slow
      // to respond — the user gets an error in seconds instead of a
      // spinning login button that times out at the route level.
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000,
      // Compress the wire protocol so the auth-time round trips are
      // smaller. zstd is supported by Atlas and saves measurable bytes
      // on the first handshake when the function is cold.
      compressors: ["zstd"],
      retryWrites: true,
    });
  }
  return globalThis.__mongoClient;
}

export async function db(): Promise<Db> {
  const c = client();
  // The driver is lazy; first call connects.
  await c.connect();
  return c.db(process.env.MONGODB_DB ?? "anomaly_detection");
}
