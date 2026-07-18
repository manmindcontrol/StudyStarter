"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileQuestion, ChevronRight } from "lucide-react";
import GenerateQuestionsModal from "../modals/GenerateQuestionsModal";
import GeneratingQuestionsModal from "../modals/GeneratingQuestionsModal";
import ErrorModal from "../modals/ErrorModal";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/lib/supabase";

type QuestionType = "exam" | "test" | "summary";
type QuestionFormat = "mcq" | "open" | "mixed";
type AcademicLevel = "standard" | "advanced" | "expert";

export type GeneratedQuestion = {
  question: string;
  type: "open" | "mcq";
  options: string[] | null;
  answer: string | null;
  difficulty?: "easy" | "medium" | "hard";
  bloom_level?:
    | "remember"
    | "understand"
    | "apply"
    | "analyze"
    | "evaluate"
    | "create";
  topic?: string;
  rubric?: string[] | null;
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
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const handleGenerate = async (
    count: number,
    format: QuestionFormat,
    difficulty: AcademicLevel,
  ) => {
    setError(null);

    // Close settings modal and open generating modal
    setIsModalOpen(false);
    setIsGenerating(true);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to generate questions");
      }

      const params = new URLSearchParams();
      params.set("type", questionType);
      params.set("count", count.toString());
      params.set("format", format);
      params.set("difficulty", difficulty);
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
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
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

      // Store questions data in sessionStorage to avoid URL length limits
      sessionStorage.setItem('unsavedQuestions', JSON.stringify(questions));

      if (contentType === "material") {
        router.push(
          `/materials/${id}/questions/new?type=${questionType}`
        );
      } else {
        router.push(
          `/lectures/${id}/questions/new?type=${questionType}`
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
          className="relative w-full bg-white hover:bg-green-50 dark:bg-slate-800/80 dark:hover:bg-green-900/20 border border-gray-200 dark:border-slate-700 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 transition-all group text-left shadow-sm disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="bg-green-100 dark:bg-green-900 p-2 sm:p-2.5 md:p-3 rounded-lg">
              <FileQuestion className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" />
            </div>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
          </div>
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-300 mb-0.5 sm:mb-1">
            {t("buttons.generateExamQuestions")}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-snug">
            {t("buttons.generateExamQuestionsDesc")}
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
