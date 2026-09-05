'use client';

import { SiteHeader } from '@/components/SiteHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { ValuePropositionSection } from '@/components/landing/ValuePropositionSection';
import { AiEmployeesSection } from '@/components/landing/AiEmployeesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { ProductShowcaseSection } from '@/components/landing/ProductShowcaseSection';
import { AiInActionSection } from '@/components/landing/AiInActionSection';
import { OmnichannelSection } from '@/components/landing/OmnichannelSection';
import { AutomationSection } from '@/components/landing/AutomationSection';
import { IntegrationSection } from '@/components/landing/IntegrationSection';
import { UseCasesSection } from '@/components/landing/UseCasesSection';
import { BusinessImpactSection } from '@/components/landing/BusinessImpactSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { CapabilitiesSection } from '@/components/landing/CapabilitiesSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { FinalCtaSection } from '@/components/landing/FinalCtaSection';
import { SiteFooter } from '@/components/landing/SiteFooter';

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <TrustSection />
        <ProblemSection />
        <ValuePropositionSection />
        <AiEmployeesSection />
        <HowItWorksSection />
        <ProductShowcaseSection />
        <AiInActionSection />
        <OmnichannelSection />
        <AutomationSection />
        <IntegrationSection />
        <UseCasesSection />
        <BusinessImpactSection />
        <FeaturesSection />
        <PricingSection />
        <CapabilitiesSection />
        <FaqSection />
        <FinalCtaSection />
        <SiteFooter />
      </main>
    </>
  );
}
