import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/universal/Navbar";
import Footer from "@/components/universal/Footer";
import CookieConsent from "@/components/legal/CookieConsent";
import CookieSettingsFloatingButton from "@/components/legal/CookieSettingsFloatingButton";
import StructuredData from "./structured-data";
import ThemeWrapper from "@/components/ThemeWrapper";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: {
    default: "Study Starter - AI-Powered Study Helper for Students",
    template: "%s | Study Starter",
  },
  description:
    "Free AI-powered Study Starter for students. Automatic lecture transcription, intelligent study material processing, and test question generation. Study smarter, not harder with AI technology.",
  keywords: [
    "AI Study Starter",
    "study helper",
    "lecture transcription",
    "AI for students",
    "study materials",
    "test preparation",
    "exam preparation",
    "AI learning",
    "study smarter",
    "educational AI",
    "student productivity",
    "automated note-taking",
    "study guide generator",
    "quiz generator",
    "free study tools",
    "AI tutor",
    "learning assistant",
    "academic help",
  ],
  authors: [{ name: "Study Starter Team" }],
  creator: "Study Starter",
  publisher: "Study Starter",
  applicationName: "Study Starter",
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
    locale: "en_US",
    url: "https://studyassistant.app",
    title: "Study Starter - AI-Powered Study Helper for Students",
    description:
      "Free AI-powered Study Starter. Automatic lecture transcription, study material processing, and test generation. Study smarter with AI.",
    siteName: "Study Starter",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Study Starter - AI Study Helper",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Study Starter - AI Study Helper",
    description:
      "Free AI-powered Study Starter for students. Automatic lecture transcription and test generation.",
    images: ["/twitter-image.png"],
    creator: "@studyassistant",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
    ],
  },
  alternates: {
    canonical: "https://studyassistant.app",
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
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
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
        className={`${inter.className} flex flex-col min-h-screen antialiased`}
        suppressHydrationWarning
      >
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
      </body>
    </html>
  );
}
