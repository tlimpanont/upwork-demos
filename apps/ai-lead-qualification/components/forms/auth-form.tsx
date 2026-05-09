"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Visual-only auth — the demo skips real NextAuth wiring. Submitting routes
// straight to the dashboard so the rest of the demo flow stays interactive.
export function AuthForm({
  children,
  cta,
  redirectTo = "/dashboard",
}: {
  children: React.ReactNode;
  cta: string;
  redirectTo?: string;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setPending(true);
        // Brief delay to feel like a real submission, then route.
        setTimeout(() => router.push(redirectTo), 500);
      }}
      className="space-y-4"
    >
      {children}
      <Button
        type="submit"
        variant="gradient"
        size="lg"
        className="w-full"
        disabled={pending}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Just a sec…
          </>
        ) : (
          cta
        )}
      </Button>
    </form>
  );
}