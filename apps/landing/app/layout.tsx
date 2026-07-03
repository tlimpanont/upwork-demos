import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "./Providers";
import "./globals.css";

const SITE_URL = "https://theuy.nl";
const SITE_NAME = "Theuy Limpanont";
const SITE_TITLE =
  "Enterprise AI and Custom Software Solutions · Theuy Limpanont";
// Keep this between 110 and 160 chars — that's the sweet spot for
// Google snippets and social previews. Longer descriptions get
// truncated; shorter ones leave keyword real estate on the table.
const SITE_DESCRIPTION =
  "Senior engineering partner shipping AI platforms, automation, and SaaS that deliver measurable enterprise outcomes. Get in touch.";

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
    "Enterprise AI Development",
    "Custom Software Development",
    "AI Automation Solutions",
    "Computer Vision Development",
    "Predictive Analytics",
    "SaaS Development",
    "ERP Integration",
    "Analytics Dashboard Development",
    "Multi-tenant SaaS",
    "AI Engineering",
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
    // "website" is the right type for a business / portfolio site;
    // "profile" is reserved for personal-profile pages and changes how
    // some social previews render the card.
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
  themeColor: "#0B0F19",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-mui-color-scheme="dark" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}