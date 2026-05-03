import Box from "@mui/material/Box";
import SiteHeader from "@/components/SiteHeader";
import HeroSection from "@/components/HeroSection";
import DemoShowcase from "@/components/DemoShowcase";
import ArchitectureSection from "@/components/ArchitectureSection";
import TrustSection from "@/components/TrustSection";
import CTASection from "@/components/CTASection";
import SiteFooter from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <SiteHeader />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <HeroSection />
        <DemoShowcase />
        <ArchitectureSection />
        <TrustSection />
        <CTASection />
      </Box>
      <SiteFooter />
    </Box>
  );
}
