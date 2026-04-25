import { Navigation } from "./Navigation";
import { HeroSection } from "./HeroSection";
import { TrustedBySection } from "./TrustedBySection";
import { ProductsSection } from "./ProductsSection";
import { PipelineSection } from "./PipelineSection";
import { PlatformSection } from "./PlatformSection";
import { FeaturesSection } from "./FeaturesSection";
import { ConsolidatorsSection } from "./ConsolidatorsSection";
import { RegulatedSection } from "./RegulatedSection";
import { FooterSection } from "./FooterSection";

export function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <HeroSection />
        <TrustedBySection />
        <ProductsSection />
        <PipelineSection />
        <PlatformSection />
        <FeaturesSection />
        <ConsolidatorsSection />
        <RegulatedSection />
      </main>
      <FooterSection />
    </div>
  );
}
