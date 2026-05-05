import { mean, stdDev } from "./_math";

export type Anomaly = {
  index: number;
  value: number;
  zScore: number; // signed: > 0 = positive spike, < 0 = drop
};

// Trailing rolling window so the engine can flag anomalies as they happen,
// without leaking future data into the detection of past points.
const WINDOW = 14;
const Z_THRESHOLD = 2.5;

export function anomaly(series: number[]): Anomaly[] {
  const out: Anomaly[] = [];
  if (series.length < WINDOW + 1) return out;

  for (let i = WINDOW; i < series.length; i++) {
    const window = series.slice(i - WINDOW, i);
    const m = mean(window);
    const s = stdDev(window, m);
    if (s === 0) continue;
    const z = (series[i] - m) / s;
    if (Math.abs(z) >= Z_THRESHOLD) {
      out.push({ index: i, value: series[i], zScore: z });
    }
  }
  return out;
}
