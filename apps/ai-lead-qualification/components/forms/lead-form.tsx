"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { track } from "@vercel/analytics";

import {
  leadFormSchema,
  type LeadFormValues,
} from "@/lib/forms/lead-schema";
import {
  BUDGET_RANGES,
  COMPANY_SIZES,
  SERVICES,
} from "@/lib/data/options";
import { submitLead, type SubmitResult } from "@/app/submit/actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

export function LeadForm() {
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<SubmitResult | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { services: [] },
  });

  const services = watch("services") ?? [];
  const companySize = watch("companySize");
  const budget = watch("budget");

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    const r = await submitLead(values);
    setResult(r);
    setSubmitting(false);
    if (r.ok) {
      track("lead_qualified", {
        services_count: values.services?.length ?? 0,
        has_budget: Boolean(values.budget),
        has_company_size: Boolean(values.companySize),
      });
      reset({ services: [] });
    }
  });

  if (result?.ok) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="flex flex-col items-start gap-4 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
            <CheckCircle2 className="h-6 w-6 text-emerald-300" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">Thanks, got it.</h3>
            <p className="text-sm text-muted-foreground">
              Our AI just qualified your inquiry and routed it to the right
              team. You&apos;ll hear from us within one business day.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setResult(null)} variant="outline">
              Submit another
            </Button>
            <Button asChild variant="gradient">
              <a href={`/leads/${result.leadId}`}>See the AI analysis →</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardContent className="grid gap-5 p-6 md:grid-cols-2">
          <Field label="Full name" error={errors.name?.message} required>
            <Input placeholder="Jane Cooper" {...register("name")} />
          </Field>
          <Field label="Work email" error={errors.email?.message} required>
            <Input
              type="email"
              placeholder="jane@acme.com"
              {...register("email")}
            />
          </Field>
          <Field label="Company" error={errors.company?.message}>
            <Input placeholder="Acme Inc." {...register("company")} />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <Input placeholder="+1 415 555 1234" {...register("phone")} />
          </Field>
          <Field label="Company size">
            <Select
              value={companySize}
              onValueChange={(v) =>
                setValue("companySize", v as LeadFormValues["companySize"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Budget range">
            <Select
              value={budget}
              onValueChange={(v) =>
                setValue("budget", v as LeadFormValues["budget"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_RANGES.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="Services interested in"
            error={errors.services?.message}
            required
            className="md:col-span-2"
          >
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((s) => {
                const active = services.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() =>
                      setValue(
                        "services",
                        active
                          ? services.filter((x) => x !== s)
                          : [...services, s],
                        { shouldValidate: true },
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "border-primary/50 bg-primary/15 text-primary ring-1 ring-inset ring-primary/30"
                        : "border-border bg-input/40 text-muted-foreground hover:border-border hover:bg-input/60 hover:text-foreground",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field
            label="Tell us what you're trying to solve"
            error={errors.inquiry?.message}
            required
            className="md:col-span-2"
          >
            <Textarea
              rows={6}
              placeholder="We're a 200-person SaaS scaling from 100 to 500 inbound leads/month. We need to qualify and route faster, sales is drowning in low-fit demos. Looking to start in Q2."
              {...register("inquiry")}
            />
          </Field>
        </CardContent>
      </Card>

      {result?.ok === false ? (
        <p className="text-sm text-destructive">{result.error}</p>
      ) : null}

      <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>
            Submitting runs the AI qualifier and routes you to the right team,
            usually in under 5 seconds.
          </span>
        </p>
        <Button
          type="submit"
          variant="gradient"
          size="lg"
          disabled={submitting}
          className="sm:w-auto"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Qualifying…
            </>
          ) : (
            <>Submit & qualify with AI</>
          )}
        </Button>
      </div>
      {services.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {services.map((s) => (
            <Badge key={s} variant="muted">
              {s}
            </Badge>
          ))}
        </div>
      ) : null}
    </form>
  );
}

function Field({
  label,
  required,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>
        {label}
        {required ? <span className="text-primary"> *</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}