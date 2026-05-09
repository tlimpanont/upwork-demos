import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <Button type="submit" variant="ghost" size="sm" className="text-xs">
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </Button>
    </form>
  );
}
