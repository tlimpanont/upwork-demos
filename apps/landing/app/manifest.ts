import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Theuy Limpanont · Senior full-stack and AI engineer",
    short_name: "Theuy Limpanont",
    description:
      "Freelance senior engineer building production-grade web platforms and AI systems for SaaS founders and product teams.",
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