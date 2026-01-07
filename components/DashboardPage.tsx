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
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();

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

    if (!confirm(t("dashboard.deleteMaterial"))) return;

    const { error } = await supabase
      .from("materials")
      .delete()
      .eq("id", materialId);

    if (error) {
      console.error("Error deleting material:", error);
      alert(t("dashboard.errorDeleting"));
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

    if (!confirm(t("dashboard.deleteRecording"))) return;

    const { error } = await supabase
      .from("lectures")
      .delete()
      .eq("id", lectureId);

    if (error) {
      console.error("Error deleting lecture:", error);
      alert(t("dashboard.errorDeleting"));
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
      <div className="py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8 min-h-screen">
        <div className="container-custom max-w-7xl mx-auto relative">
          {/* Header */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white mb-1 sm:mb-2 leading-tight">
              {t("dashboard.greeting")}, {displayName}! 👋
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300">
              {t("dashboard.welcome")}
            </p>
          </div>

          {/* Upload Actions - Large Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
            {/* Upload Material */}
            <Link
              href="/materials"
              className="bg-linear-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:bg-linear-to-br dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-500 dark:hover:to-blue-600 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 hover:shadow-xl sm:hover:shadow-2xl transition-all group relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 md:p-4 rounded-full w-fit mb-3 sm:mb-4 md:mb-6">
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-base sm:text-xl md:text-2xl font-bold text-white mb-1.5 sm:mb-2 md:mb-3 leading-tight">
                  {t("dashboard.uploadMaterials")}
                </h3>
                <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                  {t("dashboard.uploadMaterialsDesc")}
                </p>
              </div>
              <div className="absolute bottom-0 right-0 opacity-10">
                <FileText className="w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 text-white" />
              </div>
            </Link>

            {/* Record Lecture */}
            <Link
              href="/record-lecture"
              className="bg-linear-to-br from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 dark:bg-linear-to-br dark:from-green-500 dark:to-green-600 dark:hover:from-green-400 dark:hover:to-green-500 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 hover:shadow-xl sm:hover:shadow-2xl transition-all group relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 md:p-4 rounded-full w-fit mb-3 sm:mb-4 md:mb-6">
                  <Mic className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-base sm:text-xl md:text-2xl font-bold text-white mb-1.5 sm:mb-2 md:mb-3 leading-tight">
                  {t("dashboard.recordLecture")}
                </h3>
                <p className="text-green-100 text-xs sm:text-sm leading-relaxed">
                  {t("dashboard.recordLectureDesc")}
                </p>
              </div>
              <div className="absolute bottom-0 right-0 opacity-10">
                <Mic className="w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 text-white" />
              </div>
            </Link>
          </div>

          {/* Statistics - Compact Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
            {/* Materials */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 rounded-lg sm:rounded-xl shadow-sm p-2.5 sm:p-3 md:p-4 lg:p-5">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-1 sm:p-1.5 md:p-2 rounded-lg w-fit mb-1.5 sm:mb-2 md:mb-3">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-0.5 leading-tight">
                {stats.materialsCount}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-[10px] sm:text-xs md:text-sm leading-tight">
                {t("dashboard.uploadedMaterials")}
              </p>
            </div>

            {/* Lectures */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 rounded-lg sm:rounded-xl shadow-sm p-2.5 sm:p-3 md:p-4 lg:p-5">
              <div className="bg-green-100 dark:bg-green-900/50 p-1 sm:p-1.5 md:p-2 rounded-lg w-fit mb-1.5 sm:mb-2 md:mb-3">
                <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-0.5 leading-tight">
                {stats.lecturesCount}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-[10px] sm:text-xs md:text-sm leading-tight">
                {t("dashboard.uploadedLecture")}
              </p>
            </div>

            {/* Tests */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 rounded-lg sm:rounded-xl shadow-sm p-2.5 sm:p-3 md:p-4 lg:p-5">
              <div className="bg-purple-100 dark:bg-purple-900/50 p-1 sm:p-1.5 md:p-2 rounded-lg w-fit mb-1.5 sm:mb-2 md:mb-3">
                <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-0.5 leading-tight">
                {stats.testsCount}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-[10px] sm:text-xs md:text-sm leading-tight">
                {t("dashboard.generatedTests")}
              </p>
            </div>

            {/* Study Notes */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 rounded-lg sm:rounded-xl shadow-sm p-2.5 sm:p-3 md:p-4 lg:p-5">
              <div className="bg-orange-100 dark:bg-orange-900/50 p-1 sm:p-1.5 md:p-2 rounded-lg w-fit mb-1.5 sm:mb-2 md:mb-3">
                <StickyNote className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-orange-500 dark:text-orange-400" />
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-0.5 leading-tight">
                {stats.notesCount}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-[10px] sm:text-xs md:text-sm leading-tight">
                {t("dashboard.generatedNotes")}
              </p>
            </div>
          </div>

          {/* Library Section */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-6 lg:p-8">
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4 md:mb-6 lg:mb-8">
              {t("dashboard.library")}
            </h2>

            {/* Uploaded Materials Dropdown */}
            <div className="mb-3 sm:mb-4 md:mb-6">
              <button
                onClick={() => setMaterialsOpen(!materialsOpen)}
                className="w-full cursor-pointer bg-blue-100 dark:bg-blue-900/40 border-2 border-white/10 dark:border-slate-700/40 hover:border-blue-500 dark:hover:border-blue-400 flex items-center justify-between p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {t("dashboard.uploadedMaterials")}
                  </span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                  <span className="text-xs sm:text-sm bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-bold">
                    {materials.length}
                  </span>
                  {materialsOpen ? (
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                  )}
                </div>
              </button>

              {materialsOpen && (
                <div className="mt-2 sm:mt-3 ml-2 sm:ml-4 md:ml-6 space-y-1.5 sm:space-y-2">
                  {materials.length === 0 ? (
                    <div className="p-4 sm:p-6 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {t("dashboard.noMaterials")}
                    </div>
                  ) : (
                    materials.map((material) => (
                      <div key={material.id} className="relative">
                        <Link
                          href={`/materials/${material.id}`}
                          className="block p-2.5 sm:p-3 md:p-4 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-2 border-blue-100 dark:border-blue-800/50 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                  {material.title}
                                </p>
                                <div className="flex items-center mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 shrink-0" />
                                  <span className="truncate">
                                    {formatDate(material.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) =>
                                handleDeleteMaterial(e, material.id)
                              }
                              className="p-1.5 sm:p-2 rounded-lg transition-all shrink-0 cursor-pointer"
                              title="Delete material"
                            >
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400" />
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
                className="w-full cursor-pointer bg-green-100 dark:bg-green-900/40 border-2 border-white/10 dark:border-slate-700/40 hover:border-green-500 dark:hover:border-green-400 flex items-center justify-between p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0">
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400 shrink-0" />
                  <span className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {t("dashboard.recordings")}
                  </span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                  <span className="text-xs sm:text-sm bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-bold">
                    {lectures.length}
                  </span>
                  {recordingsOpen ? (
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                  )}
                </div>
              </button>

              {recordingsOpen && (
                <div className="mt-2 sm:mt-3 ml-2 sm:ml-4 md:ml-6 space-y-1.5 sm:space-y-2">
                  {lectures.length === 0 ? (
                    <div className="p-4 sm:p-6 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {t("dashboard.noRecordings")}
                    </div>
                  ) : (
                    lectures.map((lecture) => (
                      <div key={lecture.id} className="relative">
                        <Link
                          href={`/lectures/${lecture.id}`}
                          className="block p-2.5 sm:p-3 md:p-4 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border-2 border-green-100 dark:border-green-800/50 hover:border-green-400 dark:hover:border-green-500 rounded-lg transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-green-600 dark:group-hover:text-green-400">
                                  {lecture.title}
                                </p>
                                <div className="flex items-center mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 shrink-0" />
                                  <span className="truncate">
                                    {formatDate(lecture.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) =>
                                handleDeleteLecture(e, lecture.id)
                              }
                              className="p-1.5 sm:p-2 rounded-lg transition-all shrink-0 cursor-pointer"
                              title="Delete recording"
                            >
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400" />
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
          <div className="flex justify-center mt-4 sm:mt-6 md:mt-8 pb-4 sm:pb-6 md:pb-8">
            <button
              onClick={handleToggleDarkMode}
              className={`group relative inline-flex items-center space-x-2 sm:space-x-3 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer ${
                isDarkMode
                  ? "bg-slate-800 hover:bg-slate-700"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              <div
                className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full transition-all duration-300 ${
                  isDarkMode ? "bg-slate-800" : "bg-gray-100"
                }`}
              >
                {isDarkMode ? (
                  <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-blue-400" />
                ) : (
                  <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-orange-500" />
                )}
              </div>
              <span
                className={`font-semibold text-xs sm:text-sm ${
                  isDarkMode ? "text-white" : "text-gray-700"
                }`}
              >
                {isDarkMode ? t("dashboard.darkMode") : t("dashboard.lightMode")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
