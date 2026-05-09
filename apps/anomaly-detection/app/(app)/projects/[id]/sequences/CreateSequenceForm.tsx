import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { createSequenceAction } from "./actions";

export function CreateSequenceForm({ projectId }: { projectId: string }) {
  return (
    <form action={createSequenceAction} className="space-y-3">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Site A — Q2 2026"
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Create
      </Button>
    </form>
  );
}
