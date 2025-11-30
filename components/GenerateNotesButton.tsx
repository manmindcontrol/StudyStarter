"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";

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
        className={`w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-sm font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${className}`}
      >
        <BookOpen className="w-4 h-4 mr-2" />
        {loading ? "Generating notes..." : "Generate Study Notes"}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
