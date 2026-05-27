import type { Metadata } from "next";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { Analytics } from "@vercel/analytics/next";
import Providers from "./Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Analytics Dashboard · AI-powered SaaS demo",
  description:
    "Synthetic SaaS analytics with prediction engine, GraphQL API, and AI-generated insights.",
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
