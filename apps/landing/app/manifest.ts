import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Theuy Limpanont · Enterprise AI and Custom Software",
    short_name: "Theuy Limpanont",
    description:
      "Senior engineering partner designing AI-powered platforms, automation systems, and scalable SaaS applications that deliver measurable business results.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0F19",
    theme_color: "#0B0F19",
    icons: [
      {
        src: "/profile-pic-theuy.jpeg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/profile-pic-theuy.jpeg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
  };
}