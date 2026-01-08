import CTA from "@/components/homepage/CTA";
import Features from "@/components/homepage/Features";
import HowItWorks from "@/components/homepage/HowItWorks";
import LandingPage from "@/components/homepage/LandingPage";

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
