"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  createProjectAction,
  updateProjectAction,
} from "./actions";

const DOMAINS: { value: string; label: string }[] = [
  { value: "solar", label: "Solar panel monitoring" },
  { value: "manufacturing", label: "Manufacturing defect inspection" },
  { value: "medical", label: "Medical image progression" },
  { value: "security", label: "Security surveillance" },
  { value: "agriculture", label: "Agricultural crop analysis" },
  { value: "other", label: "Other" },
];

export type ProjectFormProps =
  | { mode: "create"; initial?: undefined }
  | {
      mode: "edit";
      initial: {
        id: string;
        name: string;
        description: string | null;
        domain: string;
      };
    };

export function ProjectForm(props: ProjectFormProps) {
  const action =
    props.mode === "create" ? createProjectAction : updateProjectAction;
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-4">
      {props.mode === "edit" ? (
        <input type="hidden" name="id" value={props.initial.id} />
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="name">Project name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Solar panel monitoring"
          defaultValue={props.mode === "edit" ? props.initial.name : ""}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="domain">Domain</Label>
        <select
          id="domain"
          name="domain"
          defaultValue={props.mode === "edit" ? props.initial.domain : "other"}
          className="flex h-10 w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {DOMAINS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="What kind of anomalies should this detector catch?"
          defaultValue={
            props.mode === "edit" ? (props.initial.description ?? "") : ""
          }
          className="flex w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending
          ? props.mode === "create"
            ? "Creating…"
            : "Saving…"
          : props.mode === "create"
            ? "Create project"
            : "Save changes"}
      </Button>
    </form>
  );
}
