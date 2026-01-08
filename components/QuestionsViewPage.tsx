"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";
import {
  FileText,
  CheckCircle2,
  Circle,
  Loader2,
  Download,
  FileDown,
  Save,
  Check,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import SlidingChatPanel from "./SlidingChatPanel";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";

type GeneratedQuestion = {
  question: string;
  type: "open" | "mcq";
  options: string[] | null;
  answer: string | null;
};

type QuestionRecord = {
  id: string;
  material_id: string;
  user_id: string;
  question_type: string;
  questions: GeneratedQuestion[];
  created_at: string;
};

type Material = {
  id: string;
  title: string;
  content: string | null;
  file_name: string | null;
  storage_path: string | null;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  materialId: string;
  questionRecordId: string;
};

export default function QuestionsViewPage({
  materialId,
  questionRecordId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [material, setMaterial] = useState<Material | null>(null);
  const [questionRecord, setQuestionRecord] = useState<QuestionRecord | null>(
    null
  );
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(
    new Set()
  );
  const [saving, setSaving] = useState(false);
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [savedQuestionId, setSavedQuestionId] = useState<string | null>(null);

  // Quiz state - track user answers and validation
  type QuizAnswer = {
    userAnswer: string;
    isCorrect: boolean | null;
    isChecked: boolean;
    feedback?: string;
  };
  const [quizAnswers, setQuizAnswers] = useState<Map<number, QuizAnswer>>(
    new Map()
  );
  const [openAnswerInputs, setOpenAnswerInputs] = useState<Map<number, string>>(
    new Map()
  );
  const [checkingAnswer, setCheckingAnswer] = useState<number | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const { user } = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // Load material
      const { data: materialData, error: materialError } = await supabase
        .from("materials")
        .select("*")
        .eq("id", materialId)
        .single();

      if (materialError || !materialData) {
        console.error("Material error:", materialError);
        setLoading(false);
        return;
      }

      setMaterial(materialData);

      // Check if this is unsaved data (questionRecordId === "new")
      if (questionRecordId === "new") {
        const unsavedData = searchParams.get("data");
        const questionType = searchParams.get("type") || "exam";

        if (unsavedData) {
          const parsedQuestions = JSON.parse(
            decodeURIComponent(unsavedData)
          ) as GeneratedQuestion[];
          setQuestionRecord({
            id: "new",
            material_id: materialId,
            user_id: user.id,
            question_type: questionType,
            questions: parsedQuestions,
            created_at: new Date().toISOString(),
          });
          setIsUnsaved(true);
          setLoading(false);

          // Initial chat message for unsaved questions
          setChatMessages([
            {
              role: "assistant",
              content: `Hello! I've generated ${parsedQuestions.length} questions from the material "${materialData.title}". You can save them using the Save button above, or I can help you modify questions, add new ones, or explain answers. What do you need?`,
            },
          ]);
        } else {
          setLoading(false);
        }
      } else {
        // Load existing question record from database
        const { data: questionData, error: questionError } = await supabase
          .from("generated_questions")
          .select("*")
          .eq("id", questionRecordId)
          .single();

        if (questionError || !questionData) {
          console.error("Question error:", questionError);
          setLoading(false);
          return;
        }

        setQuestionRecord(questionData);
        setIsUnsaved(false);
        setLoading(false);

        // Initial chat message for saved questions
        setChatMessages([
          {
            role: "assistant",
            content: `Hello! I've loaded ${questionData.questions.length} questions from the material "${materialData.title}". I can help you modify questions, add new ones, or explain answers. What do you need?`,
          },
        ]);
      }
    };

    loadData();
  }, [materialId, questionRecordId, router, searchParams]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);

  const toggleQuestion = (index: number) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedQuestions(newSelected);
  };

  // Handle MCQ answer selection
  const handleMCQAnswer = (
    questionIndex: number,
    selectedAnswer: string,
    correctAnswer: string | null
  ) => {
    if (!correctAnswer) {
      const newAnswers = new Map(quizAnswers);
      newAnswers.set(questionIndex, {
        userAnswer: selectedAnswer,
        isCorrect: null,
        isChecked: true,
      });
      setQuizAnswers(newAnswers);
      return;
    }

    // Extract the option text from the correct answer format: "b) Option text - Explanation"
    // The correct answer format is: "letter) full option text - explanation"
    const answerMatch = correctAnswer.match(/^[a-d]\)\s*(.+?)\s*-/i);
    const correctOptionText = answerMatch ? answerMatch[1].trim() : null;

    // Check if the selected answer matches the correct option text
    const isCorrect = correctOptionText
      ? selectedAnswer.trim() === correctOptionText.trim()
      : selectedAnswer === correctAnswer;

    const newAnswers = new Map(quizAnswers);
    newAnswers.set(questionIndex, {
      userAnswer: selectedAnswer,
      isCorrect,
      isChecked: true,
    });
    setQuizAnswers(newAnswers);
  };

  // Handle open question answer submission
  const handleOpenAnswerSubmit = async (
    questionIndex: number,
    question: GeneratedQuestion
  ) => {
    const userAnswer = openAnswerInputs.get(questionIndex) || "";
    if (!userAnswer.trim()) return;

    setCheckingAnswer(questionIndex);

    try {
      // Call API to validate answer
      const response = await fetch("/api/validate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.question,
          userAnswer: userAnswer.trim(),
          correctAnswer: question.answer,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to validate answer");
      }

      const data = await response.json();

      const newAnswers = new Map(quizAnswers);
      newAnswers.set(questionIndex, {
        userAnswer: userAnswer.trim(),
        isCorrect: data.isCorrect,
        isChecked: true,
        feedback: data.feedback,
      });
      setQuizAnswers(newAnswers);
    } catch (error) {
      console.error("Error validating answer:", error);
      // Fallback - just mark as checked without validation
      const newAnswers = new Map(quizAnswers);
      newAnswers.set(questionIndex, {
        userAnswer: userAnswer.trim(),
        isCorrect: null,
        isChecked: true,
        feedback:
          "Could not validate answer. Please check the correct answer below.",
      });
      setQuizAnswers(newAnswers);
    } finally {
      setCheckingAnswer(null);
    }
  };

  // Update open answer input
  const updateOpenAnswerInput = (questionIndex: number, value: string) => {
    const newInputs = new Map(openAnswerInputs);
    newInputs.set(questionIndex, value);
    setOpenAnswerInputs(newInputs);
  };

  const handleChatSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatLoading(true);

    // Add user message
    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: "user", content: userMessage },
    ];
    setChatMessages(newMessages);

    try {
      // Call OpenAI API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          questions: questionRecord?.questions,
          materialTitle: material?.title,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      setChatMessages([
        ...newMessages,
        { role: "assistant", content: data.message },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, an error occurred. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const exportQuestions = () => {
    if (!questionRecord) return;

    const text = questionRecord.questions
      .map((q, i) => {
        let formatted = `${i + 1}. ${q.question}\n\n`;
        if (q.type === "mcq" && q.options) {
          q.options.forEach((opt, idx) => {
            formatted += `   ${String.fromCharCode(97 + idx)}) ${opt}\n`;
          });
          formatted += "\n";
        }
        if (q.answer) {
          formatted += `   ✓ Správna odpoveď: ${q.answer}\n`;
        }
        return formatted + "\n";
      })
      .join("");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `questions-${material?.title || "export"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveQuestions = async () => {
    if (!questionRecord || !isUnsaved) return;

    setSaving(true);
    try {
      if (!user) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `/api/materials/${materialId}/questions/save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questions: questionRecord.questions,
            questionType: questionRecord.question_type,
            userId: user.id,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save questions");
      }

      // Update state to show saved status without redirecting
      setSavedQuestionId(data.record.id);
      setIsUnsaved(false);
      setSaving(false);
    } catch (error) {
      console.error("Error saving questions:", error);
      alert("Failed to save questions. Please try again.");
      setSaving(false);
    }
  };

  const exportToWord = async () => {
    if (!questionRecord || !material) return;

    const children: Paragraph[] = [];

    // Title
    children.push(
      new Paragraph({
        text: material.title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Subtitle
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated Questions (${questionRecord.questions.length})`,
            bold: true,
            size: 24,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Date
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Date: ${new Date().toLocaleDateString("en-US")}`,
            italics: true,
            size: 20,
          }),
        ],
        spacing: { after: 600 },
      })
    );

    // Questions
    questionRecord.questions.forEach((q, index) => {
      // Question number and text
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. `,
              bold: true,
              size: 24,
            }),
            new TextRun({
              text: q.question,
              size: 24,
            }),
          ],
          spacing: { before: 300, after: 200 },
        })
      );

      // Question type badge
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: q.type === "mcq" ? "[Multiple Choice]" : "[Open Question]",
              italics: true,
              size: 20,
              color: q.type === "mcq" ? "9333EA" : "16A34A",
            }),
          ],
          spacing: { after: 200 },
        })
      );

      // MCQ options
      if (q.type === "mcq" && q.options) {
        q.options.forEach((opt, optIdx) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `   ${String.fromCharCode(97 + optIdx)}) ${opt}`,
                  size: 22,
                }),
              ],
              spacing: { after: 100 },
            })
          );
        });
      }

      // Answer
      if (q.answer) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "✓ Správna odpoveď: ",
                bold: true,
                size: 22,
                color: "059669",
              }),
              new TextRun({
                text: q.answer,
                size: 22,
                color: "059669",
              }),
            ],
            spacing: { before: 200, after: 400 },
          })
        );
      } else {
        children.push(
          new Paragraph({
            text: "",
            spacing: { after: 400 },
          })
        );
      }
    });

    // Footer
    children.push(
      new Paragraph({
        text: "",
        spacing: { before: 800 },
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Generated with AI assistant",
            italics: true,
            size: 18,
            color: "666666",
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `questions-${material.title}.docx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-gray-100 to-cyan-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (!questionRecord || !material) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-gray-100 to-cyan-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t("questionsView.questionsNotFound")}
          </h2>
          <button
            onClick={() => router.push("/materials")}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            {t("questionsView.backToMaterials")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-gray-100 to-cyan-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="container-custom py-3 sm:py-4 md:py-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <button
                onClick={() => router.push(`/materials/${materialId}`)}
                className="p-2.5 sm:p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white group rounded-lg transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                  {material.title}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {questionRecord.questions.length}{" "}
                  {t("questionsView.questions")}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              {/* Chat Toggle Button - Mobile Only */}
              <button
                onClick={() => setIsChatOpen(true)}
                className="md:hidden px-3 sm:px-4 py-2.5 sm:py-3 bg-linear-to-br from-blue-600 to-purple-600 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shrink-0 relative"
              >
                {t("questionsView.ai")}
                {chatMessages.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                    {chatMessages.length}
                  </span>
                )}
              </button>
              {/* Save button - only visible for unsaved questions */}
              {isUnsaved ? (
                <button
                  onClick={handleSaveQuestions}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 bg-linear-to-br from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Save className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                  <span className="hidden sm:inline">
                    {saving
                      ? t("questionsView.saving")
                      : t("questionsView.saveQuestions")}
                  </span>
                </button>
              ) : (
                savedQuestionId && (
                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-2 bg-green-100 text-green-500 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold cursor-default"
                  >
                    <Check className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                    <span className="hidden sm:inline">
                      {t("questionsView.questionsSaved")}
                    </span>
                  </button>
                )
              )}

              {/* Export dropdown */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="inline-flex items-center justify-center text-white gap-2 bg-linear-to-br from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer "
                >
                  <Download className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
                  <span className="hidden sm:inline">
                    {t("questionsView.downloadQuestions")}
                  </span>
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-20">
                    <button
                      onClick={() => {
                        exportToWord();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center space-x-2 transition-colors"
                    >
                      <FileDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                        {t("questionsView.wordDocx")}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        exportQuestions();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center space-x-2 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                        {t("questionsView.textTxt")}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container-custom py-3 sm:py-4 md:py-6 px-3 sm:px-4">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Questions panel - 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <div className="">
              <div className="space-y-3 sm:space-y-4">
                {questionRecord.questions.map((q, index) => {
                  const quizAnswer = quizAnswers.get(index);
                  const isAnswered = quizAnswer?.isChecked || false;

                  return (
                    <div
                      key={index}
                      className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/70"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3">
                          <span className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">
                            {index + 1}.
                          </span>
                          <span
                            className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                              q.type === "mcq"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            }`}
                          >
                            {q.type === "mcq"
                              ? t("questionsView.multipleChoice")
                              : t("questionsView.open")}
                          </span>
                        </div>
                        <p className="text-gray-900 dark:text-gray-200 mb-3 sm:mb-4 font-medium text-sm sm:text-base leading-tight">
                          {q.question}
                        </p>

                        {/* MCQ Options */}
                        {q.type === "mcq" && q.options && (
                          <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                            {q.options.map((option, optIdx) => {
                              const optionLetter = String.fromCharCode(
                                97 + optIdx
                              );
                              const isSelected =
                                quizAnswer?.userAnswer === option;

                              // Extract correct option text from answer format: "b) Option text - Explanation"
                              let isCorrectOption = false;
                              if (q.answer) {
                                const answerMatch =
                                  q.answer.match(/^[a-d]\)\s*(.+?)\s*-/i);
                                const correctOptionText = answerMatch
                                  ? answerMatch[1].trim()
                                  : null;
                                isCorrectOption = correctOptionText
                                  ? option.trim() === correctOptionText
                                  : false;
                              }

                              const showResult = isAnswered;

                              let buttonStyle =
                                "border-gray-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20";
                              if (showResult) {
                                if (isSelected && isCorrectOption) {
                                  buttonStyle =
                                    "border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-900/30";
                                } else if (isSelected && !isCorrectOption) {
                                  buttonStyle =
                                    "border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/30";
                                } else if (isCorrectOption) {
                                  buttonStyle =
                                    "border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-900/30";
                                } else {
                                  buttonStyle =
                                    "border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50";
                                }
                              } else if (isSelected) {
                                buttonStyle =
                                  "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30";
                              }

                              return (
                                <button
                                  key={optIdx}
                                  onClick={() =>
                                    !isAnswered &&
                                    handleMCQAnswer(index, option, q.answer)
                                  }
                                  disabled={isAnswered}
                                  className={`w-full flex items-start text-gray-700 dark:text-gray-400 space-x-2 sm:space-x-3 text-left p-2 sm:p-2.5 md:p-3 rounded-lg border-1 transition-all ${buttonStyle} ${
                                    !isAnswered
                                      ? "cursor-pointer"
                                      : "cursor-default"
                                  }`}
                                >
                                  <span className="font-bold text-sm sm:text-base min-w-5 sm:min-w-6 leading-tight">
                                    {optionLetter}
                                  </span>
                                  <span className="flex-1 text-gray-900 dark:text-gray-300 text-xs sm:text-sm md:text-base leading-tight">
                                    {option}
                                  </span>
                                  {showResult && isCorrectOption && (
                                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Open Question Input */}
                        {q.type === "open" && !isAnswered && (
                          <div className="mb-2 sm:mb-3">
                            <textarea
                              value={openAnswerInputs.get(index) || ""}
                              onChange={(e) =>
                                updateOpenAnswerInput(index, e.target.value)
                              }
                              placeholder={t("questionsView.typeYourAnswer")}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none text-xs sm:text-sm text-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all resize-none"
                              rows={3}
                              disabled={checkingAnswer === index}
                            />
                            <button
                              onClick={() => handleOpenAnswerSubmit(index, q)}
                              disabled={
                                !openAnswerInputs.get(index)?.trim() ||
                                checkingAnswer === index
                              }
                              className="mt-1.5 sm:mt-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 sm:space-x-2"
                            >
                              {checkingAnswer === index ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                                  <span>{t("questionsView.checking")}</span>
                                </>
                              ) : (
                                <>
                                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span>{t("questionsView.submitAnswer")}</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Show user's answer for open questions */}
                        {q.type === "open" && isAnswered && quizAnswer && (
                          <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/30 rounded-lg">
                            <div className="font-semibold text-blue-900 dark:text-blue-300 mb-1 text-xs sm:text-sm">
                              {t("questionsView.yourAnswer")}:
                            </div>
                            <div className="text-blue-800 dark:text-blue-200 text-xs sm:text-sm leading-tight">
                              {quizAnswer.userAnswer}
                            </div>
                            {quizAnswer.feedback && (
                              <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 italic">
                                {quizAnswer.feedback}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Show correct answer after user has answered */}
                        {isAnswered && q.answer && (
                          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/30 rounded-lg">
                            <div className="flex items-start space-x-1.5 sm:space-x-2">
                              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="font-semibold text-green-700 dark:text-green-300 text-xs sm:text-sm">
                                  {t("questionsView.correctAnswer")}:
                                </span>
                                <p className="text-green-800 dark:text-green-200 mt-0.5 sm:mt-1 text-xs sm:text-sm leading-tight">
                                  {q.answer}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Show result feedback for MCQ */}
                        {q.type === "mcq" && isAnswered && quizAnswer && (
                          <div
                            className={`mt-2 sm:mt-3 p-2 sm:p-3 rounded-lg border ${
                              quizAnswer.isCorrect
                                ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700/30"
                                : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/30"
                            }`}
                          >
                            <div className="flex items-center space-x-1.5 sm:space-x-2">
                              {quizAnswer.isCorrect ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                                  <span className="font-semibold text-green-700 dark:text-green-300 text-xs sm:text-sm">
                                    {t("questionsView.correct")}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                                  <span className="font-semibold text-red-700 dark:text-red-300 text-xs sm:text-sm">
                                    {t("questionsView.incorrect")}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chat panel - Sliding Panel Component */}
          <div className="lg:col-span-1 ">
            <SlidingChatPanel
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              messages={chatMessages}
              inputMessage={chatInput}
              onInputChange={setChatInput}
              onSendMessage={() => handleChatSubmit()}
              isSending={chatLoading}
              title={t("questionsView.aiAssistant")}
              subtitle={t("questionsView.aiAssistantSubtitle")}
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e0f2fe;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #2563eb 0%, #06b6d4 100%);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3b82f6 0%, #22d3ee 100%);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #1d4ed8 0%, #0891b2 100%);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #2563eb 0%, #06b6d4 100%);
        }
      `}</style>
    </div>
  );
}
