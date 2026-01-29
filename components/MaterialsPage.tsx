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
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();
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
      // Get session token for authorization
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No active session");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id);
      formData.append("title", file.name);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
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

  const handleUrlUpload = async (url: string, title: string) => {
    if (!user) return;

    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No active session");
      }

      const response = await fetch("/api/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ url, title }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "URL upload error");
      }

      // Reload materials
      await loadMaterials();
    } catch (error) {
      console.error("URL upload error:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleTextUpload = async (text: string, title: string) => {
    if (!user) return;

    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No active session");
      }

      const response = await fetch("/api/upload-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text, title }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Text upload error");
      }

      // Reload materials
      await loadMaterials();
    } catch (error) {
      console.error("Text upload error:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm(t("materials.deleteMaterialConfirm"))) return;

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Not authenticated");
        return;
      }

      // Call API endpoint to delete with proper cleanup
      const response = await fetch(`/api/materials/${materialId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete');
      }

      // Reload materials
      await loadMaterials();
    } catch (error) {
      console.error("Error deleting:", error);
      alert(t("materials.errorDeletingMaterial"));
    }
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
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ">
      <div className="container-custom py-12">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-4 flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">{t("materials.backToDashboard")}</span>
        </button>
        {/* Header */}
        <div className="flex items-center space-x-2 md:space-x-5 bg-linear-to-br from-blue-600 to-cyan-500 dark:bg-linear-to-br dark:from-blue-700 dark:to-cyan-700 p-6 rounded-2xl shadow-md mb-8">
          <div className="bg-blue-100  p-2 md:p-4 rounded-xl md:rounded-2xl shadow-lg">
            <Plus className="w-5 h-5 md:w-8 md:h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-lg md:text-3xl font-bold text-white mb-1">
              {t("materials.title")}
            </h1>
            <p className="text-gray-100 text-sm md:text-lg">
              {t("materials.description")}
            </p>
          </div>
        </div>

        {/* Upload section - highlighted card */}
        <div className="mb-10 bg-white rounded-2xl shadow-lg p-8 border border-gray-100 dark:bg-slate-800/80 dark:border-gray-700">
          <FileUpload
            onUpload={handleUpload}
            onUrlUpload={handleUrlUpload}
            onTextUpload={handleTextUpload}
          />
          {uploading && (
            <div className="mt-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400 mr-3"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {t("materials.uploadingFile")}
              </p>
            </div>
          )}
        </div>

        {/* Search */}
        {materials.length > 0 && (
          <div className="mb-8">
            <div className="relative mx-auto ">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("materials.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 dark:bg-slate-800/80 text-gray-900 dark:text-gray-300 border-gray-100 dark:border-gray-700 rounded-xl  shadow-sm bg-white"
              />
            </div>
          </div>
        )}

        {/* Materials list */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200">
              {t("materials.myMaterials")}
              <span className="ml-3 inline-flex items-center justify-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                {filteredMaterials.length}
              </span>
            </h2>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-md p-16 text-center border border-gray-100 dark:border-gray-700">
              <div className="bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {searchQuery ? t("materials.noResultsFound") : t("materials.noMaterialsYet")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {searchQuery
                  ? t("materials.tryDifferentKeywords")
                  : t("materials.uploadFirstMaterial")}
              </p>
              {!searchQuery && (
                <button
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                  className="btn-primary px-8 py-3 text-base"
                >
                  {t("materials.uploadYourFirst")}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
                >
                  {/* linear top bar */}
                  <div className="h-2 bg-linear-to-r from-blue-500 to-cyan-500 dark:bg-linear-to-r dark:from-blue-700/50 dark:to-cyan-700/50"></div>

                  {/* Card content */}
                  <div className="p-6">
                    {/* Icon and file type */}
                    <div className="flex items-start justify-between mb-4 sm:mb-5">
                      <div className="bg-blue-100 dark:bg-slate-700 p-3 sm:p-4 rounded-xl text-blue-600 dark:text-blue-400 group-hover:from-blue-200 group-hover:to-blue-300 transition-all">
                        {getFileIcon(material.file_type)}
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-wide">
                        {material.file_type || "file"}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-gray-900 dark:text-gray-300 mb-3 line-clamp-2 text-base sm:text-lg leading-tight">
                      {material.title}
                    </h3>

                    {/* Date */}
                    <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-100 dark:border-slate-700">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      {formatDate(material.created_at)}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/materials/${material.id}`}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 dark:bg-slate-700 dark:hover:bg-slate-600 text-white dark:text-gray-300 text-xs sm:text-sm font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                          {t("materials.openMaterial")}
                        </Link>
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 dark:text-red-400 dark:hover:text-red-500 dark:bg-slate-700 dark:hover:bg-slate-700 p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer "
                          title={t("materials.delete")}
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
