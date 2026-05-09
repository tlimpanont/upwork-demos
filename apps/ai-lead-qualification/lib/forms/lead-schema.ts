import { z } from "zod";
import { BUDGET_RANGES, COMPANY_SIZES, SERVICES } from "../data/options";

export const leadFormSchema = z.object({
  name: z.string().min(2, "Tell us your name").max(80),
  company: z.string().max(120).optional(),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .max(40)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  companySize: z.enum(COMPANY_SIZES).optional(),
  budget: z.enum(BUDGET_RANGES).optional(),
  inquiry: z
    .string()
    .min(20, "A few sentences helps the AI qualify accurately")
    .max(2000),
  services: z
    .array(z.enum(SERVICES))
    .min(1, "Pick at least one service")
    .max(SERVICES.length),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;