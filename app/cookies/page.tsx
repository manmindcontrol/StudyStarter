import CookiePolicyPage from "@/components/legal/CookiePolicyPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zásady cookies",
  description:
    "Zásady používania cookies na StudyStarter. Zistite, ako používame cookies a podobné technológie. | Cookie Policy | Cookie-Richtlinie.",
  alternates: {
    canonical: "https://studystarter.io/cookies",
    languages: {
      "sk-SK": "https://studystarter.io/cookies",
      "en-US": "https://studystarter.io/cookies",
      "de-DE": "https://studystarter.io/cookies",
    },
  },
};

export default CookiePolicyPage;
