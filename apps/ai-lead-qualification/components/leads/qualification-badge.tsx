import { Badge } from "@/components/ui/badge";

export function qualificationBadgeVariant(
  tier: string | null | undefined,
): "hot" | "warm" | "cold" | "muted" {
  if (tier === "Hot") return "hot";
  if (tier === "Warm") return "warm";
  if (tier === "Cold") return "cold";
  return "muted";
}

export function QualificationBadge({
  tier,
}: {
  tier: string | null | undefined;
}) {
  return <Badge variant={qualificationBadgeVariant(tier)}>{tier ?? "Pending"}</Badge>;
}

export function statusBadgeVariant(
  status: string,
): "success" | "default" | "muted" | "warm" {
  if (status === "qualified") return "success";
  if (status === "contacted") return "default";
  if (status === "converted") return "success";
  if (status === "dropped") return "muted";
  return "warm"; // new
}