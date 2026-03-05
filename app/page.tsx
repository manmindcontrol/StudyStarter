import type { Metadata } from "next";
import CTA from "@/components/homepage/CTA";
import Features from "@/components/homepage/Features";
import HowItWorks from "@/components/homepage/HowItWorks";
import LandingPage from "@/components/homepage/LandingPage";

export const metadata: Metadata = {
  title: {
    absolute:
      "StudyStarter – AI pomôcka pre študentov | Prepis prednášok, Testové otázky, Poznámky",
  },
  description:
    "Uč sa efektívnejšie s AI. StudyStarter automaticky prepíše prednášky, vygeneruje testové otázky a poznámky. Bezplatná AI pomôcka pre študentov | Free AI study tool | KI Lernhilfe.",
  keywords: [
    // Slovenské – vysoký objem
    "ako sa učiť",
    "ako sa efektívne učiť",
    "efektívne učenie",
    "príprava na skúšky",
    "tipy na učenie",
    "ako sa rýchlo naučiť látku",
    "pomoc so štúdiom",
    "AI pre študentov",
    "AI asistent pre školu",
    "prepis prednášok",
    "automatický prepis",
    "generátor testových otázok",
    "generátor poznámok",
    "študijné materiály",
    "poznámky z prednášok",
    "učenie s AI",
    "AI na učenie",
    "bezplatná AI aplikácia",
    // Anglické – vysoký objem
    "how to study effectively",
    "AI study tool",
    "free AI study app",
    "lecture transcription",
    "automatic lecture notes",
    "study notes generator",
    "AI note taker",
    "exam preparation app",
    "test question generator",
    "study smarter not harder",
    "AI for students",
    "student AI assistant",
    "best study app",
    "study helper",
    // Nemecké
    "effektiv lernen",
    "KI Lernhilfe",
    "KI für Studenten",
    "Vorlesungstranskription",
    "automatische Mitschrift",
    "Testfragen Generator",
    "Prüfungsvorbereitung App",
    "Lernhilfe KI kostenlos",
  ],
  openGraph: {
    title:
      "StudyStarter – AI pomôcka pre študentov | Prepis prednášok & Testové otázky",
    description:
      "Uč sa efektívnejšie s AI. Automatický prepis prednášok, generovanie testových otázok a poznámok. Bezplatná pomôcka pre každého študenta.",
    url: "https://studystarter.io",
  },
  alternates: {
    canonical: "https://studystarter.io",
    languages: {
      "sk-SK": "https://studystarter.io",
      "en-US": "https://studystarter.io",
      "de-DE": "https://studystarter.io",
    },
  },
};

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
