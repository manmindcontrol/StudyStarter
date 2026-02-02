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

  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split(".");
    let value: unknown = translations[locale];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }

    let result = typeof value === "string" ? value : key;

    // Interpolate parameters like {title}, {name}, etc.
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, "g"), paramValue);
      });
    }

    return result;
  };

  return { t, locale, setLocale };
}
