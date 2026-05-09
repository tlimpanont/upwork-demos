import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type AuthedUser = {
  id: string;
  email: string;
  name: string | null;
};

export async function requireUser(): Promise<AuthedUser> {
  const session = await auth();
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id || !session?.user?.email) {
    redirect("/login");
  }
  return {
    id,
    email: session.user.email,
    name: session.user.name ?? null,
  };
}
