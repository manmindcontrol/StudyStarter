import RegisterPage from "@/components/authentification/RegisterPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrácia – Začni sa učiť s AI zadarmo",
  description:
    "Vytvor si bezplatný účet a začni sa učiť efektívnejšie. AI prepis prednášok, generátor testových otázok a poznámok. Bez kreditnej karty. | Sign up free | Kostenlos registrieren.",
  keywords: [
    "registrácia zadarmo",
    "bezplatný účet",
    "AI pre študentov zadarmo",
    "sign up free study app",
    "AI study tool free signup",
    "create student account",
    "kostenlos registrieren Lernapp",
    "bezplatná pomôcka na učenie",
  ],
  openGraph: {
    title: "Registrácia – Začni sa učiť s AI zadarmo | StudyStarter",
    description:
      "Zaregistruj sa zadarmo a získaj AI prepis prednášok, generátor testov a poznámky. Bez kreditnej karty.",
    url: "https://studystarter.io/register",
  },
  alternates: {
    canonical: "https://studystarter.io/register",
    languages: {
      "sk-SK": "https://studystarter.io/register",
      "en-US": "https://studystarter.io/register",
      "de-DE": "https://studystarter.io/register",
    },
  },
};

export default function Page() {
  return <RegisterPage />;
}
