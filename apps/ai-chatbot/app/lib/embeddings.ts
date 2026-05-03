import { getPinecone } from "@/app/lib/pinecone";

const MODEL = "llama-text-embed-v2";

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await getPinecone().inference.embed({
    model: MODEL,
    inputs: [text],
    parameters: { inputType: "query" },
  });
  const embedding = result.data[0];
  if (embedding.vectorType !== "dense") throw new Error("Expected dense embedding");
  return embedding.values;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const result = await getPinecone().inference.embed({
    model: MODEL,
    inputs: texts,
    parameters: { inputType: "passage" },
  });
  return result.data.map((e) => {
    if (e.vectorType !== "dense") throw new Error("Expected dense embedding");
    return e.values;
  });
}