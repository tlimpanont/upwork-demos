import { getPineconeIndex } from "@/app/lib/pinecone";
import { sql } from "@/app/lib/db";
import { generateEmbeddings, generateEmbedding } from "@/app/lib/embeddings";

export interface DocumentChunk {
  id: string;
  source: string;
  content: string;
  similarity: number;
}

export async function storeChunks(source: string, chunks: string[]): Promise<void> {
  const embeddings = await generateEmbeddings(chunks);
  const index = getPineconeIndex();

  const vectors = chunks.map((content, i) => ({
    id: `${source}__${i}`,
    values: embeddings[i],
    metadata: { source, content, chunk_index: i },
  }));

  // Pinecone recommends batches of 100
  for (let i = 0; i < vectors.length; i += 100) {
    await index.upsert({ records: vectors.slice(i, i + 100) });
  }

  await sql`
    INSERT INTO document_sources (source, chunk_count)
    VALUES (${source}, ${chunks.length})
    ON CONFLICT (source) DO UPDATE SET chunk_count = ${chunks.length}, created_at = now()
  `;
}

export async function retrieveRelevant(query: string, topK = 5): Promise<DocumentChunk[]> {
  const embedding = await generateEmbedding(query);
  const index = getPineconeIndex();

  const results = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });

  return results.matches.map((match) => ({
    id: match.id,
    source: (match.metadata?.source ?? "") as string,
    content: (match.metadata?.content ?? "") as string,
    similarity: match.score ?? 0,
  }));
}

export async function listSources(): Promise<{ source: string; count: number }[]> {
  const rows = await sql`
    SELECT source, chunk_count AS count
    FROM document_sources
    ORDER BY created_at DESC
  `;
  return rows.map((r) => ({ source: r.source as string, count: Number(r.count) }));
}

export async function deleteSource(source: string): Promise<void> {
  const index = getPineconeIndex();

  // Reconstruct IDs from stored chunk count and delete them from Pinecone
  const rows = await sql`SELECT chunk_count FROM document_sources WHERE source = ${source}`;
  const count = Number(rows[0]?.chunk_count ?? 0);

  if (count > 0) {
    const ids = Array.from({ length: count }, (_, i) => `${source}__${i}`);
    await index.deleteMany({ ids });
  }

  await sql`DELETE FROM document_sources WHERE source = ${source}`;
}