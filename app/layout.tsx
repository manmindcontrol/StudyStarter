import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/universal/Navbar";
import Footer from "@/components/universal/Footer";
import CookieConsent from "@/components/legal/CookieConsent";
import CookieSettingsFloatingButton from "@/components/legal/CookieSettingsFloatingButton";
import StructuredData from "./structured-data";
import ThemeWrapper from "@/components/ThemeWrapper";
import { GoogleAnalytics } from "@next/third-parties/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  ),
  title: {
    default: "StudyStarter - Ako sa efektívne učiť | AI pomôcka pre študentov",
    template: "%s | StudyStarter",
  },
  description:
    "Ako sa učiť efektívne? StudyStarter je bezplatná AI aplikácia pre študentov. Automatický prepis prednášok, generovanie testových otázok a študijných materiálov. Učte sa rýchlejšie s umelou inteligenciou.",
  keywords: [
    // Slovenské kľúčové slová (priorita)
    "ako sa učiť",
    "ako sa efektívne učiť",
    "tipy na učenie",
    "efektívne učenie",
    "ako sa naučiť rýchlo",
    "generátor testov",
    "testové otázky",
    "študijné materiály",
    "prepis prednášok",
    "AI pre študentov",
    "príprava na skúšky",
    "učenie s AI",
    "študijný pomocník",
    "poznámky z prednášok",
    // Anglické kľúčové slová
    "AI study helper",
    "lecture transcription",
    "test question generator",
    "study materials",
    "exam preparation",
    "AI learning",
    "study smarter",
    "educational AI",
    // Nemecké kľúčové slová
    "effektiv lernen",
    "KI Lernhilfe",
    "Vorlesungstranskription",
    "Testfragen Generator",
    "Studienmaterialien",
    "Prüfungsvorbereitung",
    "KI für Studenten",
  ],
  authors: [{ name: "StudyStarter Team" }],
  creator: "StudyStarter",
  publisher: "StudyStarter",
  applicationName: "StudyStarter",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "sk_SK",
    alternateLocale: ["en_US", "de_DE"],
    url: "https://studystarter.io",
    title: "StudyStarter - Ako sa efektívne učiť | AI pre študentov",
    description:
      "Ako sa učiť efektívne? Bezplatná AI aplikácia pre študentov. Prepis prednášok, generovanie testov a študijných materiálov.",
    siteName: "StudyStarter",
    images: [
      {
        url: "/logo.webp",
        width: 1200,
        height: 630,
        alt: "StudyStarter - AI pomôcka pre efektívne učenie",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyStarter - Ako sa efektívne učiť",
    description:
      "Bezplatná AI aplikácia pre študentov. Prepis prednášok, generovanie testov a študijných materiálov.",
    images: ["/logo.webp"],
    creator: "@studystarter",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.ico" }],
  },
  alternates: {
    canonical: "https://studystarter.io",
    languages: {
      "sk-SK": "https://studystarter.io",
      "en-US": "https://studystarter.io",
      "de-DE": "https://studystarter.io",
    },
  },
  category: "education",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#1e40af" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="sk"
      className="scroll-smooth"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <StructuredData />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // By default, start in light mode
                // Dark mode will be applied after user authentication if needed
                try {
                  document.documentElement.classList.remove('dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.className} ${sora.variable} relative flex flex-col min-h-screen antialiased bg-linear-to-r from-slate-900 to-slate-700 overflow-x-hidden`}
        suppressHydrationWarning
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 z-[-1] opacity-30 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />

        <ThemeWrapper>
          {/* Navbar - displayed on all pages */}
          <Navbar />

          {/* Main page content */}
          <main className="grow">{children}</main>

          {/* Footer - displayed on all pages */}
          <Footer />

          {/* Cookie Consent Banner */}
          <CookieConsent />

          {/* Floating Cookie Settings Button */}
          <CookieSettingsFloatingButton />
        </ThemeWrapper>
        {/* Google Analytics */}
        <GoogleAnalytics gaId="G-XMXGNQ709X" />
      </body>
    </html>
  );
}
