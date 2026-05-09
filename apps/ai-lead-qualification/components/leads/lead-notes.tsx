"use client";

import { useState, useTransition } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { LeadNote } from "@/lib/db/lead";
import { addLeadNote } from "@/app/(dashboard)/leads/[id]/actions";
import { formatDateTime } from "@/lib/utils/format";

export function LeadNotes({
  leadId,
  notes,
}: {
  leadId: string;
  notes: LeadNote[];
}) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
            No notes yet. Add the first one below.
          </p>
        ) : (
          notes
            .slice()
            .reverse()
            .map((n) => (
              <div
                key={n.at}
                className="rounded-lg border border-border/40 bg-muted/20 p-3 text-sm"
              >
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/90">
                    {n.author}
                  </span>
                  <span>{formatDateTime(n.at)}</span>
                </div>
                <p className="whitespace-pre-wrap">{n.text}</p>
              </div>
            ))
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          start(async () => {
            await addLeadNote(leadId, text);
            setText("");
          });
        }}
        className="space-y-2"
      >
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a note for the team — context, follow-up details, objections heard…"
          rows={3}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={pending || !text.trim()}
          >
            <MessageSquarePlus className="h-4 w-4" />
            {pending ? "Saving…" : "Add note"}
          </Button>
        </div>
      </form>
    </div>
  );
}
