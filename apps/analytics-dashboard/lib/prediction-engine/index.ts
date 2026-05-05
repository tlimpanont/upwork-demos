import { trend, type Trend, type TrendDirection } from "./trend";
import { forecast, type Forecast } from "./forecast";
import { anomaly, type Anomaly } from "./anomaly";
import { confidence } from "./confidence";

export { trend, forecast, anomaly, confidence };
export type { Trend, TrendDirection, Forecast, Anomaly };
export type Confidence = number;

export type Point = { date: string; value: number };

export type ForecastPoint = { date: string; value: number };
export type AnomalyPoint = Anomaly & { date: string };

export type Prediction = {
  metric: string;
  trend: Trend;
  forecast: Forecast & { points: ForecastPoint[] };
  anomalies: AnomalyPoint[];
  confidence: Confidence;
};

export function predict(metric: string, series: Point[], horizon: number): Prediction {
  const values = series.map((p) => p.value);
  const t = trend(values);
  const f = forecast(values, horizon);
  const a = anomaly(values).map((x) => ({ ...x, date: series[x.index]?.date ?? "" }));
  const c = confidence(values);

  const last = series[series.length - 1]?.date ?? new Date().toISOString().slice(0, 10);
  const dates = projectDates(last, f.horizon);
  const points: ForecastPoint[] = dates.map((date, i) => ({
    date,
    value: f.values[i],
  }));

  return {
    metric,
    trend: t,
    forecast: { ...f, points },
    anomalies: a,
    confidence: c,
  };
}

function projectDates(lastIso: string, horizon: number): string[] {
  const out: string[] = [];
  const d = new Date(lastIso + "T00:00:00Z");
  for (let i = 1; i <= horizon; i++) {
    d.setUTCDate(d.getUTCDate() + 1);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
