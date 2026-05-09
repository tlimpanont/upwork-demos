import {
  Briefcase,
  CircleDollarSign,
  Crown,
  Flame,
  ShieldAlert,
  Target,
} from "lucide-react";
import type { Signal } from "@/lib/ai/qualify";
import { cn } from "@/lib/utils/cn";

const CATEGORY_META: Record<
  Signal["category"],
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  fit: { label: "Fit", icon: Target },
  budget: { label: "Budget", icon: CircleDollarSign },
  intent: { label: "Intent", icon: Briefcase },
  urgency: { label: "Urgency", icon: Flame },
  authority: { label: "Authority", icon: Crown },
  risk: { label: "Risk", icon: ShieldAlert },
};

const STRENGTH_RING: Record<Signal["strength"], string> = {
  strong: "ring-emerald-500/30 bg-emerald-500/5 text-emerald-300",
  moderate: "ring-amber-500/30 bg-amber-500/5 text-amber-300",
  weak: "ring-sky-500/30 bg-sky-500/5 text-sky-300",
};

const STRENGTH_DOT: Record<Signal["strength"], string> = {
  strong: "bg-emerald-400",
  moderate: "bg-amber-400",
  weak: "bg-sky-400",
};

export function SignalsMatrix({ signals }: { signals: Signal[] }) {
  if (signals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No signals extracted.</p>
    );
  }
  return (
    <ul className="space-y-2">
      {signals.map((s, i) => {
        const meta = CATEGORY_META[s.category];
        const Icon = meta.icon;
        return (
          <li
            key={i}
            className={cn(
              "flex items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 ring-1 ring-inset",
              STRENGTH_RING[s.strength],
            )}
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background/40">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium uppercase tracking-wider">
                  {meta.label}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", STRENGTH_DOT[s.strength])}
                  />
                  <span className="capitalize">{s.strength}</span>
                </span>
              </div>
              <p className="mt-1 text-sm leading-snug text-foreground/90">
                {s.note}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
