import TermsOfUsePage from "@/components/legal/TermsOfUsePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Podmienky používania",
  description:
    "Podmienky používania StudyStarter. Prečítajte si pravidlá a podmienky pre používanie našej služby. | Terms of Use | Nutzungsbedingungen.",
  alternates: {
    canonical: "https://studystarter.io/terms",
    languages: {
      "sk-SK": "https://studystarter.io/terms",
      "en-US": "https://studystarter.io/terms",
      "de-DE": "https://studystarter.io/terms",
    },
  },
};

export default TermsOfUsePage;
