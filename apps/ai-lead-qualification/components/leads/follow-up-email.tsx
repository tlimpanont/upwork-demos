"use client";

import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FollowUpEmail({
  body,
  to,
  name,
}: {
  body: string;
  to: string;
  name: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const subject = `Re: your inquiry — quick next step`;
  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-xs">
        <span className="text-muted-foreground">To</span>
        <span>
          {name} &lt;{to}&gt;
        </span>
        <span className="text-muted-foreground">Subject</span>
        <span>{subject}</span>
      </div>
      <pre className="whitespace-pre-wrap rounded-lg border border-border/40 bg-muted/20 p-4 font-sans text-sm leading-relaxed">
        {body}
      </pre>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={copy} variant="outline" size="sm">
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy draft
            </>
          )}
        </Button>
        <Button asChild variant="gradient" size="sm">
          <a href={mailto}>
            <Mail className="h-4 w-4" />
            Open in mail client
          </a>
        </Button>
      </div>
    </div>
  );
}
