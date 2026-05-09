"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateLeadStatus } from "@/app/(dashboard)/leads/[id]/actions";

const OPTIONS = [
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified" },
  { value: "contacted", label: "Contacted" },
  { value: "converted", label: "Converted" },
  { value: "dropped", label: "Dropped" },
];

export function LeadStatusSelect({
  leadId,
  current,
}: {
  leadId: string;
  current: string;
}) {
  const [pending, start] = useTransition();
  return (
    <Select
      value={current}
      onValueChange={(v) => start(() => updateLeadStatus(leadId, v))}
      disabled={pending}
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
