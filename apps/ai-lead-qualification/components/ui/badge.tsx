import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/15 text-primary ring-1 ring-inset ring-primary/30",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground/80",
        hot: "border-transparent bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/30",
        warm: "border-transparent bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30",
        cold: "border-transparent bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/30",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30",
        muted:
          "border-transparent bg-muted text-muted-foreground ring-1 ring-inset ring-border",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };