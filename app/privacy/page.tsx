import PrivacyPolicyPage from "@/components/legal/PrivacyPolicyPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ochrana súkromia",
  description:
    "Zásady ochrany osobných údajov StudyStarter. Prečítajte si, ako zhromažďujeme, používame a chránime vaše osobné údaje. | Privacy Policy | Datenschutzerklärung.",
  alternates: {
    canonical: "https://studystarter.io/privacy",
    languages: {
      "sk-SK": "https://studystarter.io/privacy",
      "en-US": "https://studystarter.io/privacy",
      "de-DE": "https://studystarter.io/privacy",
    },
  },
};

export default PrivacyPolicyPage;
