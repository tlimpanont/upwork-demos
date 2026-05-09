import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-0 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[oklch(0.7_0.18_285)] opacity-15 blur-[120px]"
      />
      <div className="bg-grid-faint">
        <div className="mx-auto flex max-w-md flex-col items-center px-6 py-10">
          <Link href="/" className="mb-10 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[oklch(0.7_0.18_285)] to-[oklch(0.72_0.16_200)]">
              <Sparkles className="h-4 w-4 text-background" />
            </div>
            <span className="text-base font-semibold">Lumen</span>
          </Link>
          <div className="w-full">{children}</div>
        </div>
      </div>
    </main>
  );
}