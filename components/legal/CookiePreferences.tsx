"use client";

import { useState, useEffect } from "react";
import {
  X,
  Cookie,
  Shield,
  BarChart3,
  Settings as SettingsIcon,
  Check,
} from "lucide-react";

interface CookiePreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CookieSettings {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookiePreferences({
  isOpen,
  onClose,
}: CookiePreferencesProps) {
  const [settings, setSettings] = useState<CookieSettings>(() => {
    const defaultSettings = {
      necessary: true, // Always true, can't be disabled
      functional: false,
      analytics: false,
      marketing: false,
    };
    // Only access localStorage on client
    if (typeof window === "undefined") return defaultSettings;
    try {
      const saved = localStorage.getItem("cookiePreferences");
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to parse cookie preferences", e);
    }
    return defaultSettings;
  });

  const [mounted, setMounted] = useState(false);

  // Hydration guard - must use effect to avoid SSR mismatch
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const handleToggle = (key: keyof CookieSettings) => {
    if (key === "necessary") return; // Can't toggle necessary cookies
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSavePreferences = () => {
    localStorage.setItem("cookiePreferences", JSON.stringify(settings));
    localStorage.setItem("cookieConsent", "customized");
    onClose();
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setSettings(allAccepted);
    localStorage.setItem("cookiePreferences", JSON.stringify(allAccepted));
    localStorage.setItem("cookieConsent", "accepted");
    onClose();
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    setSettings(onlyNecessary);
    localStorage.setItem("cookiePreferences", JSON.stringify(onlyNecessary));
    localStorage.setItem("cookieConsent", "declined");
    onClose();
  };

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh]  overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-linear-to-r from-blue-600 to-sky-500 text-white py-4 px-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Cookie className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold">
                  Cookie Preferences
                </h2>
                <p className="text-blue-100 text-sm">
                  Manage your privacy settings
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-gray-600 text-sm leading-relaxed">
            We use cookies to enhance your browsing experience, serve
            personalized content, and analyze our traffic. You can customize
            your cookie preferences below.
          </p>

          {/* Necessary Cookies */}
          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="bg-blue-100 p-2 rounded-lg mt-1">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Necessary Cookies
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    These cookies are essential for the website to function
                    properly. They enable basic functions like page navigation,
                    access to secure areas, and remembering your cookie
                    preferences. The website cannot function properly without
                    these cookies.
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="relative inline-block w-12 h-6 bg-blue-600 rounded-full cursor-not-allowed opacity-60">
                  <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 transform translate-x-6" />
                </div>
              </div>
            </div>
            <div className="mt-3 ml-12">
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                Always Active
              </span>
            </div>
          </div>

          {/* Functional Cookies */}
          <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors duration-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="bg-purple-100 p-2 rounded-lg mt-1">
                  <SettingsIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Functional Cookies
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    These cookies enable enhanced functionality and
                    personalization, such as remembering your preferences,
                    language settings, and customized features. They may be set
                    by us or by third-party providers.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle("functional")}
                className="flex items-center cursor-pointer"
                aria-label="Toggle functional cookies"
              >
                <div
                  className={`relative inline-block w-12 h-6 rounded-full transition-colors duration-200 ${
                    settings.functional ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                      settings.functional ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>

          {/* Analytics Cookies */}
          <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors duration-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="bg-green-100 p-2 rounded-lg mt-1">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Analytics Cookies
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    These cookies help us understand how visitors interact with
                    our website by collecting and reporting information
                    anonymously. This helps us improve our website and provide
                    better services.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle("analytics")}
                className="flex items-center cursor-pointer"
                aria-label="Toggle analytics cookies"
              >
                <div
                  className={`relative inline-block w-12 h-6 rounded-full transition-colors duration-200 ${
                    settings.analytics ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                      settings.analytics ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>

          {/* Marketing Cookies */}
          <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors duration-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="bg-orange-100 p-2 rounded-lg mt-1">
                  <svg
                    className="w-5 h-5 text-orange-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Marketing Cookies
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    These cookies are used to track visitors across websites to
                    display relevant advertisements. They help measure
                    advertising campaign effectiveness and limit the number of
                    times you see an advertisement.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle("marketing")}
                className="flex items-center cursor-pointer"
                aria-label="Toggle marketing cookies"
              >
                <div
                  className={`relative inline-block w-12 h-6 rounded-full transition-colors duration-200 ${
                    settings.marketing ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                      settings.marketing ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl">
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRejectAll}
              className="flex-1 p-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-white hover:border-gray-400 transition-all duration-200 cursor-pointer"
            >
              Reject All
            </button>
            <button
              onClick={handleSavePreferences}
              className="flex-1 p-2 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5" />
              Save Preferences
            </button>
            <button
              onClick={handleAcceptAll}
              className="flex-1 p-2 bg-linear-to-r from-blue-600 to-sky-500 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Check className="w-5 h-5" />
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
