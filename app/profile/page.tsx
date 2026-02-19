import ProfilePage from "@/components/ProfilePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil",
  description: "Správa vášho účtu a nastavení na StudyStarter.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ProfilePage />;
}
