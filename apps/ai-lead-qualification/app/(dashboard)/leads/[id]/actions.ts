"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { hydrateLead, type LeadNote } from "@/lib/db/lead";

export async function addLeadNote(leadId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;
  const hydrated = hydrateLead(lead);
  const next: LeadNote[] = [
    ...hydrated.notes,
    {
      at: new Date().toISOString(),
      author: "You (demo)",
      text: trimmed,
    },
  ];
  await prisma.lead.update({
    where: { id: leadId },
    data: { notes: JSON.stringify(next) },
  });
  revalidatePath(`/leads/${leadId}`);
}

export async function updateLeadStatus(leadId: string, status: string) {
  await prisma.lead.update({
    where: { id: leadId },
    data: { status },
  });
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}
