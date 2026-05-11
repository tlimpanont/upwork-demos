import type { MetadataRoute } from "next";

const SITE_URL = "https://theuy.nl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keystatic admin UI should not be indexed.
        disallow: ["/keystatic", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
