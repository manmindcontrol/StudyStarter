import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cenník",
  description:
    "Vyberte si plán, ktorý vám vyhovuje. StudyStarter ponúka bezplatný aj prémiový plán pre efektívnejšie učenie s AI. | Pricing plans | Preisübersicht.",
  openGraph: {
    title: "Cenník | StudyStarter",
    description:
      "Bezplatný aj prémiový plán pre študentov. Prepis prednášok, generovanie testov a AI študijný asistent.",
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
