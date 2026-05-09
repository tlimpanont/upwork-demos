import Link from "next/link";
import { ArrowRight, Eye, Layers, Sparkles, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="bg-grid-faint absolute inset-0 opacity-50" />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-chart-2">
              <Eye className="h-4 w-4 text-background" />
            </div>
            <span className="text-base font-semibold">Sentinel</span>
            <span className="rounded-full border border-border/60 bg-card/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              Demo
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Get started
            </Link>
          </nav>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            Image embeddings + Atlas Vector Search
          </span>
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            Teach AI what <span className="gradient-text">normal</span> looks
            like.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground md:text-lg">
            Upload chronological image sequences, annotate normal and anomalous
            regions, and detect anomalies in new images with embedding-based
            similarity search backed by MongoDB Atlas.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 sm:w-auto"
            >
              Create a project
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-transparent px-5 py-3 text-sm font-semibold hover:bg-card sm:w-auto"
            >
              See the dashboard
            </Link>
          </div>
          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              MongoDB Atlas Vector Search
            </li>
            <li className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-primary" />
              Konva annotation canvas
            </li>
            <li className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" />
              OpenAI embeddings
            </li>
          </ul>
        </section>

        <footer className="text-center text-xs text-muted-foreground">
          Sentinel · AI Time-Series Anomaly Detection
        </footer>
      </div>
    </main>
  );
}
