import type { Metadata, Viewport } from "next";
import Script from "next/script";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "./Providers";
import "./globals.css";

const SITE_URL = "https://theuy.nl";
const LINKEDIN_PARTNER_ID = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID;
const SITE_NAME = "Theuy Limpanont";
const SITE_TITLE =
  "Enterprise AI and Custom Software Solutions · Theuy Limpanont";
// Keep this between 110 and 160 chars — that's the sweet spot for
// Google snippets and social previews. Longer descriptions get
// truncated; shorter ones leave keyword real estate on the table.
const SITE_DESCRIPTION =
  "Senior engineering partner shipping AI platforms, automation, and SaaS that deliver measurable enterprise outcomes. Book a discovery call.";

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
        <Analytics />
        <SpeedInsights />
        {LINKEDIN_PARTNER_ID ? (
          <>
            <Script id="linkedin-insight-init" strategy="afterInteractive">
              {`_linkedin_partner_id = "${LINKEDIN_PARTNER_ID}";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);`}
            </Script>
            <Script id="linkedin-insight-loader" strategy="afterInteractive">
              {`(function(l) {
if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
window.lintrk.q=[]}
var s = document.getElementsByTagName("script")[0];
var b = document.createElement("script");
b.type = "text/javascript";b.async = true;
b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
s.parentNode.insertBefore(b, s);})(window.lintrk);`}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                alt=""
                src={`https://px.ads.linkedin.com/collect/?pid=${LINKEDIN_PARTNER_ID}&fmt=gif`}
              />
            </noscript>
          </>
        ) : null}
      </body>
    </html>
  );
}