"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { BookOpen, FileText, Mic, Brain, Plus, TrendingUp } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useAutoLogout } from "@/hooks/useAutoLogout";

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
  });

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
      ]);

      if (!isMounted) return;

      setStats({
        materialsCount: materialsCount || 0,
        lecturesCount: lecturesCount || 0,
        testsCount: testsCount || 0,
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hello, {displayName}! 👋
          </h1>
          <p className="text-gray-600">Welcome back to Study Assistant</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Materials */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.materialsCount}
            </h3>
            <p className="text-gray-600 text-sm">Uploaded Materials</p>
          </div>

          {/* Lectures */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Mic className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.lecturesCount}
            </h3>
            <p className="text-gray-600 text-sm">Uploaded Lectures</p>
          </div>

          {/* Tests */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.testsCount}
            </h3>
            <p className="text-gray-600 text-sm">Generated Tests</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Upload Material */}
            <Link
              href="/materials"
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 group-hover:bg-blue-200 p-3 rounded-lg transition-colors">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Upload Material
                  </h3>
                  <p className="text-sm text-gray-600">PDF, Word documents</p>
                </div>
              </div>
            </Link>

            {/* Upload Lecture */}
            <Link
              href="/prednasky"
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 group-hover:bg-green-200 p-3 rounded-lg transition-colors">
                  <Mic className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Upload Lecture
                  </h3>
                  <p className="text-sm text-gray-600">Real-time transcription</p>
                </div>
              </div>
            </Link>

            {/* Create Test */}
            <Link
              href="/testy"
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 group-hover:bg-purple-200 p-3 rounded-lg transition-colors">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Create Test
                  </h3>
                  <p className="text-sm text-gray-600">AI test questions</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Get Started */}
        <div className="bg-linear-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-white/20 p-3 rounded-lg">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">
                Start Your Study Day!
              </h2>
              <p className="text-blue-100">
                Upload new material or continue learning
              </p>
            </div>
          </div>
          <div className="flex md:flex-row flex-col justify-between gap-8">
            <div className="flex flex-wrap gap-4">
              <Link
                href="/materials"
                className="bg-blue-100 hover:bg-blue-200 text-blue-600 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Upload Materials
              </Link>
              <Link
                href="/prednasky"
                className="bg-green-100 hover:bg-green-200 text-green-600 font-semibold py-3 px-6 rounded-lg transition-colors border border-white/30"
              >
                Upload Lecture
              </Link>
            </div>
            <div className="flex flex-wrap">
              <Link
                href="/materials"
                className="bg-purple-100 hover:bg-purple-200  text-purple-600 0 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                View Materials
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
