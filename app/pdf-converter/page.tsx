import PdfConverterPage from "@/components/PdfConverterPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to DOCX Konvertor",
  description:
    "Bezplatný online konvertor PDF na DOCX. Premeňte PDF súbory na editovateľné Word dokumenty. | Free online PDF to DOCX converter. | Kostenloser Online-PDF-zu-DOCX-Konverter.",
  keywords: [
    "PDF to DOCX",
    "PDF konvertor",
    "konverzia PDF",
    "PDF converter",
    "PDF zu DOCX",
    "PDF do Word",
  ],
  openGraph: {
    title: "PDF to DOCX Konvertor | StudyStarter",
    description:
      "Bezplatný online konvertor PDF na DOCX. Premeňte PDF súbory na editovateľné Word dokumenty.",
    url: "https://studystarter.io/pdf-converter",
  },
  alternates: {
    canonical: "https://studystarter.io/pdf-converter",
    languages: {
      "sk-SK": "https://studystarter.io/pdf-converter",
      "en-US": "https://studystarter.io/pdf-converter",
      "de-DE": "https://studystarter.io/pdf-converter",
    },
  },
};

export default function PdfConverter() {
  return <PdfConverterPage />;
}
