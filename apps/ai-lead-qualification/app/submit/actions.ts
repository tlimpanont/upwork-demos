"use server";

import { revalidatePath } from "next/cache";
import { ingestLead } from "@/lib/pipeline";
import { leadFormSchema, type LeadFormValues } from "@/lib/forms/lead-schema";

export type SubmitResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string };

export async function submitLead(values: LeadFormValues): Promise<SubmitResult> {
  const parsed = leadFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form for errors." };
  }
  try {
    const { id } = await ingestLead({
      name: parsed.data.name,
      company: parsed.data.company ?? null,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      companySize: parsed.data.companySize ?? null,
      budget: parsed.data.budget ?? null,
      inquiry: parsed.data.inquiry,
      services: parsed.data.services,
    });
    // Refresh dashboard surfaces so a salesperson watching the table sees the
    // new lead within a tick of the form submitting.
    revalidatePath("/dashboard");
    revalidatePath("/leads");
    return { ok: true, leadId: id };
  } catch (e) {
    return {
      ok: false,
      error: (e as Error).message ?? "Something went wrong. Try again.",
    };
  }
}