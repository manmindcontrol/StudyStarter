"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X, Check, Settings } from "lucide-react";
import CookiePreferences from "./CookiePreferences";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has already given consent
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    closeWithAnimation();
  };

  const handleDecline = () => {
    localStorage.setItem("cookieConsent", "declined");
    closeWithAnimation();
  };

  const handleOpenPreferences = () => {
    setShowPreferences(true);
  };

  const handleClosePreferences = () => {
    setShowPreferences(false);
    // Check if user made a choice in preferences
    const consent = localStorage.getItem("cookieConsent");
    if (consent) {
      closeWithAnimation();
    }
  };

  const closeWithAnimation = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowBanner(false);
      setIsClosing(false);
    }, 300);
  };

  // Don't render on server or before checking localStorage
  if (!mounted) return null;

  return (
    <>
      {showBanner && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ${
            isClosing ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          {/* Backdrop blur */}
          <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent pointer-events-none" />

          <div className="relative bg-linear-to-br from-white via-blue-50/50 to-purple-50/50 backdrop-blur-xl border-t-4 border-blue-500 shadow-2xl">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                {/* Icon and Text */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="shrink-0">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                      <div className="relative bg-linear-to-br from-blue-500 to-blue-600 p-3 rounded-2xl shadow-lg">
                        <Cookie className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      We value your privacy
                      <span className="text-2xl">🍪</span>
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      We use cookies and similar technologies to enhance your
                      experience, personalize content, and analyze our traffic. By
                      clicking &quot;Accept All&quot;, you consent to our use of
                      cookies.
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <button
                        onClick={handleOpenPreferences}
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 group"
                      >
                        <Settings className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200" />
                        Manage Preferences
                      </button>
                      <Link
                        href="/cookies"
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 group"
                      >
                        <Cookie className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-200" />
                        Cookie Policy
                      </Link>
                      <Link
                        href="/privacy"
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 group"
                      >
                        <svg
                          className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Privacy Policy
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleDecline}
                    className="group px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-white/80 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Decline</span>
                  </button>
                  <button
                    onClick={handleAccept}
                    className="group px-8 py-3 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Check className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                    <span>Accept All</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Preferences Modal */}
      <CookiePreferences isOpen={showPreferences} onClose={handleClosePreferences} />
    </>
  );
}
