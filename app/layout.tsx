import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/universal/Navbar";
import Footer from "@/components/universal/Footer";
import CookieConsent from "@/components/CookieConsent";
import CookieSettingsFloatingButton from "@/components/CookieSettingsFloatingButton";
import StructuredData from "./structured-data";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Study Assistant - AI-Powered Study Helper for Students",
    template: "%s | Study Assistant",
  },
  description:
    "Free AI-powered study assistant for students. Automatic lecture transcription, intelligent study material processing, and test question generation. Study smarter, not harder with AI technology.",
  keywords: [
    "AI study assistant",
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
  authors: [{ name: "Study Assistant Team" }],
  creator: "Study Assistant",
  publisher: "Study Assistant",
  applicationName: "Study Assistant",
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
    title: "Study Assistant - AI-Powered Study Helper for Students",
    description:
      "Free AI-powered study assistant. Automatic lecture transcription, study material processing, and test generation. Study smarter with AI.",
    siteName: "Study Assistant",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Study Assistant - AI Study Helper",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Study Assistant - AI Study Helper",
    description:
      "Free AI-powered study assistant for students. Automatic lecture transcription and test generation.",
    images: ["/twitter-image.png"],
    creator: "@studyassistant",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
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
    <html lang="en" className="scroll-smooth">
      <head>
        <StructuredData />
      </head>
      <body
        className={`${inter.className} flex flex-col min-h-screen antialiased`}
      >
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
      </body>
    </html>
  );
}
