import ComingSoon from "@/components/landing/ComingSoon";
import TrustBar from "@/components/landing/TrustBar";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <main>
      <ComingSoon />
      <TrustBar />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </main>
  );
}
