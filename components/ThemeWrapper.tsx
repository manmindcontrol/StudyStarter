"use client";

import { useEffect, useState } from "react";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

function ThemeApplier({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useTheme();

  // Apply dark class to html element when isDarkMode changes
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDarkMode) {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return <>{children}</>;
}

export default function ThemeWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { user } = await getCurrentUser();
      setUser(user);
    };
    loadUser();
  }, []);

  return (
    <ThemeProvider user={user}>
      <ThemeApplier>{children}</ThemeApplier>
    </ThemeProvider>
  );
}
