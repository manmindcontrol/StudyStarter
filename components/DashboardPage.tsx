"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  FileText,
  Mic,
  Brain,
  Plus,
  TrendingUp,
  Menu,
  StickyNote,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import Sidebar from "@/components/Sidebar";

type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  created_at: string;
};

type Stats = {
  materialsCount: number;
  lecturesCount: number;
  testsCount: number;
  notesCount: number;
};

type Material = {
  id: string;
  title: string;
  created_at: string;
};

type Lecture = {
  id: string;
  title: string;
  duration: number;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();

  // Enable automatic logout on inactivity
  useAutoLogout();

  // undefined = loading, null = not logged in, User = logged in
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats>({
    materialsCount: 0,
    lecturesCount: 0,
    testsCount: 0,
    notesCount: 0,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      // 1) Get user and profile
      const { user, profile } = await getCurrentUser();

      if (!user) {
        // Not logged in → redirect
        router.push("/login");
        return;
      }

      if (!isMounted) return;

      setUser(user);
      setProfile(profile);

      // 2) Fetch statistics in parallel
      const [
        { count: materialsCount },
        { count: lecturesCount },
        { count: testsCount },
        { count: notesCount },
      ] = await Promise.all([
        supabase
          .from("materials")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("lectures")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("generated_questions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("study_notes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      if (!isMounted) return;

      setStats({
        materialsCount: materialsCount || 0,
        lecturesCount: lecturesCount || 0,
        testsCount: testsCount || 0,
        notesCount: notesCount || 0,
      });
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const loading = user === undefined;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const displayName =
    profile?.display_name || profile?.full_name?.split(" ")[0] || "Student";

  return (
    <div className="flex min-h-screen bg-linear-to-br from-blue-50 via-gray-100 to-cyan-50">
      {/* Sidebar */}
      {user && (
        <Sidebar
          userId={user.id}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 py-8 px-4 md:px-6 lg:px-8 min-h-screen">
        <div className="container-custom max-w-7xl mx-auto relative">
          {/* Header with menu button */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-white/50 rounded-lg transition-colors"
                aria-label="Open sidebar"
              >
                <Menu className="w-6 h-6 text-slate-800" />
              </button>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800">
                Hello, {displayName}! 👋
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600 ml-0 lg:ml-0">
              Welcome back to Study Assistant
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {/* Materials */}
            <div className="bg-linear-to-br from-white via-blue-100/70 to-white border border-white/20 rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">
                {stats.materialsCount}
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Uploaded Materials
              </p>
            </div>

            {/* Lectures */}
            <div className="bg-linear-to-br from-white via-green-100/50 to-white  border border-white/20 rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
                  <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">
                {stats.lecturesCount}
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Uploaded Lectures
              </p>
            </div>

            {/* Tests */}
            <div className="bg-linear-to-br from-white via-purple-100/50 to-white border border-white/20 rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-purple-100 p-2 sm:p-3 rounded-lg">
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">
                {stats.testsCount}
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Generated Tests
              </p>
            </div>

            {/* Study Notes */}
            <div className="bg-linear-to-br from-white via-orange-100/50 to-white border border-white/20 rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-orange-100 p-2 sm:p-3 rounded-lg">
                  <StickyNote className="w-5 h-5 sm:w-5 sm:h-6 text-orange-500" />
                </div>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">
                {stats.notesCount}
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Generated Notes
              </p>
            </div>
          </div>

          {/* Upload Actions */}
          <div className="mb-8">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-800 mb-4">
              Upload Content
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Upload Material */}
              <Link
                href="/materials"
                className="bg-white backdrop-blur-sm border border-white/20 hover:bg-blue-100/20 rounded-xl shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="bg-blue-100 group-hover:bg-blue-200 p-4 sm:p-6 rounded-full transition-colors mb-3 sm:mb-4">
                    <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">
                    Upload Materials
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Upload PDF or Word documents for AI-powered study assistance
                  </p>
                </div>
              </Link>

              {/* Record Lecture */}
              <Link
                href="/record-lecture"
                className="bg-white backdrop-blur-sm border border-white/20 hover:bg-green-100/20 rounded-xl shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="bg-green-100 group-hover:bg-green-200 p-4 sm:p-6 rounded-full transition-colors mb-3 sm:mb-4">
                    <Mic className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">
                    Record Lecture
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Record audio with real-time transcription
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
