import Link from "next/link";
import { Eye } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="bg-grid-faint relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-chart-2">
          <Eye className="h-4 w-4 text-background" />
        </div>
        <span className="text-base font-semibold">Sentinel</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
