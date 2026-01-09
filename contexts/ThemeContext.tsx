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
  // Always default to light mode (false)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load dark mode preference from user profile ONLY when user is logged in
  useEffect(() => {
    const loadDarkModePreference = async () => {
      if (user) {
        // User is logged in - load their preference from database
        const { data, error } = await supabase
          .from("user_profiles")
          .select("dark_mode")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error('[ThemeContext] Error loading dark mode from database:', error);
        }

        if (data?.dark_mode !== undefined) {
          setIsDarkMode(data.dark_mode);
          if (typeof window !== 'undefined') {
            localStorage.setItem('darkMode', JSON.stringify(data.dark_mode));
          }
        }
      } else {
        // No user logged in - force light mode and clear localStorage
        setIsDarkMode(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('darkMode');
        }
      }
    };

    loadDarkModePreference();
  }, [user]);

  const toggleDarkMode = async () => {
    // Get current user from session
    const { data: { user: sessionUser } } = await supabase.auth.getUser();

    // Only allow toggling if user is logged in
    if (!sessionUser) {
      console.warn('[ThemeContext] Cannot toggle dark mode - user not logged in');
      return;
    }

    const newValue = !isDarkMode;
    setIsDarkMode(newValue);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(newValue));
    }

    // Save to database
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ dark_mode: newValue })
        .eq("id", sessionUser.id);

      if (error) {
        console.error('[ThemeContext] Error saving dark mode:', error);
      }
    } catch (err) {
      console.error('[ThemeContext] Exception while saving dark mode:', err);
    }
  };

  const setDarkMode = async (value: boolean) => {
    // Only allow setting dark mode if user is logged in
    if (!user) {
      console.warn('[ThemeContext] Cannot set dark mode - user not logged in');
      return;
    }

    setIsDarkMode(value);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(value));
    }

    // Save to database
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ dark_mode: value })
        .eq("id", user.id);

      if (error) {
        console.error('[ThemeContext] Error saving dark mode:', error);
      }
    } catch (err) {
      console.error('[ThemeContext] Exception while saving dark mode:', err);
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
