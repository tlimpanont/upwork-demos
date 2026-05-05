import { linearRegression, mean } from "./_math";

export type TrendDirection = "up" | "down" | "flat";

export type Trend = {
  direction: TrendDirection;
  growthRate: number; // proportional growth per period (0.012 = +1.2% per day)
  slope: number;
  intercept: number;
};

// Anything between ±0.05% per day is treated as flat — below that the slope is
// indistinguishable from baseline noise on most SaaS series.
const FLAT_THRESHOLD = 0.0005;

export function trend(series: number[]): Trend {
  const { slope, intercept } = linearRegression(series);
  const m = mean(series);
  const growthRate = m === 0 ? 0 : slope / m;

  const direction: TrendDirection =
    growthRate > FLAT_THRESHOLD ? "up" : growthRate < -FLAT_THRESHOLD ? "down" : "flat";

  return { direction, growthRate, slope, intercept };
}
