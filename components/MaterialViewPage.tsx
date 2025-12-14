"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  FileText,
  Calendar,
  FileQuestion,
  StickyNote,
  ArrowLeft,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import GenerateQuestionsButton from "@/components/buttons/GenerateQuestionsButton";
import GenerateNotesButton from "@/components/buttons/GenerateNotesButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import OpenDocumentButton from "@/components/buttons/OpenDocumentButton";

type Material = {
  id: string;
  title: string;
  content: string | null;
  file_name: string | null;
  file_type: string | null;
  storage_path: string | null;
  created_at: string;
};

type Props = {
  materialId: string;
};

export default function MaterialViewPage({ materialId }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [material, setMaterial] = useState<Material | null>(null);
  const [stats, setStats] = useState({
    questionsCount: 0,
    notesCount: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      const { user } = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // Load material
      const { data: materialData, error: materialError } = await supabase
        .from("materials")
        .select("*")
        .eq("id", materialId)
        .single();

      if (materialError || !materialData) {
        console.error("Material error:", materialError);
        setLoading(false);
        return;
      }

      setMaterial(materialData);

      // Load statistics
      const [{ count: questionsCount }, { count: notesCount }] =
        await Promise.all([
          supabase
            .from("generated_questions")
            .select("*", { count: "exact", head: true })
            .eq("material_id", materialId),
          supabase
            .from("study_notes")
            .select("*", { count: "exact", head: true })
            .eq("material_id", materialId),
        ]);

      setStats({
        questionsCount: questionsCount || 0,
        notesCount: notesCount || 0,
      });

      setLoading(false);
    };

    loadData();
  }, [materialId, router]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Material not found
          </h2>
          <button
            onClick={() => router.push("/materials")}
            className="text-gray-600 hover:text-gray-900"
          >
            Back to materials
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-gray-100 to-cyan-50 overflow-hidden">
      {/* Header */}

      {/* Content */}
      <div className="container-custom py-8 ">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-4 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          {/* Document Info Card */}
          <div className="bg-linear-to-r from-blue-600 to-cyan-500 rounded-2xl p-3 mb-3 md:p-8 md:mb-8 shadow-sm">
            <div className="flex items-start space-x-2 md:space-x-5">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                <FileText className="w-5 h-5 md:w-8 md:h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg md:text-3xl font-bold text-white mb-2">
                  {material.title}
                </h2>
                {material.file_name && (
                  <p className="text-l md:text-lg text-white/90 mb-3">
                    {material.file_name}
                  </p>
                )}
                <div className="flex items-center text-xs md:text-sm text-white/80">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Uploaded {formatDate(material.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Actions */}
            <div className="lg:col-span-2 space-y-4">
              {/* Open Document */}
              <OpenDocumentButton materialId={materialId} />

              {/* Generate Study Notes */}
              <GenerateNotesButton materialId={materialId} />

              {/* Generate Exam Questions */}
              <GenerateQuestionsButton
                materialId={materialId}
                questionType="exam"
              />

              {/* Delete Document */}
              <DeleteButton
                materialId={materialId}
                materialTitle={material.title}
              />
            </div>

            {/* Right Column - Statistics */}
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Statistics
                </h3>

                <div className="space-y-4">
                  {/* Questions Generated */}
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <FileQuestion className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Question Sets</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.questionsCount}
                        </p>
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
                        <p className="text-sm text-gray-600">Study Notes</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.notesCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Info */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  File Info
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">File Type</p>
                    <p className="text-sm font-medium text-gray-900">
                      {material.file_type || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Uploaded</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(material.created_at)}
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
