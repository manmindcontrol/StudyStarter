"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import FileUpload from "@/components/FileUpload";
import {
  FileText,
  Clock,
  Trash2,
  Eye,
  Search,
  Plus,
  ArrowLeft,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import GenerateQuestionsButton from "@/components/buttons/GenerateQuestionsButton";
import GenerateNotesButton from "@/components/buttons/GenerateNotesButton";

type Material = {
  id: string;
  title: string;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
  content: string | null;
};

export default function MaterialsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);

  const checkUser = useCallback(async () => {
    const { user } = await getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUser(user);
    setLoading(false);
  }, [router]);

  const loadMaterials = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading materials:", error);
      return;
    }

    setMaterials(data || []);
  }, []);

  useEffect(() => {
    checkUser();
    loadMaterials();
  }, [checkUser, loadMaterials]);

  const handleUpload = async (file: File) => {
    if (!user) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id);
      formData.append("title", file.name);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload error");
      }

      // Reload materials
      await loadMaterials();
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    const { error } = await supabase
      .from("materials")
      .delete()
      .eq("id", materialId);

    if (error) {
      console.error("Error deleting:", error);
      alert("Error deleting material");
      return;
    }

    // Reload materials
    await loadMaterials();
  };

  const filteredMaterials = materials.filter(
    (material) =>
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.file_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("sk-SK", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getFileIcon = (fileType: string | null) => {
    return <FileText className="w-4 h-4 sm:w-5 sm:h-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  bg-linear-to-br from-blue-50 via-gray-100 to-cyan-50">
      <div className="container-custom py-12">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-4 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Dashboard</span>
        </button>
        {/* Header */}
        <div className="flex items-center space-x-2 md:space-x-5 bg-linear-to-br from-blue-600 to-cyan-500 p-6 rounded-2xl shadow-md mb-8">
          <div className="bg-blue-100  p-2 md:p-4 rounded-xl md:rounded-2xl shadow-lg">
            <Plus className="w-5 h-5 md:w-8 md:h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-lg md:text-3xl font-bold text-white mb-1">
              Upload study materials
            </h1>
            <p className="text-gray-100 text-sm md:text-lg">
              Upload PDF or Word documents and process them with AI to generate
              interactive questions
            </p>
          </div>
        </div>

        {/* Upload section - highlighted card */}
        <div className="mb-10 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <FileUpload onUpload={handleUpload} />
          {uploading && (
            <div className="mt-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-sm text-gray-600 font-medium">
                Uploading file, please wait...
              </p>
            </div>
          )}
        </div>

        {/* Search */}
        {materials.length > 0 && (
          <div className="mb-8">
            <div className="relative mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search materials by title or filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 text-gray-900 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm bg-white"
              />
            </div>
          </div>
        )}

        {/* Materials list */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              My Materials
              <span className="ml-3 inline-flex items-center justify-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-full">
                {filteredMaterials.length}
              </span>
            </h2>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-16 text-center border border-gray-100">
              <div className="bg-linear-to-br from-blue-100 to-purple-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {searchQuery ? "No results found" : "No materials yet"}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchQuery
                  ? "Try searching with different keywords"
                  : "Upload your first study material and start your AI-assisted learning journey"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                  className="btn-primary px-8 py-3 text-base"
                >
                  Upload Your First Material
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
                >
                  {/* linear top bar */}
                  <div className="h-2 bg-linear-to-r from-blue-500 to-purple-500"></div>

                  {/* Card content */}
                  <div className="p-6">
                    {/* Icon and file type */}
                    <div className="flex items-start justify-between mb-4 sm:mb-5">
                      <div className="bg-linear-to-br from-blue-100 to-blue-200 p-3 sm:p-4 rounded-xl text-blue-600 group-hover:from-blue-200 group-hover:to-blue-300 transition-all">
                        {getFileIcon(material.file_type)}
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-wide">
                        {material.file_type || "file"}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-base sm:text-lg leading-tight">
                      {material.title}
                    </h3>

                    {/* File name */}
                    {material.file_name && (
                      <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 line-clamp-1 flex items-center">
                        <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 shrink-0" />
                        {material.file_name}
                      </p>
                    )}

                    {/* Date */}
                    <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-100">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      {formatDate(material.created_at)}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/materials/${material.id}`}
                          className="flex-1 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs sm:text-sm font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                          Open Material
                        </Link>
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 sm:p-3 rounded-xl transition-all hover:shadow-md"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>

                      {/* Generate study notes button */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
