import path from "node:path";
import type { MetadataRoute } from "next";
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../keystatic.config";

const SITE_URL = "https://theuy.nl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const reader = createReader(
    path.resolve(process.cwd(), "../.."),
    keystaticConfig,
  );
  const entries = await reader.collections.caseStudies.all();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/case-studies`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.7,
    },
  ];

  const caseStudyRoutes: MetadataRoute.Sitemap = entries.map(
    ({ slug, entry }) => ({
      url: `${SITE_URL}/case-studies/${slug}`,
      lastModified: entry.publishedAt ? new Date(entry.publishedAt) : now,
      changeFrequency: "monthly",
      priority: 0.8,
    }),
  );

  return [...staticRoutes, ...caseStudyRoutes];
}
