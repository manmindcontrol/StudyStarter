import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cenník – Bezplatný aj Prémiový plán",
  description:
    "StudyStarter je zadarmo. Prémiový plán odomkne neobmedzený prepis prednášok, generovanie testov a AI poznámky. Začni sa učiť efektívnejšie ešte dnes. | Free & Premium plans.",
  keywords: [
    "bezplatná AI aplikácia pre študentov",
    "free AI study app",
    "AI učenie zadarmo",
    "prémiový plán pre študentov",
    "student AI subscription",
    "cenník AI nástroja",
    "lacná AI pomôcka",
    "AI app for students free",
    "study app pricing",
    "KI Lernapp kostenlos",
    "KI Lernhilfe Preis",
  ],
  openGraph: {
    title: "Cenník – Bezplatný aj Prémiový plán | StudyStarter",
    description:
      "Bezplatný plán pre každého študenta. Prémiový plán pre neobmedzený prepis prednášok, generovanie testov a AI poznámky.",
    url: "https://studystarter.io/pricing",
  },
  alternates: {
    canonical: "https://studystarter.io/pricing",
    languages: {
      "sk-SK": "https://studystarter.io/pricing",
      "en-US": "https://studystarter.io/pricing",
      "de-DE": "https://studystarter.io/pricing",
    },
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
