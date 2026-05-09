"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  ChevronDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  qualificationBadgeVariant,
  statusBadgeVariant,
} from "@/components/leads/qualification-badge";
import type { HydratedLead } from "@/lib/db/lead";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";

type SortKey = "createdAt" | "aiScore" | "name" | "company";

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  qualified: "Qualified",
  contacted: "Contacted",
  converted: "Converted",
  dropped: "Dropped",
};

export function LeadsTable({ leads }: { leads: HydratedLead[] }) {
  const [query, setQuery] = React.useState("");
  const [tier, setTier] = React.useState<string>("all");
  const [status, setStatus] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = leads;
    if (q) {
      out = out.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.company ?? "").toLowerCase().includes(q) ||
          l.inquiry.toLowerCase().includes(q),
      );
    }
    if (tier !== "all") {
      out = out.filter((l) =>
        tier === "pending" ? !l.qualification : l.qualification === tier,
      );
    }
    if (status !== "all") {
      out = out.filter((l) => l.status === status);
    }
    out = [...out].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "aiScore":
          return ((a.aiScore ?? -1) - (b.aiScore ?? -1)) * dir;
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "company":
          return (a.company ?? "").localeCompare(b.company ?? "") * dir;
        case "createdAt":
        default:
          return (a.createdAt.getTime() - b.createdAt.getTime()) * dir;
      }
    });
    return out;
  }, [leads, query, tier, status, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "company" ? "asc" : "desc");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, company, email, inquiry…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              <SelectItem value="Hot">Hot</SelectItem>
              <SelectItem value="Warm">Warm</SelectItem>
              <SelectItem value="Cold">Cold</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="dropped">Dropped</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            Showing {filtered.length} of {leads.length}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortableHead
                onClick={() => toggleSort("name")}
                active={sortKey === "name"}
                dir={sortDir}
              >
                Name
              </SortableHead>
              <SortableHead
                onClick={() => toggleSort("company")}
                active={sortKey === "company"}
                dir={sortDir}
              >
                Company
              </SortableHead>
              <SortableHead
                onClick={() => toggleSort("aiScore")}
                active={sortKey === "aiScore"}
                dir={sortDir}
              >
                Score
              </SortableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Budget</TableHead>
              <SortableHead
                onClick={() => toggleSort("createdAt")}
                active={sortKey === "createdAt"}
                dir={sortDir}
              >
                Date
              </SortableHead>
              <TableHead>Recommended action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={8}
                  className="py-16 text-center text-sm text-muted-foreground"
                >
                  No leads match those filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="py-3">
                    <Link
                      href={`/leads/${l.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {l.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {l.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {l.company ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {l.aiScore ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={qualificationBadgeVariant(l.qualification)}>
                      {l.qualification ?? "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(l.status)}>
                      {STATUS_LABELS[l.status] ?? l.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {l.budget ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(l.createdAt)}
                  </TableCell>
                  <TableCell className="max-w-[280px] text-sm text-muted-foreground">
                    <div className="truncate" title={l.recommendedAction ?? undefined}>
                      {l.recommendedAction ?? "—"}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SortableHead({
  children,
  onClick,
  active,
  dir,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  dir: "asc" | "desc";
}) {
  return (
    <TableHead>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-colors",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {children}
        {active ? (
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              dir === "asc" && "rotate-180",
            )}
          />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </button>
    </TableHead>
  );
}