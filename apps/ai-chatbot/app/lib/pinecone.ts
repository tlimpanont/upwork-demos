import { Pinecone } from "@pinecone-database/pinecone";

let _client: Pinecone | null = null;

function getClient(): Pinecone {
  if (!_client) {
    if (!process.env.PINECONE_API_KEY) throw new Error("PINECONE_API_KEY is not set");
    _client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return _client;
}

export function getPinecone() {
  return getClient();
}

export function getPineconeIndex() {
  const indexName = process.env.PINECONE_INDEX_NAME;
  if (!indexName) throw new Error("PINECONE_INDEX_NAME is not set");
  return getClient().index(indexName);
}