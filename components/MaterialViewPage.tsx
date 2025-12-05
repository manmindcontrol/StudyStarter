"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Calendar,
  FileQuestion,
  StickyNote,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import GenerateQuestionsButton from "@/components/GenerateQuestionsButton";
import GenerateNotesButton from "@/components/GenerateNotesButton";

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
      setLoading(false);
    };

    loadData();
  }, [materialId, router]);

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this material? This action cannot be undone."
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("materials")
      .delete()
      .eq("id", materialId);

    if (error) {
      console.error("Error deleting material:", error);
      alert("Error deleting material");
      return;
    }

    router.push("/dashboard");
  };

  const handleOpenDocument = () => {
    router.push(`/materials/${materialId}/view`);
  };

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
            className="text-blue-600 hover:text-blue-700"
          >
            Back to materials
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
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
                Material Details
              </h1>
              <p className="text-xs text-gray-500">
                View and manage your document
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-8 ">
        <div className="max-w-7xl mx-auto">
          {/* Document Info Card */}
          <div className="bg-linear-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 mb-8 shadow-sm">
            <div className="flex items-start space-x-5">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {material.title}
                </h2>
                {material.file_name && (
                  <p className="text-lg text-white/90 mb-3">
                    {material.file_name}
                  </p>
                )}
                <div className="flex items-center text-sm text-white/80">
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
              <button
                onClick={handleOpenDocument}
                className="w-full bg-white hover:bg-blue-50 border border-gray-200 rounded-xl p-6 transition-all group text-left shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Open Document
                </h3>
                <p className="text-sm text-gray-600">
                  View content and chat with AI assistant
                </p>
              </button>

              {/* Generate Study Notes - as Button Wrapper */}
              <div className="w-full">
                <GenerateNotesButton materialId={materialId} />
              </div>

              {/* Generate Exam Questions - as Button Wrapper */}
              <div className="w-full">
                <GenerateQuestionsButton
                  materialId={materialId}
                  questionType="exam"
                />
              </div>

              {/* Delete Document */}
              <button
                onClick={handleDelete}
                className="w-full bg-white hover:bg-red-50 border-2 border-red-200 hover:border-red-300 rounded-xl p-6 transition-all group text-left shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Delete Document
                </h3>
                <p className="text-sm text-gray-600">
                  Permanently remove this material
                </p>
              </button>
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

                  {/* Time Spent */}
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Calendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Time Spent</p>
                        <p className="text-2xl font-bold text-gray-900">
                          0h 0m
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
