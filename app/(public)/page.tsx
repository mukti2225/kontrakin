import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import HowItWorks from "@/components/sections/HowItWorks";
import WhyChoose from "@/components/sections/WhyChoose";
import TrustedBy from "@/components/sections/TrustedBy";
import Cta from "@/components/sections/Cta";

export default function HomePage() {
  return (
    <main className="overflow-x-hidden">
      <Hero />
      <WhyChoose />
      <Features />
      <HowItWorks />
      <TrustedBy />
      <Cta />
    </main>
  );
}
