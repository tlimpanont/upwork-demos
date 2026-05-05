"use client";

import { useRouter, useSearchParams } from "next/navigation";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

const METRICS: { value: string; label: string }[] = [
  { value: "revenue", label: "Revenue" },
  { value: "activeUsers", label: "Active users" },
  { value: "newUsers", label: "New users" },
  { value: "churnRate", label: "Churn rate" },
  { value: "conversions", label: "Conversions" },
];

export default function MetricSwitcher({ current }: { current: string }) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={current}
      onChange={(_e, value: string | null) => {
        if (!value) return;
        const next = new URLSearchParams(params?.toString() ?? "");
        next.set("metric", value);
        router.push(`/?${next.toString()}`);
      }}
      sx={{ flexWrap: "wrap" }}
    >
      {METRICS.map((m) => (
        <ToggleButton key={m.value} value={m.value} sx={{ textTransform: "none" }}>
          {m.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
