"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileQuestion, ChevronRight } from "lucide-react";
import GenerateQuestionsModal from "../modals/GenerateQuestionsModal";
import GeneratingQuestionsModal from "../modals/GeneratingQuestionsModal";
import ErrorModal from "../modals/ErrorModal";

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
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const handleGenerate = async (count: number, format: QuestionFormat) => {
    setError(null);

    // Close settings modal and open generating modal
    setIsModalOpen(false);
    setIsGenerating(true);

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

      // Close generating modal and redirect to questions page
      setIsGenerating(false);
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
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Unexpected error while generating questions.";

      setError(errorMessage);
      setIsGenerating(false);
      setIsErrorModalOpen(true);
    }
  };

  return (
    <>
      <div className="flex flex-col space-y-2">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={isGenerating}
          className="relative w-full bg-white hover:bg-green-50 dark:bg-slate-800 dark:hover:bg-green-800/20 border border-gray-200 dark:border-slate-700 rounded-xl p-6 transition-all group text-left shadow-sm disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
              <FileQuestion className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300 mb-1">
            Generate Exam Questions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create practice questions and tests from your material
          </p>
        </button>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <GenerateQuestionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={handleGenerate}
        loading={false}
      />

      <GeneratingQuestionsModal isOpen={isGenerating} />

      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => {
          setIsErrorModalOpen(false);
          setError(null);
        }}
        title="Failed to Generate Questions"
        message={error || "An unexpected error occurred. Please try again."}
      />
    </>
  );
}
