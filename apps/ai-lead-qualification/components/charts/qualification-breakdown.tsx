"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils/cn";

const COLORS: Record<string, string> = {
  Hot: "oklch(0.7 0.2 25)",
  Warm: "oklch(0.78 0.18 75)",
  Cold: "oklch(0.72 0.16 240)",
  Pending: "oklch(0.5 0.012 260)",
};

const LABEL_TONE: Record<string, string> = {
  Hot: "text-rose-300",
  Warm: "text-amber-300",
  Cold: "text-sky-300",
  Pending: "text-muted-foreground",
};

export function QualificationBreakdown({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="flex h-full flex-col">
      <div className="relative h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius={60}
              outerRadius={88}
              paddingAngle={2}
              stroke="oklch(0.18 0.012 260)"
            >
              {data.map((entry) => (
                <Cell key={entry.label} fill={COLORS[entry.label]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "oklch(0.18 0.012 260)",
                border: "1px solid oklch(0.28 0.012 260)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "oklch(0.985 0.005 260)" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-semibold">{total}</div>
          <div className="text-xs text-muted-foreground">leads</div>
        </div>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {data.map((d) => (
          <li
            key={d.label}
            className="flex items-center justify-between rounded-md border border-border/40 bg-muted/20 px-2 py-1.5"
          >
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: COLORS[d.label] }}
              />
              <span className={cn("font-medium", LABEL_TONE[d.label])}>
                {d.label}
              </span>
            </span>
            <span className="font-mono text-muted-foreground">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}