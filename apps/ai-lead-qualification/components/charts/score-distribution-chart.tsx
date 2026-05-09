"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ScoreDistributionChart({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.012 260)" />
        <XAxis
          dataKey="label"
          stroke="oklch(0.7 0.015 260)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="oklch(0.7 0.015 260)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "oklch(0.18 0.012 260)",
            border: "1px solid oklch(0.28 0.012 260)",
            borderRadius: 8,
            fontSize: 12,
          }}
          cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
          labelStyle={{ color: "oklch(0.985 0.005 260)" }}
        />
        <Bar
          dataKey="count"
          fill="oklch(0.7 0.18 285)"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}