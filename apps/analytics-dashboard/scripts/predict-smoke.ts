import { strict as assert } from "node:assert";
import { buildDailyMetrics } from "../lib/data/seed";
import {
  anomaly,
  confidence,
  forecast,
  predict,
  trend,
} from "../lib/prediction-engine";

const metrics = buildDailyMetrics();
const revenueSeries = metrics.map((m) => ({
  date: m.date.toISOString().slice(0, 10),
  value: m.revenue,
}));
const userSeries = metrics.map((m) => ({
  date: m.date.toISOString().slice(0, 10),
  value: m.activeUsers,
}));

console.log(`[smoke] series length: ${revenueSeries.length} days\n`);

// ---- per-module spot-checks ------------------------------------------------

const revValues = revenueSeries.map((p) => p.value);
const t = trend(revValues);
console.log("[trend] revenue:", t);

const f = forecast(revValues, 14);
console.log(
  `[forecast] revenue 14d: first=${f.values[0].toFixed(2)} last=${f.values.at(-1)!.toFixed(2)}`,
);

const a = anomaly(revValues);
console.log(`[anomaly] revenue: ${a.length} flagged points`);
a.slice(0, 5).forEach((x) =>
  console.log(`  · idx=${x.index} value=${x.value.toFixed(0)} z=${x.zScore.toFixed(2)}`),
);

const c = confidence(revValues);
console.log(`[confidence] revenue: ${c.toFixed(3)}\n`);

// ---- bundled predict() -----------------------------------------------------

const p = predict("revenue", revenueSeries, 14);
console.log("[predict] revenue summary:", {
  metric: p.metric,
  direction: p.trend.direction,
  growthRatePct: (p.trend.growthRate * 100).toFixed(3) + "%/day",
  confidence: p.confidence.toFixed(3),
  forecastFirst: p.forecast.points[0],
  forecastLast: p.forecast.points.at(-1),
  anomalyCount: p.anomalies.length,
});

const pUsers = predict("activeUsers", userSeries, 14);
console.log("[predict] activeUsers summary:", {
  direction: pUsers.trend.direction,
  growthRatePct: (pUsers.trend.growthRate * 100).toFixed(3) + "%/day",
  confidence: pUsers.confidence.toFixed(3),
  forecastFirst: pUsers.forecast.points[0],
  anomalyCount: pUsers.anomalies.length,
});

// ---- assertions on deterministic dataset ----------------------------------

console.log("\n[assert] running invariants on seeded dataset…");
assert.equal(p.metric, "revenue");
assert.equal(p.forecast.points.length, 14);
assert.equal(p.forecast.horizon, 14);
assert.equal(p.trend.direction, "up", "revenue should trend up across 365d");
assert.ok(p.trend.growthRate > 0, "growth rate should be positive");
assert.ok(p.confidence >= 0 && p.confidence <= 1, "confidence in [0,1]");
assert.ok(p.anomalies.length >= 1, "spike events should be detected");
assert.ok(
  p.anomalies.some((x) => x.zScore > 0),
  "at least one positive-z anomaly (marketing spike)",
);
assert.ok(
  p.forecast.points.at(-1)!.value > p.forecast.points[0].value,
  "14-day forecast continues upward",
);
assert.ok(pUsers.trend.direction === "up", "activeUsers should also trend up");
console.log("[assert] all invariants pass");
