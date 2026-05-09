import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumen · AI Lead Qualification & CRM Automation",
  description:
    "Capture inbound leads, score them with AI, and route the qualified ones into HubSpot, Salesforce, Slack, and email automatically.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}