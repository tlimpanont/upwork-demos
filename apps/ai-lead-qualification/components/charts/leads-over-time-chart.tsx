"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function LeadsOverTimeChart({
  data,
}: {
  data: { date: string; total: number; qualified: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="oklch(0.7 0.18 285)"
              stopOpacity={0.5}
            />
            <stop
              offset="95%"
              stopColor="oklch(0.7 0.18 285)"
              stopOpacity={0}
            />
          </linearGradient>
          <linearGradient id="qualifiedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="oklch(0.78 0.16 145)"
              stopOpacity={0.5}
            />
            <stop
              offset="95%"
              stopColor="oklch(0.78 0.16 145)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.012 260)" />
        <XAxis
          dataKey="date"
          stroke="oklch(0.7 0.015 260)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v.slice(5)}
          minTickGap={24}
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
          labelStyle={{ color: "oklch(0.985 0.005 260)" }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="oklch(0.7 0.18 285)"
          fill="url(#totalGrad)"
          strokeWidth={2}
          name="Total"
        />
        <Area
          type="monotone"
          dataKey="qualified"
          stroke="oklch(0.78 0.16 145)"
          fill="url(#qualifiedGrad)"
          strokeWidth={2}
          name="Qualified"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}