"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hodina v milisekundách
const VISIBILITY_TIMEOUT = 60 * 60 * 1000; // 1 hodina v milisekundách

export function useAutoLogout() {
  const router = useRouter();
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hiddenTimeRef = useRef<number | null>(null);

  const handleLogout = useCallback(async () => {
    // Vymaž všetky timery
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (visibilityTimerRef.current) {
      clearTimeout(visibilityTimerRef.current);
    }

    // Vymaž remember me z localStorage
    localStorage.removeItem("rememberMe");

    // Odhláš používateľa
    await signOut();

    // Presmeruj na login stránku
    router.push("/login");
    router.refresh();
  }, [router]);

  // Debounced version to prevent excessive timer resets
  const resetInactivityTimer = useCallback(() => {
    // Vymaž existujúci timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Nastav nový timer
    inactivityTimerRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT);
  }, [handleLogout]);

  // Throttled version - only reset timer every 5 seconds max
  const throttledResetTimer = useRef<NodeJS.Timeout | null>(null);
  const debouncedReset = useCallback(() => {
    if (!throttledResetTimer.current) {
      resetInactivityTimer();
      throttledResetTimer.current = setTimeout(() => {
        throttledResetTimer.current = null;
      }, 5000); // Reset at most once every 5 seconds
    }
  }, [resetInactivityTimer]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Stránka je skrytá - zaznamenaj čas
      hiddenTimeRef.current = Date.now();

      // Nastav timer pre automatické odhlásenie
      visibilityTimerRef.current = setTimeout(() => {
        handleLogout();
      }, VISIBILITY_TIMEOUT);
    } else {
      // Stránka je znovu viditeľná
      if (hiddenTimeRef.current) {
        const hiddenDuration = Date.now() - hiddenTimeRef.current;

        // Ak bola stránka skrytá viac ako hodinu, odhláš
        if (hiddenDuration >= VISIBILITY_TIMEOUT) {
          handleLogout();
          return;
        }

        // Vymaž visibility timer
        if (visibilityTimerRef.current) {
          clearTimeout(visibilityTimerRef.current);
          visibilityTimerRef.current = null;
        }

        hiddenTimeRef.current = null;
      }

      // Resetuj inactivity timer
      resetInactivityTimer();
    }
  }, [handleLogout, resetInactivityTimer]);

  useEffect(() => {
    // Skontroluj či je "remember me" aktívne
    const rememberMe = localStorage.getItem("rememberMe");

    // Ak nie je "remember me" aktívne, aktivuj auto-logout
    if (rememberMe !== "true") {
      // Události pre sledovanie aktivity používateľa - použijeme throttled version
      const events = [
        "mousedown",
        "keypress",
        "scroll",
        "touchstart",
      ];

      // Pridaj event listenery s throttled funkciou
      events.forEach((event) => {
        document.addEventListener(event, debouncedReset);
      });

      // Pridaj listener pre visibility change
      document.addEventListener("visibilitychange", handleVisibilityChange);

      // Inicializuj timer
      resetInactivityTimer();

      // Cleanup funkcia
      return () => {
        events.forEach((event) => {
          document.removeEventListener(event, debouncedReset);
        });
        document.removeEventListener("visibilitychange", handleVisibilityChange);

        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
        if (visibilityTimerRef.current) {
          clearTimeout(visibilityTimerRef.current);
        }
        if (throttledResetTimer.current) {
          clearTimeout(throttledResetTimer.current);
        }
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedReset, handleVisibilityChange]);
}
