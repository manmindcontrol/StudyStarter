"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import LoadingSpinner from "../LoadingSpinner";
import { useTranslation } from "@/hooks/useTranslation";

type DeleteButtonProps = {
  materialId?: string;
  lectureId?: string;
  materialTitle?: string;
  itemTitle?: string;
  itemType?: "material" | "lecture";
  redirectTo?: string;
  className?: string;
};

export default function DeleteButton({
  materialId,
  lectureId,
  materialTitle,
  itemTitle,
  itemType = "material",
  redirectTo = "/dashboard",
  className = "",
}: DeleteButtonProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayTitle = itemTitle || materialTitle || `this ${itemType}`;
  const id = materialId || lectureId;
  const tableName = itemType === "lecture" ? "lectures" : "materials";

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${displayTitle}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (!id) throw new Error("No ID provided");

      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      router.push(redirectTo);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to delete ${itemType}`,
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className={`relative w-full bg-white hover:bg-red-50 border dark:bg-slate-800/80 dark:hover:bg-red-800/10 border-gray-200 dark:border-slate-700 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 transition-all group text-left shadow-sm disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${className}`}
      >
        {loading && (
          <div className="absolute inset-0 bg-red-50/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <LoadingSpinner size="md" text={t("buttons.deleting")} />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="bg-red-100 dark:bg-red-900/20 p-2 sm:p-2.5 md:p-3 rounded-lg">
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600 dark:text-red-400" />
          </div>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
        </div>
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-300 mb-0.5 sm:mb-1">
          {itemType === "lecture"
            ? t("buttons.deleteLecture")
            : t("buttons.deleteMaterial")}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-snug">
          {itemType === "lecture"
            ? t("buttons.deleteLectureDesc")
            : t("buttons.deleteMaterialDesc")}
        </p>
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
