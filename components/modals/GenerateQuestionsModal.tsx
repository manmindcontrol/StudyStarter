"use client";

import { useState } from "react";
import {
  X,
  FileQuestion,
  HelpCircle,
  CheckCircle,
  Shuffle,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

type QuestionFormat = "mcq" | "open" | "mixed";

type GenerateQuestionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (count: number, format: QuestionFormat) => void;
  loading?: boolean;
};

export default function GenerateQuestionsModal({
  isOpen,
  onClose,
  onGenerate,
  loading = false,
}: GenerateQuestionsModalProps) {
  const { t } = useTranslation();
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [questionFormat, setQuestionFormat] = useState<QuestionFormat>("mixed");

  if (!isOpen) return null;

  const handleGenerate = () => {
    onGenerate(questionCount, questionFormat);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-green-600 to-emerald-500 dark:bg-linear-to-r dark:from-green-700 dark:to-emerald-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20  p-2 rounded-lg">
                <FileQuestion className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {t("modals.generateQuestions.title")}
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Question Count */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-3">
              {t("modals.generateQuestions.numberOfQuestions")}
            </label>
            <div className="space-y-3">
              <div className="relative">
                <style jsx>{`
                  input[type="range"] {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 100%;
                    height: 8px;
                    border-radius: 9999px;
                    background: linear-gradient(
                      to right,
                      #16a34a 0%,
                      #16a34a ${((questionCount - 5) / (30 - 5)) * 100}%,
                      #e5e7eb ${((questionCount - 5) / (30 - 5)) * 100}%,
                      #e5e7eb 100%
                    );
                    outline: none;
                  }

                  input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #16a34a;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    transition: transform 0.15s ease;
                  }

                  input[type="range"]::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                  }

                  input[type="range"]::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border: none;
                    border-radius: 50%;
                    background: #16a34a;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    transition: transform 0.15s ease;
                  }

                  input[type="range"]::-moz-range-thumb:hover {
                    transform: scale(1.1);
                  }

                  input[type="range"]:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                  }
                `}</style>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  5 {t("modals.generateQuestions.questionsLabel")}
                </span>
                <div className="bg-green-100 dark:bg-green-900/50 px-4 py-2 rounded-lg">
                  <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {questionCount}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  30 {t("modals.generateQuestions.questionsLabel")}
                </span>
              </div>
            </div>
          </div>

          {/* Question Format */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-3">
              {t("modals.generateQuestions.questionType")}
            </label>
            <div className="space-y-3">
              {/* MCQ Option */}
              <button
                type="button"
                onClick={() => setQuestionFormat("mcq")}
                disabled={loading}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all text-left
                  ${
                    questionFormat === "mcq"
                      ? "border-green-500 bg-green-50 dark:bg-green-900/50 dark:border-green-700/50"
                      : "border-gray-200 bg-white dark:bg-slate-700/70 dark:border-slate-700/70 hover:border-gray-300"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`
                    mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                    ${
                      questionFormat === "mcq"
                        ? "border-green-500 bg-green-500 "
                        : "border-gray-300"
                    }
                  `}
                  >
                    {questionFormat === "mcq" && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-semibold text-gray-900 dark:text-gray-300">
                        {t("modals.generateQuestions.mcqTitle")}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("modals.generateQuestions.mcqDesc")}
                    </p>
                  </div>
                </div>
              </button>

              {/* Open Question Option */}
              <button
                type="button"
                onClick={() => setQuestionFormat("open")}
                disabled={loading}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all text-left
                  ${
                    questionFormat === "open"
                      ? "border-green-500 bg-green-50 dark:bg-green-900/50 dark:border-green-700/50"
                      : "border-gray-200 bg-white dark:bg-slate-700/70 dark:border-slate-700/70 hover:border-gray-300"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`
                    mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                    ${
                      questionFormat === "open"
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }
                  `}
                  >
                    {questionFormat === "open" && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <FileQuestion className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="font-semibold text-gray-900 dark:text-gray-300">
                        {t("modals.generateQuestions.openTitle")}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("modals.generateQuestions.openDesc")}
                    </p>
                  </div>
                </div>
              </button>

              {/* Mixed Option */}
              <button
                type="button"
                onClick={() => setQuestionFormat("mixed")}
                disabled={loading}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all text-left
                  ${
                    questionFormat === "mixed"
                      ? "border-green-500 bg-green-50 dark:bg-green-900/50 dark:border-green-700/50"
                      : "border-gray-200 bg-white dark:bg-slate-700/70 dark:border-slate-700/70 hover:border-gray-300"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`
                    mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                    ${
                      questionFormat === "mixed"
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }
                  `}
                  >
                    {questionFormat === "mixed" && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Shuffle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <h3 className="font-semibold text-gray-900 dark:text-gray-300">
                        {t("modals.generateQuestions.mixedTitle")}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("modals.generateQuestions.mixedDesc")}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 dark:border-blue-900/40 dark:bg-blue-900/20 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-900 dark:text-blue-200">
                <p className="font-semibold mb-1">{t("modals.generateQuestions.noteTitle")}</p>
                <p>
                  {t("modals.generateQuestions.noteText")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-800 p-6 rounded-b-2xl border-t border-gray-200 dark:border-slate-700/70">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-white dark:bg-slate-700/70 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("modals.generateQuestions.cancel")}
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 bg-linear-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("modals.generateQuestions.generating")}
                </>
              ) : (
                t("modals.generateQuestions.generate")
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
