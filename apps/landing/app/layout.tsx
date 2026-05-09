import type { Metadata, Viewport } from "next";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import Providers from "./Providers";
import "./globals.css";

const SITE_URL = "https://upwork-demos-landing.vercel.app";
const SITE_NAME = "Theuy Limpanont";
const SITE_TITLE = "Theuy Limpanont · Senior full-stack and AI engineer";
const SITE_DESCRIPTION =
  "Freelance senior engineer building production-grade web platforms and AI systems for SaaS founders and product teams. Typed APIs, real auth, real billing, AI workflows that ship.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · Theuy Limpanont",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: [
    "freelance engineer",
    "senior full-stack developer",
    "AI engineer",
    "RAG developer",
    "Next.js consultant",
    "TypeScript",
    "Stripe integration",
    "multi-tenant SaaS",
    "Netherlands",
    "freelance Nederland",
  ],
  authors: [
    {
      name: "Theuy Limpanont",
      url: "https://www.linkedin.com/in/theuylimpanont/",
    },
  ],
  creator: "Theuy Limpanont",
  publisher: "Theuy Limpanont",
  category: "technology",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "profile",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    firstName: "Theuy",
    lastName: "Limpanont",
    // OG image is auto-detected from app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // Twitter image is auto-detected from app/opengraph-image.tsx
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0F19" },
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <InitColorSchemeScript attribute="data" defaultMode="system" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}