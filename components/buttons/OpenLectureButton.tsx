"use client";

import { useRouter } from "next/navigation";
import { Eye, ChevronRight } from "lucide-react";

type OpenLectureButtonProps = {
  lectureId: string;
  className?: string;
};

export default function OpenLectureButton({
  lectureId,
  className = "",
}: OpenLectureButtonProps) {
  const router = useRouter();

  const handleOpen = () => {
    router.push(`/lectures/${lectureId}/view`);
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      className={`w-full bg-white hover:bg-purple-50 border border-gray-200 rounded-xl p-6 transition-all group text-left shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="bg-purple-100 p-3 rounded-lg">
          <Eye className="w-6 h-6 text-purple-600" />
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Open Transcript
      </h3>
      <p className="text-sm text-gray-600">
        View and read your lecture transcript
      </p>
    </button>
  );
}
