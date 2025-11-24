"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import FileUpload from "@/components/FileUpload";
import { FileText, Clock, Trash2, Eye, Search } from "lucide-react";
import type { User } from "@supabase/supabase-js";

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
      console.error("Chyba pri načítaní materiálov:", error);
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
        throw new Error(errorData.error || "Chyba pri nahrávaní");
      }

      // Reload materiálov
      await loadMaterials();
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm("Naozaj chceš vymazať tento materiál?")) return;

    const { error } = await supabase
      .from("materials")
      .delete()
      .eq("id", materialId);

    if (error) {
      console.error("Chyba pri mazaní:", error);
      alert("Chyba pri mazaní materiálu");
      return;
    }

    // Reload materiálov
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
    return <FileText className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Študijné materiály
          </h1>
          <p className="text-gray-600">
            Nahraj PDF alebo Word dokumenty a spracuj ich pomocou AI
          </p>
        </div>

        {/* Upload sekcia */}
        <div className="mb-8">
          <FileUpload onUpload={handleUpload} />
        </div>

        {/* Vyhľadávanie */}
        {materials.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Vyhľadaj materiál..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Zoznam materiálov */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Moje materiály ({filteredMaterials.length})
            </h2>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery
                  ? "Žiadne výsledky"
                  : "Zatiaľ nemáš žiadne materiály"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? "Skús iné kľúčové slovo"
                  : "Nahraj svoj prvý študijný materiál a začni s AI asistovaným učením"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                  className="btn-primary"
                >
                  Nahrať materiál
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
                >
                  {/* Card content */}
                  <div className="p-6">
                    {/* Ikona a typ súboru */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        {getFileIcon(material.file_type)}
                      </div>
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {material.file_type || "file"}
                      </span>
                    </div>

                    {/* Názov */}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {material.title}
                    </h3>

                    {/* Meno súboru */}
                    {material.file_name && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                        {material.file_name}
                      </p>
                    )}

                    {/* Dátum */}
                    <div className="flex items-center text-xs text-gray-500 mb-4">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDate(material.created_at)}
                    </div>

                    {/* Akcie */}
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/materials/${material.id}`}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Otvoriť
                      </Link>
                      <button
                        onClick={() => handleDelete(material.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors"
                        title="Vymazať"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
