"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export type Locale = "en" | "sk";

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({
  children,
  user
}: {
  children: ReactNode;
  user: User | null;
}) {
  // Always start with default to match server-side rendering
  const [locale, setLocaleState] = useState<Locale>('en');

  // Load language preference after mount
  useEffect(() => {
    const loadLanguagePreference = async () => {
      if (user) {
        // For logged-in users, load from database
        const { data, error } = await supabase
          .from("user_profiles")
          .select("preferred_language")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error('[LanguageContext] Error loading language from database:', error);
        }

        if (data?.preferred_language && (data.preferred_language === 'en' || data.preferred_language === 'sk')) {
          setLocaleState(data.preferred_language as Locale);
          localStorage.setItem('preferredLanguage', data.preferred_language);
        }
      } else {
        // For guests, load from localStorage
        const stored = localStorage.getItem('preferredLanguage') as Locale;
        if (stored && (stored === 'en' || stored === 'sk')) {
          setLocaleState(stored);
        }
      }
    };

    loadLanguagePreference();
  }, [user]);

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale);

    // Save to localStorage immediately
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', newLocale);
    }

    // Dispatch custom event for backwards compatibility with existing components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent("languageChange", { detail: { locale: newLocale } })
      );
    }

    // Save to database - get current user from session
    try {
      const { data: { user: sessionUser } } = await supabase.auth.getUser();

      if (sessionUser) {
        const { error } = await supabase
          .from("user_profiles")
          .update({ preferred_language: newLocale })
          .eq("id", sessionUser.id);

        if (error) {
          console.error('[LanguageContext] Error saving language:', error);
        }
      }
    } catch (err) {
      console.error('[LanguageContext] Exception while saving language:', err);
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
