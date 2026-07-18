"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";
// Mic: re-add to imports when real-time recording is re-enabled
import { Upload, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function UploadLecturePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const checkAuth = async () => {
      const { user } = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
    };
    checkAuth();
  }, [router]);

  const loading = user === undefined;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-gray-100 to-cyan-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-4 flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-400 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">{t("recordLecture.backToDashboard")}</span>
          </button>

          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-3">
              {t("uploadLecture.title")}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {t("uploadLecture.subtitle")}
            </p>
          </div>
        </div>

        {/* Options Grid */}
        {/* NOTE: Real-time recording is temporarily disabled. To re-enable, uncomment the
            "Record in Real-Time" card below and restore "md:grid-cols-2 max-w-5xl" on the grid. */}
        <div className="grid grid-cols-1 gap-6 max-w-xl mx-auto">
          {/* Record in Real-Time — TEMPORARILY DISABLED
          <button
            onClick={() => router.push("/record-lecture")}
            className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 border-green-200 dark:border-green-700 hover:border-green-500 dark:hover:border-green-400 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all relative overflow-hidden cursor-pointer"
          >
            <div className="relative z-10">
              <div className="bg-linear-to-br from-green-400 to-green-500 p-6 rounded-2xl w-fit mb-6 mx-auto group-hover:scale-110 transition-transform">
                <Mic className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
                {t("uploadLecture.recordRealTime")}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                {t("uploadLecture.recordRealTimeDesc")}
              </p>
              <ul className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>{t("uploadLecture.realTimeBenefit1")}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>{t("uploadLecture.realTimeBenefit2")}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>{t("uploadLecture.realTimeBenefit3")}</span>
                </li>
              </ul>
            </div>
            <div className="absolute bottom-0 right-0 opacity-5 group-hover:opacity-10 transition-opacity">
              <Mic className="w-48 h-48 text-green-500" />
            </div>
          </button>
          */}

          {/* Upload Recorded Lecture */}
          <button
            onClick={() => router.push("/upload-recorded-lecture")}
            className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all relative overflow-hidden cursor-pointer"
          >
            <div className="relative z-10">
              <div className="bg-linear-to-br from-blue-500 to-blue-600 p-6 rounded-2xl w-fit mb-6 mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
                {t("uploadLecture.uploadRecorded")}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                {t("uploadLecture.uploadRecordedDesc")}
              </p>
              <ul className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  <span>{t("uploadLecture.uploadBenefit1")}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  <span>{t("uploadLecture.uploadBenefit2")}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  <span>{t("uploadLecture.uploadBenefit3")}</span>
                </li>
              </ul>
            </div>
            <div className="absolute bottom-0 right-0 opacity-5 group-hover:opacity-10 transition-opacity">
              <Upload className="w-48 h-48 text-blue-500" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
