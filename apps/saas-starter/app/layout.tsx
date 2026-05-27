import type { Metadata } from "next";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { Analytics } from "@vercel/analytics/next";
import Providers from "./Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acme SaaS · Multi-tenant starter",
  description:
    "Production-ready multi-tenant SaaS starter: auth, billing, admin dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <InitColorSchemeScript attribute="class" />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
