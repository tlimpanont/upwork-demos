import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";

export function KPICard({
  label,
  value,
  delta,
  format = "number",
}: {
  label: string;
  value: number | string | null;
  delta?: number; // 0.12 = +12%, -0.034 = -3.4%
  format?: "number" | "percent" | "score";
}) {
  const display =
    value == null
      ? "—"
      : typeof value === "string"
        ? value
        : format === "percent"
          ? `${(value * 100).toFixed(1)}%`
          : format === "score"
            ? `${Math.round(value)}`
            : formatNumber(value);

  const showDelta = delta !== undefined && Number.isFinite(delta);
  const positive = (delta ?? 0) >= 0;

  return (
    <Card className="border-border/40">
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-2 text-3xl font-semibold tracking-tight">
          {display}
        </div>
        {showDelta ? (
          <div
            className={cn(
              "mt-1.5 flex items-center gap-1 text-xs",
              positive ? "text-emerald-400" : "text-rose-400",
            )}
          >
            {positive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            <span>
              {positive ? "+" : ""}
              {(delta! * 100).toFixed(1)}% vs prev. 30 days
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}