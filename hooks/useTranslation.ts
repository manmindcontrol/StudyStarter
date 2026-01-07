"use client";

import { useState, useEffect } from "react";
import enTranslations from "@/locales/en.json";
import skTranslations from "@/locales/sk.json";

const translations = {
  en: enTranslations,
  sk: skTranslations,
};

type Locale = "en" | "sk";

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem("preferredLanguage") as Locale;
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "sk")) {
      setLocaleState(savedLanguage);
    }

    // Listen for language change events
    const handleLanguageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ locale: Locale }>;
      setLocaleState(customEvent.detail.locale);
    };

    window.addEventListener("languageChange", handleLanguageChange);

    return () => {
      window.removeEventListener("languageChange", handleLanguageChange);
    };
  }, []);

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: unknown = translations[locale];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }

    return typeof value === "string" ? value : key;
  };

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("preferredLanguage", newLocale);

    // Dispatch custom event for other components
    window.dispatchEvent(
      new CustomEvent("languageChange", { detail: { locale: newLocale } })
    );
  };

  return { t, locale, setLocale };
}
