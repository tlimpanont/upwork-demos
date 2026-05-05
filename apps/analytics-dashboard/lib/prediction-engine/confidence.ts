import { clamp, linearRegression, mean, stdDev } from "./_math";

// Blend two stability signals into a single 0..1 confidence score:
//   - R² from linear regression  → how well the trend line fits
//   - 1 − coefficient of variation → how stable the magnitude is
// Each contributes equally. A noisy-but-trending series scores ~0.5; a clean
// linear series scores ~0.9; a flat series with high noise scores low.
export function confidence(series: number[]): number {
  if (series.length < 3) return 0;

  const { r2 } = linearRegression(series);
  const m = mean(series);
  const cv = m === 0 ? 1 : stdDev(series, m) / Math.abs(m);
  const stability = 1 - clamp(cv, 0, 1);

  return clamp((r2 + stability) / 2, 0, 1);
}
