"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, Clock, Calendar } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

type Lecture = {
  id: string;
  title: string;
  transcript: string;
  duration: number;
  created_at: string;
};

type Props = {
  lectureId: string;
};

export default function LectureViewerPage({ lectureId }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { user } = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("lectures")
        .select("*")
        .eq("id", lectureId)
        .single();

      if (error || !data) {
        console.error("Error loading lecture:", error);
        setLoading(false);
        return;
      }

      setLecture(data);
      setLoading(false);
    };

    loadData();
  }, [lectureId, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t("lectureViewer.lectureNotFound")}
          </h2>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            {t("lectureViewer.backToDashboard")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
        <div className="container-custom py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/lectures/${lectureId}`)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {lecture.title}
              </h1>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4 mt-1">
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(lecture.created_at)}
                </div>
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDuration(lecture.duration)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {t("lectureViewer.transcript")}
            </h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {lecture.transcript}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
