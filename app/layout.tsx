import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/universal/Navbar";
import Footer from "@/components/universal/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Študijný Asistent - AI pomocník pre efektívne štúdium",
  description:
    "Inteligentný asistent pre automatický zápis prednášok, spracovanie študijných materiálov a generovanie testových otázok. Študuj efektívnejšie s pomocou AI.",
  keywords: [
    "štúdium",
    "AI",
    "prednášky",
    "testy",
    "študijné materiály",
    "učenie",
  ],
  authors: [{ name: "Študijný Asistent" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sk" className="scroll-smooth">
      <body
        className={`${inter.className} flex flex-col min-h-screen antialiased`}
      >
        {/* Navbar - zobrazuje sa na všetkých stránkach */}
        <Navbar />

        {/* Hlavný obsah stránky */}
        <main className="grow">{children}</main>

        {/* Footer - zobrazuje sa na všetkých stránkach */}
        <Footer />
      </body>
    </html>
  );
}
