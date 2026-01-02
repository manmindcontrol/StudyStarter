"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, ChevronRight } from "lucide-react";
import GeneratingNotesModal from "../modals/GeneratingNotesModal";

type GenerateNotesButtonProps = {
  materialId?: string;
  lectureId?: string;
  contentType?: "material" | "lecture";
  lang?: string; // e.g. "en", "sk" ... optional
  className?: string;
};

export default function GenerateNotesButton({
  materialId,
  lectureId,
  contentType = "material",
  lang,
  className = "",
}: GenerateNotesButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (lang) {
        params.set("lang", lang);
      }

      const id = materialId || lectureId;
      const apiPath =
        contentType === "lecture"
          ? `/api/lectures/${id}/generate-notes`
          : `/api/materials/${id}/generate-notes`;

      const res = await fetch(`${apiPath}?${params.toString()}`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate study notes.");
      }

      // Redirect to notes page with unsaved data
      if (contentType === "material") {
        const notesParam = encodeURIComponent(JSON.stringify(data.notes));
        router.push(`/materials/${id}/notes/new?data=${notesParam}`);
      } else {
        const notesParam = encodeURIComponent(JSON.stringify(data.notes));
        router.push(`/lectures/${id}/notes/new?data=${notesParam}`);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unexpected error while generating notes."
      );
      setLoading(false);
    }
  };

  return (
    <>
      {/* Full-screen modal when loading */}
      <GeneratingNotesModal
        key={loading ? "open" : "closed"}
        isOpen={loading}
      />

      <div className="flex flex-col space-y-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className={`relative w-full bg-white hover:bg-purple-50 dark:bg-slate-800 dark:hover:bg-purple-800/20 border border-gray-200 dark:border-slate-700 rounded-xl p-6 transition-all group text-left shadow-sm disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden cursor-pointer ${className}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
              <StickyNote className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300 mb-1">
            Generate Study Notes
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create AI-powered study notes from your document
          </p>
        </button>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </>
  );
}
