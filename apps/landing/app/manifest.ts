import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Theuy Limpanont · Enterprise AI and Custom Software",
    short_name: "Theuy Limpanont",
    description:
      "Senior engineering partner shipping AI platforms, automation, and SaaS that deliver measurable enterprise outcomes.",
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