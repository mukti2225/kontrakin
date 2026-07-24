import Image from "next/image";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import HowItWorks from "@/components/sections/HowItWorks";
import DashboardPreview from "@/components/sections/DashboardPreview";
import Pricing from "@/components/sections/Pricing";
import Cta from "@/components/sections/Cta";

export default function HomePage() {
  return (
    <main className="overflow-x-hidden">
      <Hero />
      <Features />
      <HowItWorks />
      <DashboardPreview />
      <Pricing />
      <Cta />
    </main>
  );
}
