import LoginPage from "@/components/authentification/LoginPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prihlásenie",
  description:
    "Prihláste sa do StudyStarter a začnite sa učiť efektívnejšie. Prístup k AI prepisu prednášok, generovaniu testov a študijným materiálom. | Sign in | Anmelden.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <LoginPage />;
}
