"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  Mic,
  ChevronLeft,
  Calendar,
  Clock,
  FileQuestion,
  StickyNote,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import GenerateQuestionsButton from "@/components/buttons/GenerateQuestionsButton";
import GenerateNotesButton from "@/components/buttons/GenerateNotesButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import OpenLectureButton from "@/components/buttons/OpenLectureButton";

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

export default function LectureViewPage({ lectureId }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lecture, setLecture] = useState<Lecture | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const { user } = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // Load lecture
      const { data: lectureData, error: lectureError } = await supabase
        .from("lectures")
        .select("*")
        .eq("id", lectureId)
        .single();

      if (lectureError || !lectureData) {
        console.error("Lecture error:", lectureError);
        setLoading(false);
        return;
      }

      setLecture(lectureData);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Lecture not found
          </h2>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-gray-100 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Lecture Details
              </h1>
              <p className="text-xs text-gray-500">
                View and manage your recorded lecture
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-8">
        <div className="max-w-7xl mx-auto">
          {/* Lecture Info Card */}
          <div className="bg-linear-to-br from-emerald-600 to-green-400 rounded-2xl p-8 mb-8 shadow-sm">
            <div className="flex items-start space-x-5">
              <div className="bg-green-100 backdrop-blur-sm p-4 rounded-xl">
                <Mic className="w-10 h-10 text-green-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {lecture.title}
                </h2>
                <div className="flex items-center text-sm text-gray-100 space-x-6">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Recorded {formatDate(lecture.created_at)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Duration: {formatDuration(lecture.duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Actions */}
            <div className="lg:col-span-2 space-y-4">
              {/* Open Lecture */}
              <OpenLectureButton lectureId={lectureId} />

              {/* Generate Study Notes */}
              <GenerateNotesButton
                lectureId={lectureId}
                contentType="lecture"
              />

              {/* Generate Exam Questions */}
              <GenerateQuestionsButton
                lectureId={lectureId}
                questionType="exam"
                contentType="lecture"
              />

              {/* Delete Lecture */}
              <DeleteButton
                lectureId={lectureId}
                itemTitle={lecture.title}
                itemType="lecture"
              />
            </div>

            {/* Right Column - Statistics */}
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Statistics
                </h3>

                <div className="space-y-4">
                  {/* Tests Created */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <FileQuestion className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tests Created</p>
                        <p className="text-2xl font-bold text-gray-900">0</p>
                      </div>
                    </div>
                  </div>

                  {/* Questions Generated */}
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <FileQuestion className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Questions</p>
                        <p className="text-2xl font-bold text-gray-900">0</p>
                      </div>
                    </div>
                  </div>

                  {/* Notes Generated */}
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <StickyNote className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Notes</p>
                        <p className="text-2xl font-bold text-gray-900">0</p>
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatDuration(lecture.duration)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lecture Info */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Lecture Info
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Words</p>
                    <p className="text-sm font-medium text-gray-900">
                      {lecture.transcript.split(" ").length} words
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Recorded</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(lecture.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
