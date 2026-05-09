import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentinel · AI Time-Series Anomaly Detection",
  description:
    "Upload chronological image sequences, annotate normal and anomalous regions, and detect anomalies in new images with embedding-based similarity search.",
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
