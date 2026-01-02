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
  Upload,
  StickyNote,
  ChevronDown,
  ChevronRight,
  Eye,
  Clock,
  Trash2,
  Moon,
  Sun,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useTheme } from "@/contexts/ThemeContext";

type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  created_at: string;
  dark_mode?: boolean;
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
  file_name: string | null;
  created_at: string;
};

type Lecture = {
  id: string;
  title: string;
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
  const [materials, setMaterials] = useState<Material[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [recordingsOpen, setRecordingsOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

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

      // 2) Fetch statistics and library data in parallel
      const [
        { count: materialsCount },
        { count: lecturesCount },
        { count: testsCount },
        { count: notesCount },
        { data: materialsData },
        { data: lecturesData },
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
        supabase
          .from("materials")
          .select("id, title, file_name, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("lectures")
          .select("id, title, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (!isMounted) return;

      setStats({
        materialsCount: materialsCount || 0,
        lecturesCount: lecturesCount || 0,
        testsCount: testsCount || 0,
        notesCount: notesCount || 0,
      });
      setMaterials(materialsData || []);
      setLectures(lecturesData || []);
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const loading = user === undefined;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-gray-100 to-cyan-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const displayName =
    profile?.display_name || profile?.full_name?.split(" ")[0] || "Student";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleDeleteMaterial = async (
    e: React.MouseEvent,
    materialId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this material?")) return;

    const { error } = await supabase
      .from("materials")
      .delete()
      .eq("id", materialId);

    if (error) {
      console.error("Error deleting material:", error);
      alert("Error deleting material");
      return;
    }

    setMaterials(materials.filter((m) => m.id !== materialId));
  };

  const handleDeleteLecture = async (
    e: React.MouseEvent,
    lectureId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this recording?")) return;

    const { error } = await supabase
      .from("lectures")
      .delete()
      .eq("id", lectureId);

    if (error) {
      console.error("Error deleting lecture:", error);
      alert("Error deleting recording");
      return;
    }

    setLectures(lectures.filter((l) => l.id !== lectureId));
  };

  const handleToggleDarkMode = () => {
    toggleDarkMode();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-gray-100 to-cyan-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Main Content */}
      <div className="py-8 px-4 md:px-6 lg:px-8 min-h-screen">
        <div className="container-custom max-w-7xl mx-auto relative">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white mb-2">
              Hello, {displayName}! 👋
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Welcome back to Study Assistant
            </p>
          </div>

          {/* Upload Actions - Large Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Upload Material */}
            <Link
              href="/materials"
              className="bg-linear-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:bg-linear-to-br dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-500 dark:hover:to-blue-600 rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 hover:shadow-2xl transition-all group relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 rounded-full w-fit mb-4 sm:mb-6">
                  <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
                  Upload Materials
                </h3>
                <p className="text-blue-100 text-xs sm:text-sm">
                  Upload PDF or Word documents for AI-powered study assistance
                </p>
              </div>
              <div className="absolute bottom-0 right-0 opacity-10">
                <FileText className="w-32 h-32 sm:w-48 sm:h-48 text-white" />
              </div>
            </Link>

            {/* Record Lecture */}
            <Link
              href="/record-lecture"
              className="bg-linear-to-br from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 dark:bg-linear-to-br dark:from-green-500 dark:to-green-600 dark:hover:from-green-400 dark:hover:to-green-500 rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 hover:shadow-2xl transition-all group relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 rounded-full w-fit mb-4 sm:mb-6">
                  <Mic className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
                  Record Lecture
                </h3>
                <p className="text-green-100 text-xs sm:text-sm">
                  Record audio with real-time transcription
                </p>
              </div>
              <div className="absolute bottom-0 right-0 opacity-10">
                <Mic className="w-32 h-32 sm:w-48 sm:h-48 text-white" />
              </div>
            </Link>
          </div>

          {/* Statistics - Compact Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {/* Materials */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-5">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 sm:p-2 rounded-lg w-fit mb-2 sm:mb-3">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-0.5 sm:mb-1">
                {stats.materialsCount}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                Uploaded Materials
              </p>
            </div>

            {/* Lectures */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-5">
              <div className="bg-green-100 dark:bg-green-900/50 p-1.5 sm:p-2 rounded-lg w-fit mb-2 sm:mb-3">
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-0.5 sm:mb-1">
                {stats.lecturesCount}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                Uploaded Lecture
              </p>
            </div>

            {/* Tests */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-5">
              <div className="bg-purple-100 dark:bg-purple-900/50 p-1.5 sm:p-2 rounded-lg w-fit mb-2 sm:mb-3">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-0.5 sm:mb-1">
                {stats.testsCount}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                Generated Tests
              </p>
            </div>

            {/* Study Notes */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-5">
              <div className="bg-orange-100 dark:bg-orange-900/50 p-1.5 sm:p-2 rounded-lg w-fit mb-2 sm:mb-3">
                <StickyNote className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 dark:text-orange-400" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-0.5 sm:mb-1">
                {stats.notesCount}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                Generated Notes
              </p>
            </div>
          </div>

          {/* Library Section */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-8">
              Library
            </h2>

            {/* Uploaded Materials Dropdown */}
            <div className="mb-6">
              <button
                onClick={() => setMaterialsOpen(!materialsOpen)}
                className="w-full bg-blue-100 dark:bg-blue-900/40 border-2 border-white/10 dark:border-slate-700/40 hover:border-blue-500 dark:hover:border-blue-400 flex items-center justify-between p-5 rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center space-x-4">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Uploaded Materials
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-3 py-1.5 rounded-full font-bold">
                    {materials.length}
                  </span>
                  {materialsOpen ? (
                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  )}
                </div>
              </button>

              {materialsOpen && (
                <div className="mt-3 ml-6 space-y-2">
                  {materials.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      No materials uploaded yet
                    </div>
                  ) : (
                    materials.map((material) => (
                      <div key={material.id} className="relative">
                        <Link
                          href={`/materials/${material.id}`}
                          className="block p-4 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-2 border-blue-100 dark:border-blue-800/50 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg transition-all group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                              <Eye className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                  {material.title}
                                </p>
                                <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                                  <Clock className="w-4 h-4 mr-1.5" />
                                  {formatDate(material.created_at)}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) =>
                                handleDeleteMaterial(e, material.id)
                              }
                              className="p-2 rounded-lg transition-all ml-2 shrink-0 cursor-pointer"
                              title="Delete material"
                            >
                              <Trash2 className="w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400" />
                            </button>
                          </div>
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Recordings Dropdown */}
            <div>
              <button
                onClick={() => setRecordingsOpen(!recordingsOpen)}
                className="w-full bg-green-100 dark:bg-green-900/40 border-2 border-white/10 dark:border-slate-700/40 hover:border-green-500 dark:hover:border-green-400 flex items-center justify-between p-5 rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center space-x-4">
                  <Mic className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recordings
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-200 px-3 py-1.5 rounded-full font-bold">
                    {lectures.length}
                  </span>
                  {recordingsOpen ? (
                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  )}
                </div>
              </button>

              {recordingsOpen && (
                <div className="mt-3 ml-6 space-y-2">
                  {lectures.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      No recordings uploaded yet
                    </div>
                  ) : (
                    lectures.map((lecture) => (
                      <div key={lecture.id} className="relative">
                        <Link
                          href={`/lectures/${lecture.id}`}
                          className="block p-4 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border-2 border-green-100 dark:border-green-800/50 hover:border-green-400 dark:hover:border-green-500 rounded-lg transition-all group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                              <Eye className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-green-600 dark:group-hover:text-green-400">
                                  {lecture.title}
                                </p>
                                <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                                  <Clock className="w-4 h-4 mr-1.5" />
                                  {formatDate(lecture.created_at)}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) =>
                                handleDeleteLecture(e, lecture.id)
                              }
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all ml-2 shrink-0"
                              title="Delete recording"
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Dark Mode Toggle - Bottom Center */}
          <div className="flex justify-center mt-8 pb-8">
            <button
              onClick={handleToggleDarkMode}
              className={`group relative inline-flex items-center space-x-3 px-6 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl ${
                isDarkMode
                  ? "bg-slate-800 hover:bg-slate-700"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              <div
                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                  isDarkMode ? "bg-slate-800" : "bg-gray-100"
                }`}
              >
                {isDarkMode ? (
                  <Moon className="w-5 h-5 text-blue-400 " />
                ) : (
                  <Sun className="w-5 h-5 text-orange-500" />
                )}
              </div>
              <span
                className={`font-semibold text-sm ${
                  isDarkMode ? "text-white" : "text-gray-700"
                }`}
              >
                {isDarkMode ? "Dark Mode" : "Light Mode"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
