"use client";

import { useState, useEffect } from "react";
import { Cookie } from "lucide-react";
import CookiePreferences from "./CookiePreferences";

export default function CookieSettingsFloatingButton() {
  const [showPreferences, setShowPreferences] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has given consent
    const consent = localStorage.getItem("cookieConsent");
    setHasConsent(!!consent);
  }, []);

  // Don't show button if user hasn't interacted with cookies yet
  if (!mounted || !hasConsent) return null;

  return (
    <>
      <button
        onClick={() => setShowPreferences(true)}
        className="fixed bottom-6 right-6 z-50 bg-linear-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110 group"
        aria-label="Cookie Settings"
        title="Manage Cookie Preferences"
      >
        <Cookie className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
      </button>

      <CookiePreferences
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </>
  );
}
