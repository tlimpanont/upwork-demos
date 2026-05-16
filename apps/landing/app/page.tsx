import path from "node:path";
import Box from "@mui/material/Box";
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../keystatic.config";
import SiteHeader from "@/components/SiteHeader";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import DemoShowcase from "@/components/DemoShowcase";
import IndustriesSection from "@/components/IndustriesSection";
import OutcomesSection from "@/components/OutcomesSection";
import ArchitectureSection from "@/components/ArchitectureSection";
import ProcessSection from "@/components/ProcessSection";
import AboutSection from "@/components/AboutSection";
import TrustSection from "@/components/TrustSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import SiteFooter from "@/components/SiteFooter";

export default async function HomePage() {
  const reader = createReader(
    path.resolve(process.cwd(), "../.."),
    keystaticConfig,
  );
  const [
    hero,
    services,
    demoShowcase,
    industries,
    outcomes,
    architecture,
    processContent,
    about,
    faq,
    trust,
    cta,
  ] = await Promise.all([
    reader.singletons.hero.readOrThrow(),
    reader.singletons.services.readOrThrow(),
    reader.singletons.demoShowcase.readOrThrow(),
    reader.singletons.industries.readOrThrow(),
    reader.singletons.outcomes.readOrThrow(),
    reader.singletons.architecture.readOrThrow(),
    reader.singletons.process.readOrThrow(),
    reader.singletons.about.readOrThrow(),
    reader.singletons.faq.readOrThrow(),
    reader.singletons.trust.readOrThrow(),
    reader.singletons.cta.readOrThrow(),
  ]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <SiteHeader />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <HeroSection content={hero} />
        <ServicesSection content={services} />
        <DemoShowcase content={demoShowcase} />
        <IndustriesSection content={industries} />
        <OutcomesSection content={outcomes} />
        <ArchitectureSection content={architecture} />
        <ProcessSection content={processContent} />
        <AboutSection content={about} />
        <TrustSection content={trust} />
        <FAQSection content={faq} />
        <CTASection content={cta} />
      </Box>
      <SiteFooter />
    </Box>
  );
}
