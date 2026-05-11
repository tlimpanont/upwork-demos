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
  // "sequence" = each sequence stays in one bucket (clean, no leakage)
  // "annotation" = shuffled per-annotation 60/20/20 (used as a fallback
  //   when sequence diversity is too low to produce non-empty val/test
  //   buckets). Adjacent frames may straddle the train/test line, so the
  //   resulting metrics can be optimistic — the Train UI flags this.
  mode: "sequence" | "annotation";
};

// Below this many sequences, the sequence-aware split would leave the
// validation/test buckets empty (all sequences land in train) and metrics
// stay at 0. We fall back to a per-annotation split instead.
const MIN_SEQUENCES_FOR_SEQUENCE_SPLIT = 3;

// Sequence-aware split: every embedding from one sequence stays in one
// partition. Ratios are train 0.6 / val 0.2 / test 0.2 by sequence count.
// Falls back to a shuffled per-annotation split when the project has
// fewer than 3 sequences (so the demo still produces meaningful metrics
// for small datasets, with a leakage warning surfaced in the UI).
export function splitBySequence(embeddings: Embedding[]): Split {
  const bySeq = new Map<string, Embedding[]>();
  for (const e of embeddings) {
    const key =
      (e as Embedding & { sequenceId?: string }).sequenceId ?? e.imageId;
    const list = bySeq.get(key) ?? [];
    list.push(e);
    bySeq.set(key, list);
  }
  const sequenceIds = [...bySeq.keys()].sort();

  if (sequenceIds.length < MIN_SEQUENCES_FOR_SEQUENCE_SPLIT) {
    return splitByAnnotation(embeddings);
  }

  const trainCount = Math.max(1, Math.floor(sequenceIds.length * 0.6));
  const valCount = Math.max(0, Math.floor(sequenceIds.length * 0.2));
  const trainSet = new Set(sequenceIds.slice(0, trainCount));
  const valSet = new Set(
    sequenceIds.slice(trainCount, trainCount + valCount),
  );

  const split: Split = {
    train: [],
    validation: [],
    test: [],
    mode: "sequence",
  };
  for (const [seq, list] of bySeq) {
    if (trainSet.has(seq)) split.train.push(...list);
    else if (valSet.has(seq)) split.validation.push(...list);
    else split.test.push(...list);
  }
  return split;
}

// Deterministic shuffled 60/20/20 split over the annotations themselves.
// Used when sequence diversity is too low. Deterministic so re-running the
// same training run produces the same metrics; the seed is derived from
// the embedding ids so different projects don't all see the same order.
function splitByAnnotation(embeddings: Embedding[]): Split {
  const sorted = [...embeddings].sort((a, b) =>
    a._id.localeCompare(b._id),
  );
  // Fisher-Yates with a hash-derived seed for determinism.
  const seed = sorted.reduce(
    (acc, e) => (acc * 31 + (e._id.charCodeAt(0) | 0)) >>> 0,
    2166136261 >>> 0,
  );
  let state = seed || 1;
  const rand = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0xffffffff;
  };
  for (let i = sorted.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  }

  const n = sorted.length;
  const trainEnd = Math.max(1, Math.floor(n * 0.6));
  const valEnd = Math.max(trainEnd, Math.floor(n * 0.8));

  return {
    train: sorted.slice(0, trainEnd),
    validation: sorted.slice(trainEnd, valEnd),
    test: sorted.slice(valEnd),
    mode: "annotation",
  };
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

// Zero-shot threshold: how close (cosine distance) an image embedding has
// to be to the description embedding to count as a description match.
// Empirically tuned for text-embedding-3-small — captions of the same
// scene tend to land within 0.30–0.40 of each other.
export const DESCRIPTION_THRESHOLD = 0.35;

export type ScoredEmbedding = {
  // Cosine distance from the normal centroid. Null when there is no
  // centroid (description-only model).
  centroidDistance: number | null;
  // Cosine distance from the description embedding. Null when there is no
  // description embedding (legacy centroid-only model).
  descriptionDistance: number | null;
  // True when the embedding crosses the model's anomaly bar. For refined
  // (centroid + description) models, both signals have to agree.
  isAnomaly: boolean;
  // 0..1 score for the UI, higher = stronger anomaly call.
  confidence: number;
};

// Single decision function for every detection mode. Keeps the route
// handler from juggling three cases inline.
export function scoreEmbedding(
  model: Pick<
    Model,
    "centroid" | "threshold" | "descriptionEmbedding" | "algorithm"
  >,
  vector: number[],
): ScoredEmbedding {
  const centroidDistance = model.centroid
    ? cosineDistance(model.centroid, vector)
    : null;
  const descriptionDistance = model.descriptionEmbedding
    ? cosineDistance(model.descriptionEmbedding, vector)
    : null;

  // Description-only (zero-shot): close to description = anomaly.
  if (centroidDistance === null && descriptionDistance !== null) {
    const isAnomaly = descriptionDistance <= DESCRIPTION_THRESHOLD;
    const confidence = Math.max(
      0,
      Math.min(1, 1 - descriptionDistance / DESCRIPTION_THRESHOLD),
    );
    return { centroidDistance, descriptionDistance, isAnomaly, confidence };
  }

  // Centroid-only (legacy): far from normal = anomaly.
  if (centroidDistance !== null && descriptionDistance === null) {
    const isAnomaly = centroidDistance >= model.threshold;
    const confidence = isAnomaly
      ? Math.min(1, centroidDistance / (2 * model.threshold))
      : Math.max(0, Math.min(1, 1 - centroidDistance / model.threshold));
    return { centroidDistance, descriptionDistance, isAnomaly, confidence };
  }

  // Refined: both signals must agree. The description acts as a precision
  // filter on top of the centroid threshold — far from normal *and*
  // matching the rule.
  if (centroidDistance !== null && descriptionDistance !== null) {
    const farFromNormal = centroidDistance >= model.threshold;
    const matchesRule = descriptionDistance <= DESCRIPTION_THRESHOLD;
    const isAnomaly = farFromNormal && matchesRule;
    const centroidScore = Math.min(
      1,
      centroidDistance / (2 * model.threshold),
    );
    const descriptionScore = Math.max(
      0,
      1 - descriptionDistance / DESCRIPTION_THRESHOLD,
    );
    // Geometric mean: the anomaly call only earns high confidence when
    // *both* signals lean strong.
    const confidence = isAnomaly
      ? Math.sqrt(centroidScore * descriptionScore)
      : Math.max(0, 1 - Math.max(centroidDistance, descriptionDistance));
    return { centroidDistance, descriptionDistance, isAnomaly, confidence };
  }

  // No model state at all — caller should have short-circuited.
  return {
    centroidDistance,
    descriptionDistance,
    isAnomaly: false,
    confidence: 0,
  };
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
