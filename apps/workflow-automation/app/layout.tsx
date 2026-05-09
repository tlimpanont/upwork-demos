import type { Metadata } from "next";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import Providers from "./Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workflow Automation · AI-classified, rules-routed",
  description:
    "AI classifies inputs, deterministic rules route them, the dashboard shows the full pipeline.",
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
      </body>
    </html>
  );
}
