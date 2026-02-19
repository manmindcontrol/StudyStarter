import { Suspense } from "react";
import DashboardPage from "@/components/DashboardPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Váš študijný prehľad – prednášky, materiály a testy na jednom mieste.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <DashboardPage />
    </Suspense>
  );
}
