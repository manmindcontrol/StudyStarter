import CTA from "@/components/CTA";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import LandingPage from "@/components/LandingPage";

export default function Home() {
  return (
    <>
      {" "}
      <LandingPage />
      <Features />
      <HowItWorks />
      <CTA />
    </>
  );
}
