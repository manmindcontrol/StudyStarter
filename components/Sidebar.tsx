"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  FileText,
  Mic,
  ChevronDown,
  ChevronRight,
  Eye,
  Clock,
  X,
} from "lucide-react";
import Link from "next/link";

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

type SidebarProps = {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ userId, isOpen, onClose }: SidebarProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [recordingsOpen, setRecordingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Load materials
      const { data: materialsData } = await supabase
        .from("materials")
        .select("id, title, file_name, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Load lectures
      const { data: lecturesData } = await supabase
        .from("lectures")
        .select("id, title, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setMaterials(materialsData || []);
      setLectures(lecturesData || []);
      setLoading(false);
    };

    loadData();
  }, [userId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:sticky top-0 left-0 h-screen
          w-80 bg-white border-r border-gray-200 overflow-y-auto shrink-0
          z-50 transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-3 sm:p-4">
          {/* Header with close button for mobile */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Library</h2>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

        {/* Uploaded Materials Section */}
        <div className="mb-3 sm:mb-4">
          <button
            onClick={() => setMaterialsOpen(!materialsOpen)}
            className="w-full bg-slate-100 flex items-center justify-between p-2.5 sm:p-3 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="text-sm sm:text-base font-semibold text-gray-900">
                Uploaded Materials
              </span>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="text-xs bg-blue-100 text-blue-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                {materials.length}
              </span>
              {materialsOpen ? (
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              )}
            </div>
          </button>

          {materialsOpen && (
            <div className="mt-1.5 sm:mt-2 ml-2 sm:ml-4 space-y-1">
              {loading ? (
                <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-gray-500">
                  Loading...
                </div>
              ) : materials.length === 0 ? (
                <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-gray-500">
                  No materials uploaded yet
                </div>
              ) : (
                materials.map((material) => (
                  <Link
                    key={material.id}
                    href={`/materials/${material.id}`}
                    className="block p-2 sm:p-3 hover:bg-blue-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-start space-x-2">
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-600 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                          {material.title}
                        </p>
                        <div className="flex items-center mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-500">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                          {formatDate(material.created_at)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* Recordings Section */}
        <div className="mb-3 sm:mb-4">
          <button
            onClick={() => setRecordingsOpen(!recordingsOpen)}
            className="w-full bg-slate-100 flex items-center justify-between p-2.5 sm:p-3 hover:bg-green-100 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <span className="text-sm sm:text-base font-semibold text-gray-900">Recordings</span>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="text-xs bg-green-100 text-green-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                {lectures.length}
              </span>
              {recordingsOpen ? (
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              )}
            </div>
          </button>

          {recordingsOpen && (
            <div className="mt-1.5 sm:mt-2 ml-2 sm:ml-4 space-y-1">
              {loading ? (
                <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-gray-500">
                  Loading...
                </div>
              ) : lectures.length === 0 ? (
                <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-gray-500">
                  No recordings uploaded yet
                </div>
              ) : (
                lectures.map((lecture) => (
                  <Link
                    key={lecture.id}
                    href={`/lectures/${lecture.id}`}
                    className="block p-2 sm:p-3 hover:bg-green-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-start space-x-2">
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-green-600 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate group-hover:text-green-600">
                          {lecture.title}
                        </p>
                        <div className="flex items-center mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-500">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                          {formatDate(lecture.created_at)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
