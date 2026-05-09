import Link from "next/link";
import { ArrowLeft, ShieldCheck, Zap, Brain } from "lucide-react";
import { LeadForm } from "@/components/forms/lead-form";

export const metadata = {
  title: "Get qualified · Lumen",
  description:
    "Submit an inquiry and our AI will qualify, score, and route it in seconds.",
};

export default function SubmitPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="bg-grid-faint">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to homepage
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-6 pb-20">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Tell us about your <span className="gradient-text">sales motion</span>
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Our AI will read your inquiry, score it, and route it to the right
            person. Same flow we sell to customers.
          </p>
          <ul className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <Trust icon={Brain} label="GPT-4o-mini qualifier" />
            <Trust icon={Zap} label="< 5 seconds end-to-end" />
            <Trust icon={ShieldCheck} label="No data sold or shared" />
          </ul>
        </div>
        <LeadForm />
      </div>
    </main>
  );
}

function Trust({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2">
      <Icon className="h-4 w-4 text-primary" />
      <span>{label}</span>
    </li>
  );
}