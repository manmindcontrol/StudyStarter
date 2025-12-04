"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, ChevronRight } from "lucide-react";

type GenerateNotesButtonProps = {
  materialId: string;
  lang?: string; // e.g. "en", "sk" ... optional
  className?: string;
};

export default function GenerateNotesButton({
  materialId,
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

      const res = await fetch(
        `/api/materials/${materialId}/generate-notes?${params.toString()}`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate study notes.");
      }

      // Redirect to notes page
      router.push(`/materials/${materialId}/notes/${data.record.id}`);
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
    <div className="flex flex-col space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`w-full bg-white hover:bg-purple-50 border border-gray-200 rounded-xl p-6 transition-all group text-left shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="bg-purple-100 p-3 rounded-lg">
            <StickyNote className="w-6 h-6 text-purple-600" />
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {loading ? "Generating notes..." : "Generate Study Notes"}
        </h3>
        <p className="text-sm text-gray-600">
          Create AI-powered study notes from your document
        </p>
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
