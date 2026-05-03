import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Customer Support",
  description: "AI-powered customer support chatbot with knowledge base",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} h-full antialiased`} suppressHydrationWarning>{children}</body>
    </html>
  );
}
