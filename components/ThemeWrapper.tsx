"use client";

import { useEffect, useState } from "react";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

function ThemeApplier({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useTheme();

  // Apply dark class immediately when isDarkMode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return <>{children}</>;
}

// Apply dark mode from localStorage immediately to prevent flash
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('darkMode');
  if (stored && JSON.parse(stored)) {
    document.documentElement.classList.add('dark');
  }
}

export default function ThemeWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { user } = await getCurrentUser();
      setUser(user);
      setIsLoading(false);
    };
    loadUser();
  }, []);

  return (
    <ThemeProvider user={user}>
      <ThemeApplier>{children}</ThemeApplier>
    </ThemeProvider>
  );
}
