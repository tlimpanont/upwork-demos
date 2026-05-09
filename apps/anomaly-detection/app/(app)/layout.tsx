import Link from "next/link";
import { Eye, LayoutGrid, FolderKanban } from "lucide-react";
import { requireUser } from "@/lib/api";
import { SignOutButton } from "./SignOutButton";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border/60 bg-card/30 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-chart-2">
              <Eye className="h-3.5 w-3.5 text-background" />
            </div>
            <span className="text-sm font-semibold">Sentinel</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink href="/dashboard" icon={LayoutGrid}>
              Dashboard
            </NavLink>
            <NavLink href="/projects" icon={FolderKanban}>
              Projects
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="hidden sm:inline">
            {user.name ?? user.email}
          </span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
