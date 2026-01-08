"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import enTranslations from "@/locales/en.json";
import skTranslations from "@/locales/sk.json";
import deTranslations from "@/locales/de.json";

const translations = {
  en: enTranslations,
  sk: skTranslations,
  de: deTranslations,
};

export function useTranslation() {
  const { locale, setLocale } = useLanguage();

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

  return { t, locale, setLocale };
}
