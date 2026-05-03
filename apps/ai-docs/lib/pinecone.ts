import { Pinecone, type PineconeRecord } from "@pinecone-database/pinecone";

// Index must be 1024 dims — matches text-embedding-3-small with dimensions: 1024
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

export function getIndex() {
  return pinecone.index(process.env.PINECONE_INDEX_NAME!);
}

export type ChunkMetadata = {
  document_id: string;
  filename: string;
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  chunk_index: number;
  [key: string]: string | boolean | number | string[];
};

export async function upsertDocumentVectors(
  vectors: PineconeRecord<ChunkMetadata>[]
) {
  const index = getIndex();
  await index.upsert({ records: vectors });
}

export async function deleteDocumentVectors(documentId: string) {
  const index = getIndex();
  await index.deleteMany({ filter: { document_id: documentId } });
}
