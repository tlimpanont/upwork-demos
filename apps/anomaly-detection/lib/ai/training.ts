import type { Embedding, Model } from "@/lib/db/schemas";

// Cosine distance over L2-normalized vectors equals 1 - dot product.
// We use distance (not similarity) throughout so larger = more anomalous.
export function cosineDistance(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  if (denom === 0) return 1;
  return 1 - dot / denom;
}

export function meanVector(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;
  const out = new Array<number>(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) out[i] += v[i];
  }
  for (let i = 0; i < dim; i++) out[i] /= vectors.length;
  return out;
}

export type Split = {
  train: Embedding[];
  validation: Embedding[];
  test: Embedding[];
};

// Sequence-aware split: every embedding from one sequence stays in one
// partition. Ratios are train 0.6 / val 0.2 / test 0.2 by sequence count,
// rounded so the train split always has ≥1 sequence.
export function splitBySequence(embeddings: Embedding[]): Split {
  const bySeq = new Map<string, Embedding[]>();
  for (const e of embeddings) {
    // The vector store carries imageId; we re-derive sequenceId by joining
    // upstream of this function (callers pass sequenceId on Embedding via
    // Mongo-side projection — see route handler).
    const key = (e as Embedding & { sequenceId?: string }).sequenceId ?? e.imageId;
    const list = bySeq.get(key) ?? [];
    list.push(e);
    bySeq.set(key, list);
  }
  const sequenceIds = [...bySeq.keys()].sort();
  const trainCount = Math.max(1, Math.floor(sequenceIds.length * 0.6));
  const valCount = Math.max(0, Math.floor(sequenceIds.length * 0.2));
  const trainSet = new Set(sequenceIds.slice(0, trainCount));
  const valSet = new Set(
    sequenceIds.slice(trainCount, trainCount + valCount),
  );

  const split: Split = { train: [], validation: [], test: [] };
  for (const [seq, list] of bySeq) {
    if (trainSet.has(seq)) split.train.push(...list);
    else if (valSet.has(seq)) split.validation.push(...list);
    else split.test.push(...list);
  }
  return split;
}

export function computeCentroidAndThreshold(
  trainNormals: Embedding[],
): { centroid: number[]; threshold: number; sigma: number } | null {
  if (trainNormals.length === 0) return null;
  const centroid = meanVector(trainNormals.map((e) => e.vector));
  const dists = trainNormals.map((e) => cosineDistance(centroid, e.vector));
  const mean = dists.reduce((a, b) => a + b, 0) / dists.length;
  const variance =
    dists.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, dists.length);
  const sigma = Math.sqrt(variance);
  // Mean + 2σ catches ~97.5% of normals as normal under a Gaussian
  // distance assumption. Floor at a small positive value so a perfectly
  // homogeneous training set doesn't yield a 0 threshold.
  const threshold = Math.max(0.05, mean + 2 * sigma);
  return { centroid, threshold, sigma };
}

export type EvalMetrics = Model["metrics"];

export function evaluate(
  centroid: number[],
  threshold: number,
  testEmbeddings: Embedding[],
): EvalMetrics {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  for (const e of testEmbeddings) {
    const distance = cosineDistance(centroid, e.vector);
    const predicted = distance >= threshold ? "anomaly" : "normal";
    if (predicted === "anomaly" && e.label === "anomaly") tp++;
    else if (predicted === "anomaly" && e.label === "normal") fp++;
    else if (predicted === "normal" && e.label === "anomaly") fn++;
  }
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 =
    precision + recall === 0
      ? 0
      : (2 * precision * recall) / (precision + recall);
  return {
    precision,
    recall,
    f1,
    sampleCount: testEmbeddings.length,
  };
}
