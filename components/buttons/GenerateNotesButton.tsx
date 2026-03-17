"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, ChevronRight } from "lucide-react";
import GeneratingNotesModal from "../modals/GeneratingNotesModal";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/lib/supabase";

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
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setStreamProgress(0);
    setLoading(true);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to generate notes");
      }

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
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Failed to generate study notes.");
      }

      // Read the streaming response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullJson = '';
      // Estimate: typical notes JSON is ~40k chars; cap progress at 95%
      const ESTIMATED_SIZE = 40000;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullJson += decoder.decode(value, { stream: true });
        setStreamProgress(Math.min(95, Math.round((fullJson.length / ESTIMATED_SIZE) * 95)));
      }

      const notes = JSON.parse(fullJson);
      setStreamProgress(100);

      // Store notes data in sessionStorage to avoid URL length limits
      sessionStorage.setItem('unsavedNotes', JSON.stringify(notes));

      // Redirect to notes page
      if (contentType === "material") {
        router.push(`/materials/${id}/notes/new`);
      } else {
        router.push(`/lectures/${id}/notes/new`);
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
        streamProgress={streamProgress}
      />

      <div className="flex flex-col space-y-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className={`relative w-full bg-white hover:bg-purple-50 dark:bg-slate-800/80 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-slate-700 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 transition-all group text-left shadow-sm disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden cursor-pointer ${className}`}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="bg-purple-100 dark:bg-purple-900 p-2 sm:p-2.5 md:p-3 rounded-lg">
              <StickyNote className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </div>
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-300 mb-0.5 sm:mb-1">
            {t("buttons.generateStudyNotes")}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-snug">
            {t("buttons.generateStudyNotesDesc")}
          </p>
        </button>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </>
  );
}
