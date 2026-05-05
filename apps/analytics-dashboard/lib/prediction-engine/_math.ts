export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

export function stdDev(xs: number[], avg = mean(xs)): number {
  if (xs.length < 2) return 0;
  let s = 0;
  for (const x of xs) s += (x - avg) ** 2;
  return Math.sqrt(s / (xs.length - 1));
}

export function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}

export type Regression = {
  slope: number;
  intercept: number;
  r2: number;
};

// Ordinary least-squares linear regression with x = 0..n-1.
// R² is coefficient of determination, clamped to [0, 1].
export function linearRegression(y: number[]): Regression {
  const n = y.length;
  if (n < 2) return { slope: 0, intercept: y[0] ?? 0, r2: 0 };

  const xMean = (n - 1) / 2;
  const yMean = mean(y);

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (y[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;

  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yPred = intercept + slope * i;
    ssRes += (y[i] - yPred) ** 2;
    ssTot += (y[i] - yMean) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);

  return { slope, intercept, r2 };
}
