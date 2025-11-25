"use client";

import { useState } from "react";

type QuestionType = "exam" | "test" | "summary";

export type GeneratedQuestion = {
  question: string;
  type: "open" | "mcq";
  options: string[] | null;
  answer: string | null;
};

type GenerateQuestionsButtonProps = {
  materialId: string;
  questionType?: QuestionType; // default "exam"
  lang?: string; // e.g. "en", "sk" ... optional
  onGenerated?: (questions: GeneratedQuestion[]) => void;
};

export default function GenerateQuestionsButton({
  materialId,
  questionType = "exam",
  lang,
  onGenerated,
}: GenerateQuestionsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleClick = async () => {
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("type", questionType);
      if (lang) {
        params.set("lang", lang);
      }

      const res = await fetch(
        `/api/materials/${materialId}/generate-questions?${params.toString()}`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate questions.");
      }

      const questions = data.questions as GeneratedQuestion[];
      if (onGenerated) {
        onGenerated(questions);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unexpected error while generating questions."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Generating questions..." : "Generate exam questions"}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {success && (
        <p className="text-xs text-emerald-600">
          Questions generated and saved.
        </p>
      )}
    </div>
  );
}
