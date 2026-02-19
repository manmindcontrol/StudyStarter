import MaterialsPage from "@/components/MaterialsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Materiály",
  description:
    "Prehľad vašich študijných materiálov – nahrané prednášky, vygenerované poznámky a testové otázky.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MaterialsPage />;
}
