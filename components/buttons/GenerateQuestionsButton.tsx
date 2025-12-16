"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileQuestion, ChevronRight } from "lucide-react";
import GenerateQuestionsModal from "../modals/GenerateQuestionsModal";

type QuestionType = "exam" | "test" | "summary";
type QuestionFormat = "mcq" | "open" | "mixed";

export type GeneratedQuestion = {
  question: string;
  type: "open" | "mcq";
  options: string[] | null;
  answer: string | null;
};

type GenerateQuestionsButtonProps = {
  materialId?: string;
  lectureId?: string;
  contentType?: "material" | "lecture";
  questionType?: QuestionType; // default "exam"
  lang?: string; // e.g. "en", "sk" ... optional
  onGenerated?: (questions: GeneratedQuestion[]) => void;
};

export default function GenerateQuestionsButton({
  materialId,
  lectureId,
  contentType = "material",
  questionType = "exam",
  lang,
  onGenerated,
}: GenerateQuestionsButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerate = async (count: number, format: QuestionFormat) => {
    setError(null);
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("type", questionType);
      params.set("count", count.toString());
      params.set("format", format);
      if (lang) {
        params.set("lang", lang);
      }

      const id = materialId || lectureId;
      const apiPath =
        contentType === "lecture"
          ? `/api/lectures/${id}/generate-questions`
          : `/api/materials/${id}/generate-questions`;

      const res = await fetch(`${apiPath}?${params.toString()}`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate questions.");
      }

      const questions = data.questions as GeneratedQuestion[];
      if (onGenerated) {
        onGenerated(questions);
      }

      // Close modal and redirect to questions page with unsaved data
      setIsModalOpen(false);
      const questionsParam = encodeURIComponent(JSON.stringify(questions));
      if (contentType === "material") {
        router.push(
          `/materials/${id}/questions/new?data=${questionsParam}&type=${questionType}`
        );
      } else {
        router.push(
          `/lectures/${id}/questions/new?data=${questionsParam}&type=${questionType}`
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unexpected error while generating questions."
      );
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col space-y-2">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={loading}
          className="relative w-full bg-white hover:bg-green-50 border border-gray-200 rounded-xl p-6 transition-all group text-left shadow-sm disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <FileQuestion className="w-6 h-6 text-green-600" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Generate Exam Questions
          </h3>
          <p className="text-sm text-gray-600">
            Create practice questions and tests from your material
          </p>
        </button>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <GenerateQuestionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={handleGenerate}
        loading={loading}
      />
    </>
  );
}
