import path from "node:path";
import Box from "@mui/material/Box";
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../keystatic.config";
import SiteHeader from "@/components/SiteHeader";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import DemoShowcase from "@/components/DemoShowcase";
import CaseStudiesSection from "@/components/CaseStudiesSection";
import ArchitectureSection from "@/components/ArchitectureSection";
import TrustSection from "@/components/TrustSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import SiteFooter from "@/components/SiteFooter";

export default async function HomePage() {
  const reader = createReader(path.resolve(process.cwd(), "../.."), keystaticConfig);
  const [hero, services, architecture, faq, trust, cta, caseStudyEntries] =
    await Promise.all([
      reader.singletons.hero.readOrThrow(),
      reader.singletons.services.readOrThrow(),
      reader.singletons.architecture.readOrThrow(),
      reader.singletons.faq.readOrThrow(),
      reader.singletons.trust.readOrThrow(),
      reader.singletons.cta.readOrThrow(),
      reader.collections.caseStudies.all(),
    ]);

  const featuredStudies = [...caseStudyEntries]
    .sort((a, b) => {
      const aTime = a.entry.publishedAt ? new Date(a.entry.publishedAt).getTime() : 0;
      const bTime = b.entry.publishedAt ? new Date(b.entry.publishedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 3)
    .map(({ slug, entry }) => ({
      slug,
      title: entry.title,
      summary: entry.summary,
      client: entry.client,
      stack: entry.stack,
      publishedAt: entry.publishedAt,
    }));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <SiteHeader />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <HeroSection content={hero} />
        <ServicesSection content={services} />
        <DemoShowcase />
        <CaseStudiesSection studies={featuredStudies} />
        <ArchitectureSection content={architecture} />
        <TrustSection content={trust} />
        <FAQSection content={faq} />
        <CTASection content={cta} />
      </Box>
      <SiteFooter />
    </Box>
  );
}