import ContactPage from "@/components/ContactPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontaktujte nás v prípade otázok alebo technických problémov. Sme tu, aby sme vám pomohli. | Contact us for questions or technical issues. | Kontaktieren Sie uns bei Fragen oder technischen Problemen.",
  openGraph: {
    title: "Kontakt | StudyStarter",
    description:
      "Kontaktujte nás v prípade otázok alebo technických problémov.",
    url: "https://studystarter.io/contact",
  },
  alternates: {
    canonical: "https://studystarter.io/contact",
    languages: {
      "sk-SK": "https://studystarter.io/contact",
      "en-US": "https://studystarter.io/contact",
      "de-DE": "https://studystarter.io/contact",
    },
  },
};

export default ContactPage;
