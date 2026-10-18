import Hero from "@/components/sections/Hero";
import TrustedBy from "@/components/sections/TrustedBy";
import Features from "@/components/sections/Features";
import AiBusinessModel from "@/components/sections/AiBusinessModel";
import DigitalExperience from "@/components/sections/DigitalExperience";
import FaqSection from "@/components/sections/FaqSection";
import Testimonials from "@/components/sections/Testimonials";
import Cta from "@/components/sections/Cta";

export default function HomePage() {
  return (
    <div className="overflow-x-hidden bg-white text-neutral-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Hero Section matching reference top left */}
      <Hero />

      {/* 2. Partners / Integration strip matching reference */}
      <TrustedBy />

      {/* 3. Integration to control payment and more (3-card grid + split cards) */}
      <Features />

      {/* 4. Business model built with AI (accordion + preview card) */}
      <AiBusinessModel />

      {/* 5. Digital Experience & Big stats numbers + lifestyle card */}
      <DigitalExperience />

      {/* 6. Control bills & Learn / Numbered FAQ with photo */}
      <FaqSection />

      {/* 7. Testimonials: Don't take our word for it */}
      <Testimonials />

      {/* 8. Modern Call-to-action */}
      <Cta />
    </div>
  );
}
