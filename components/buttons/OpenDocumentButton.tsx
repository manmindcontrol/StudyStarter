"use client";

import { useRouter } from "next/navigation";
import { Eye, ChevronRight } from "lucide-react";

type OpenDocumentButtonProps = {
  materialId: string;
  className?: string;
};

export default function OpenDocumentButton({
  materialId,
  className = "",
}: OpenDocumentButtonProps) {
  const router = useRouter();

  const handleOpen = () => {
    router.push(`/materials/${materialId}/view`);
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      className={`w-full bg-white hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-slate-700  rounded-xl p-6 transition-all group text-left shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
          <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300 mb-1">
        Open Document
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        View and read your uploaded document
      </p>
    </button>
  );
}
