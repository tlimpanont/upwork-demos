import type { Metadata } from "next";
import Providers from "./Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Theuy Limpanont — Senior full-stack and AI engineer",
  description:
    "Freelance senior engineer building production-grade web platforms and AI systems. Full-stack, end-to-end — typed APIs, real auth, real billing, AI workflows that ship.",
  openGraph: {
    title: "Theuy Limpanont — Senior full-stack and AI engineer",
    description:
      "Freelance senior engineer building production-grade web platforms and AI systems.",
    images: ["/profile-pic-theuy.jpeg"],
    type: "profile",
  },
  twitter: {
    card: "summary",
    title: "Theuy Limpanont — Senior full-stack and AI engineer",
    description:
      "Freelance senior engineer building production-grade web platforms and AI systems.",
    images: ["/profile-pic-theuy.jpeg"],
  },
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
