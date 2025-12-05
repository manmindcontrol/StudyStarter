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
      className={`w-full bg-white hover:bg-blue-50 border border-gray-200 rounded-xl p-6 transition-all group text-left shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="bg-blue-100 p-3 rounded-lg">
          <Eye className="w-6 h-6 text-blue-600" />
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Open Document
      </h3>
      <p className="text-sm text-gray-600">
        View and read your uploaded document
      </p>
    </button>
  );
}
