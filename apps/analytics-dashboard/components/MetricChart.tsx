"use client";

import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartPoint = {
  date: string;
  historical?: number | null;
  forecast?: number | null;
};

export type ChartAnomaly = {
  date: string;
  value: number;
  zScore: number;
};

export default function MetricChart({
  metricLabel,
  points,
  anomalies,
}: {
  metricLabel: string;
  points: ChartPoint[];
  anomalies: ChartAnomaly[];
}) {
  const theme = useTheme();
  const colors = useMemo(
    () => ({
      grid: theme.palette.divider,
      axis: theme.palette.text.secondary,
      historical: theme.palette.primary.light,
      forecast: theme.palette.secondary.light,
      anomaly: theme.palette.error.main,
      tooltipBg: theme.palette.background.paper,
    }),
    [theme],
  );

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {metricLabel} · history & forecast
          </Typography>
          <Stack direction="row" spacing={2} sx={{ ml: "auto", flexWrap: "wrap" }}>
            <Legend swatch={colors.historical} label="Historical" />
            <Legend swatch={colors.forecast} label="14-day forecast" dashed />
            <Legend swatch={colors.anomaly} label="Anomaly" round />
          </Stack>
        </Stack>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={fmtDate}
              minTickGap={40}
              stroke={colors.axis}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              stroke={colors.axis}
              tick={{ fontSize: 12 }}
              tickFormatter={(v: number) => fmtCompact(v)}
            />
            <Tooltip
              contentStyle={{
                background: colors.tooltipBg,
                border: `1px solid ${colors.grid}`,
                borderRadius: 8,
              }}
              formatter={(value) =>
                typeof value === "number" ? value.toFixed(2) : String(value ?? "")
              }
              labelFormatter={(label) => String(label ?? "")}
            />
            <Line
              dataKey="historical"
              type="monotone"
              stroke={colors.historical}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
              connectNulls={false}
              name="Historical"
            />
            <Line
              dataKey="forecast"
              type="monotone"
              stroke={colors.forecast}
              dot={false}
              strokeWidth={2}
              strokeDasharray="6 4"
              isAnimationActive={false}
              connectNulls={false}
              name="Forecast"
            />
            {anomalies.map((a) => (
              <ReferenceDot
                key={a.date}
                x={a.date}
                y={a.value}
                r={4}
                fill={colors.anomaly}
                stroke={colors.tooltipBg}
                strokeWidth={1.5}
                ifOverflow="extendDomain"
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </Stack>
    </Paper>
  );
}

function Legend({
  swatch,
  label,
  dashed,
  round,
}: {
  swatch: string;
  label: string;
  dashed?: boolean;
  round?: boolean;
}) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
      <span
        aria-hidden
        style={{
          width: 14,
          height: round ? 8 : 0,
          minHeight: round ? 8 : 2,
          borderRadius: round ? "50%" : 0,
          background: round ? swatch : "transparent",
          borderTop: round ? undefined : `2px ${dashed ? "dashed" : "solid"} ${swatch}`,
          display: "inline-block",
        }}
      />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function fmtCompact(v: number): string {
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + "k";
  return v.toFixed(0);
}
