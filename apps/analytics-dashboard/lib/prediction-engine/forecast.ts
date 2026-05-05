import { linearRegression } from "./_math";

export type Forecast = {
  horizon: number;
  values: number[];
};

// Linear-regression projection. The caller decides whether to clamp to >= 0
// for inherently non-negative metrics (revenue, user counts).
export function forecast(series: number[], horizon: number): Forecast {
  if (horizon <= 0 || series.length === 0) {
    return { horizon: Math.max(0, horizon), values: [] };
  }
  const { slope, intercept } = linearRegression(series);
  const n = series.length;
  const values: number[] = new Array(horizon);
  for (let i = 1; i <= horizon; i++) {
    values[i - 1] = intercept + slope * (n + i - 1);
  }
  return { horizon, values };
}
