"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type ThemeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  user
}: {
  children: ReactNode;
  user: User | null;
}) {
  // Initialize from localStorage to prevent flash
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('darkMode');
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });

  // Load dark mode preference from user profile
  useEffect(() => {
    const loadDarkModePreference = async () => {
      if (user) {
        const { data } = await supabase
          .from("user_profiles")
          .select("dark_mode")
          .eq("id", user.id)
          .single();

        if (data?.dark_mode !== undefined) {
          setIsDarkMode(data.dark_mode);
          localStorage.setItem('darkMode', JSON.stringify(data.dark_mode));
        }
      } else {
        // If no user, load from localStorage only
        const stored = localStorage.getItem('darkMode');
        if (stored !== null) {
          setIsDarkMode(JSON.parse(stored));
        }
      }
    };

    loadDarkModePreference();
  }, [user]);

  const toggleDarkMode = async () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);

    // Save to localStorage immediately
    localStorage.setItem('darkMode', JSON.stringify(newValue));

    // Save to database if user is logged in
    if (user) {
      await supabase
        .from("user_profiles")
        .update({ dark_mode: newValue })
        .eq("id", user.id);
    }
  };

  const setDarkMode = async (value: boolean) => {
    setIsDarkMode(value);

    // Save to localStorage immediately
    localStorage.setItem('darkMode', JSON.stringify(value));

    // Save to database if user is logged in
    if (user) {
      await supabase
        .from("user_profiles")
        .update({ dark_mode: value })
        .eq("id", user.id);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
