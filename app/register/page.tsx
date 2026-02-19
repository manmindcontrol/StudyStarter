import RegisterPage from "@/components/authentification/RegisterPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrácia",
  description:
    "Vytvorte si bezplatný účet na StudyStarter. AI pomôcka pre študentov – prepis prednášok, generovanie testových otázok a študijných materiálov. | Create a free account | Kostenloses Konto erstellen.",
  openGraph: {
    title: "Registrácia | StudyStarter",
    description:
      "Zaregistrujte sa zadarmo a začnite sa učiť efektívnejšie s AI.",
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
