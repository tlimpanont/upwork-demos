import type { Metadata } from "next";
import Providers from "./Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI + SaaS Demo Platform — Production-ready systems",
  description:
    "AI-powered SaaS systems ready for production: customer support AI, document processing, and multi-tenant SaaS platforms. Built on Next.js, OpenAI, Pinecone, and Vercel.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-mui-color-scheme="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
