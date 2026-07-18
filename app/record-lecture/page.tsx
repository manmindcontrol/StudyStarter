"use client";

// Real-time lecture recording is TEMPORARILY DISABLED.
// To re-enable: restore the commented code below (and remove the redirect),
// then re-enable the entry points in app/upload-lecture/page.tsx and
// components/DashboardPage.tsx, and the shortcut in public/manifest.json.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
// import { useState } from "react";
// import { getCurrentUser } from "@/lib/auth";
// import RecordLecture from "@/components/RecordLecture";

export default function RecordLecturePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/upload-lecture");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  /* ORIGINAL IMPLEMENTATION — restore when recording is re-enabled:

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { user } = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setIsAuthenticated(true);
    };
    checkAuth();
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <RecordLecture />;
  */
}
