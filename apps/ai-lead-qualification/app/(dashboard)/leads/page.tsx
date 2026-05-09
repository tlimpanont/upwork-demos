import { prisma } from "@/lib/db/prisma";
import { hydrateLead } from "@/lib/db/lead";
import { Topbar } from "@/components/dashboard/topbar";
import { LeadsTable } from "@/components/leads/leads-table";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads — Lumen" };

export default async function LeadsPage() {
  const raw = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  const leads = raw.map(hydrateLead);
  return (
    <>
      <Topbar
        title="Leads"
        description="Every inbound submission, scored and routed by the AI."
      />
      <div className="p-6">
        <LeadsTable leads={leads} />
      </div>
    </>
  );
}