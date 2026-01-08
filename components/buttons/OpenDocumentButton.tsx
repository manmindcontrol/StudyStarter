"use client";

import { useRouter } from "next/navigation";
import { Eye, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

type OpenDocumentButtonProps = {
  materialId: string;
  className?: string;
};

export default function OpenDocumentButton({
  materialId,
  className = "",
}: OpenDocumentButtonProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const handleOpen = () => {
    router.push(`/materials/${materialId}/view`);
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      className={`w-full bg-white hover:bg-blue-50 dark:bg-slate-800/80 dark:hover:bg-slate-700/40 border border-gray-200 dark:border-slate-700 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 transition-all group text-left shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="bg-blue-100 dark:bg-blue-900 p-2 sm:p-2.5 md:p-3 rounded-lg">
          <Eye className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>
      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-300 mb-0.5 sm:mb-1">
        {t("buttons.openDocument")}
      </h3>
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-snug">
        {t("buttons.openDocumentDesc")}
      </p>
    </button>
  );
}
