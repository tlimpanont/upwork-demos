"use client";

import { useActionState, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { loginAction } from "./actions";

// Hardcoded demo credentials match the defaults baked into scripts/seed.ts.
// Surfacing them here means a visitor opening the deployed demo can sign
// in with one click and see the prepared baseline data without having to
// guess at the username/password.
const DEMO_EMAIL = "demo@anomaly.local";
const DEMO_PASSWORD = "demo1234";

export function LoginForm({
  demoEmail = DEMO_EMAIL,
  demoPassword = DEMO_PASSWORD,
}: {
  demoEmail?: string;
  demoPassword?: string;
}) {
  const [state, formAction, pending] = useActionState(loginAction, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);

  function fillDemo() {
    setEmail(demoEmail);
    setPassword(demoPassword);
  }

  function fillAndSubmit() {
    setEmail(demoEmail);
    setPassword(demoPassword);
    // Submit on the next tick so React commits the new field values first.
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  }

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-primary/40 bg-primary/5 p-3 text-xs">
        <div className="mb-2 flex items-center gap-1.5 font-medium text-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Try the demo account
        </div>
        <p className="text-muted-foreground">
          The demo workspace is preloaded with the baseline projects,
          annotations, and detection rules from the case study.
        </p>
        <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 font-mono text-[11px] text-foreground">
          <dt className="text-muted-foreground">email</dt>
          <dd>{demoEmail}</dd>
          <dt className="text-muted-foreground">password</dt>
          <dd>{demoPassword}</dd>
        </dl>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={fillAndSubmit}
            disabled={pending}
          >
            Sign in as demo
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={fillDemo}>
            Fill the form only
          </Button>
        </div>
      </div>

      <form ref={formRef} action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {state?.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
