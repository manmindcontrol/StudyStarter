"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Download,
  FileDown,
  Save,
  Check,
  ArrowLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  Plus,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import SlidingChatPanel from "./SlidingChatPanel";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";
import { buildExportBlocks, type ExportVariant } from "@/lib/questionsExport";

type GeneratedQuestion = {
  question: string;
  type: "open" | "mcq";
  options: string[] | null;
  answer: string | null;
  // Academic metadata (optional — older saved records don't include them)
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

const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const BLOOM_LEVELS = [
  "remember",
  "understand",
  "apply",
  "analyze",
  "evaluate",
  "create",
] as const;

// MCQ answers are stored as "b) Option text - Rationale". Editing the options or
// switching the key means this string has to be rebuilt, otherwise answer
// checking would grade against stale text.
//
// The correct option is resolved from the leading letter against the options
// array rather than by splitting the string on " - ", because option text may
// itself contain " - " (a dash-separated clause, a date range, a formula).
const correctOptionIndex = (
  answer: string | null,
  options: string[] | null,
): number | null => {
  if (!answer || !options || options.length === 0) return null;

  const letter = answer.match(/^\s*([a-z])\)/i);
  if (letter) {
    const idx = letter[1].toLowerCase().charCodeAt(0) - 97;
    if (idx >= 0 && idx < options.length) return idx;
  }

  // No usable letter — fall back to whichever option the answer quotes
  const quoted = options.findIndex(
    (o) => o.trim().length > 0 && answer.includes(o.trim()),
  );
  return quoted >= 0 ? quoted : null;
};

// Strips "b) Option text - " off the front, leaving just the rationale.
const parseMcqAnswer = (answer: string | null, options: string[] | null) => {
  const idx = correctOptionIndex(answer, options);
  const correctIdx = idx ?? 0;
  if (!answer) return { correctIdx, rationale: "" };

  const optionText = options?.[correctIdx]?.trim();
  if (optionText) {
    const prefix = `${String.fromCharCode(97 + correctIdx)}) ${optionText}`;
    if (answer.trim().startsWith(prefix)) {
      return {
        correctIdx,
        rationale: answer.trim().slice(prefix.length).replace(/^\s*-\s*/, ""),
      };
    }
  }

  // Unexpected shape — keep everything after the first " - " as the rationale
  const loose = answer.match(/^[a-z]\)\s*.+?\s+-\s+([\s\S]*)$/i);
  return { correctIdx, rationale: loose ? loose[1].trim() : "" };
};

const buildMcqAnswer = (
  options: string[],
  correctIdx: number,
  rationale: string,
) =>
  `${String.fromCharCode(97 + correctIdx)}) ${options[correctIdx].trim()} - ${rationale.trim()}`;

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
    null,
  );
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(
    new Set(),
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
    score?: number | null;
    verdict?: "correct" | "partial" | "incorrect" | null;
  };
  const [quizAnswers, setQuizAnswers] = useState<Map<number, QuizAnswer>>(
    new Map(),
  );
  const [openAnswerInputs, setOpenAnswerInputs] = useState<Map<number, string>>(
    new Map(),
  );
  const [checkingAnswer, setCheckingAnswer] = useState<number | null>(null);

  // Manual editing state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<GeneratedQuestion | null>(null);
  const [draftCorrectIdx, setDraftCorrectIdx] = useState(0);
  const [draftRationale, setDraftRationale] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [hasEdits, setHasEdits] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editsSaved, setEditsSaved] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(
    null,
  );
  // Index of a freshly added question that is not confirmed yet — cancelling
  // its edit form removes it again instead of leaving a blank question behind.
  const [pendingNewIndex, setPendingNewIndex] = useState<number | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [conversationId] = useState<string>(() => crypto.randomUUID()); // Generate conversation ID once

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
        const questionType = searchParams.get("type") || "exam";

        // Try to get data from sessionStorage first (preferred method)
        const unsavedDataFromStorage =
          sessionStorage.getItem("unsavedQuestions");
        let parsedQuestions: GeneratedQuestion[] | null = null;

        if (unsavedDataFromStorage) {
          parsedQuestions = JSON.parse(
            unsavedDataFromStorage,
          ) as GeneratedQuestion[];
          // Clear the sessionStorage after reading
          sessionStorage.removeItem("unsavedQuestions");
        } else {
          // Fallback to URL parameter for backward compatibility
          const unsavedData = searchParams.get("data");
          if (unsavedData) {
            parsedQuestions = JSON.parse(
              decodeURIComponent(unsavedData),
            ) as GeneratedQuestion[];
          }
        }

        if (parsedQuestions) {
          setQuestionRecord({
            id: "new",
            material_id: materialId,
            user_id: user.id,
            question_type: questionType,
            questions: parsedQuestions,
            created_at: new Date().toISOString(),
          });
          setIsUnsaved(true);
        }

        setLoading(false);
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
      }

      // Load chat history from database
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          const response = await fetch(
            `/api/chat/history?conversationId=${conversationId}`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            },
          );

          if (response.ok) {
            const historyData = await response.json();
            if (historyData.messages && historyData.messages.length > 0) {
              setChatMessages(historyData.messages);
            } else {
              // Add initial assistant message if no history
              setChatMessages([
                {
                  role: "assistant",
                  content: materialData?.title
                    ? t("questionsView.chatGreeting", {
                        title: materialData.title,
                      })
                    : t("questionsView.chatGreetingDefault"),
                },
              ]);
            }
          }
        }
      } catch (historyError) {
        console.error("Error loading chat history:", historyError);
        // Fallback to initial message
        setChatMessages([
          {
            role: "assistant",
            content: t("questionsView.chatGreetingDefault"),
          },
        ]);
      }
    };

    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId, questionRecordId, router, searchParams, conversationId]);

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

  const _toggleQuestion = (index: number) => {
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
    selectedIdx: number,
    question: GeneratedQuestion,
  ) => {
    const selectedAnswer = question.options?.[selectedIdx] ?? "";
    const correctIdx = correctOptionIndex(question.answer, question.options);

    const newAnswers = new Map(quizAnswers);
    newAnswers.set(questionIndex, {
      userAnswer: selectedAnswer,
      isCorrect: correctIdx === null ? null : selectedIdx === correctIdx,
      isChecked: true,
    });
    setQuizAnswers(newAnswers);
  };

  // Handle open question answer submission
  const handleOpenAnswerSubmit = async (
    questionIndex: number,
    question: GeneratedQuestion,
  ) => {
    const userAnswer = openAnswerInputs.get(questionIndex) || "";
    if (!userAnswer.trim()) return;

    setCheckingAnswer(questionIndex);

    try {
      // Call API to validate answer
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/validate-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          question: question.question,
          userAnswer: userAnswer.trim(),
          correctAnswer: question.answer,
          rubric: question.rubric ?? null,
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
        score: typeof data.score === "number" ? data.score : null,
        verdict: data.verdict ?? null,
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
        feedback: t("questionsView.validationError"),
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

  // --- Manual editing -------------------------------------------------

  const startEditing = (index: number) => {
    if (!questionRecord) return;
    const q = questionRecord.questions[index];
    setEditingIndex(index);
    setEditError(null);
    // Deep copy so cancelling leaves the original untouched
    setDraft({
      ...q,
      options: q.options ? [...q.options] : null,
      rubric: q.rubric ? [...q.rubric] : null,
    });
    if (q.type === "mcq") {
      const { correctIdx, rationale } = parseMcqAnswer(q.answer, q.options);
      setDraftCorrectIdx(correctIdx);
      setDraftRationale(rationale);
    } else {
      setDraftCorrectIdx(0);
      setDraftRationale("");
    }
  };

  const cancelEditing = () => {
    // A newly added question that was never confirmed should not linger
    if (pendingNewIndex !== null && questionRecord) {
      setQuestionRecord({
        ...questionRecord,
        questions: questionRecord.questions.filter(
          (_, i) => i !== pendingNewIndex,
        ),
      });
      setPendingNewIndex(null);
    }
    setEditingIndex(null);
    setDraft(null);
    setEditError(null);
  };

  const addQuestion = (type: "open" | "mcq") => {
    if (!questionRecord) return;

    const blank: GeneratedQuestion =
      type === "mcq"
        ? {
            question: "",
            type: "mcq",
            options: ["", "", "", ""],
            answer: null,
            difficulty: "medium",
            bloom_level: "understand",
            topic: "",
            rubric: null,
          }
        : {
            question: "",
            type: "open",
            options: null,
            answer: "",
            difficulty: "medium",
            bloom_level: "analyze",
            topic: "",
            rubric: [""],
          };

    const questions = [...questionRecord.questions, blank];
    setQuestionRecord({ ...questionRecord, questions });

    const newIndex = questions.length - 1;
    setPendingNewIndex(newIndex);
    setEditingIndex(newIndex);
    setDraft({
      ...blank,
      options: blank.options ? [...blank.options] : null,
      rubric: blank.rubric ? [...blank.rubric] : null,
    });
    setDraftCorrectIdx(0);
    setDraftRationale("");
    setEditError(null);
    setShowAddModal(false);
  };

  const updateDraft = (patch: Partial<GeneratedQuestion>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const updateDraftOption = (optIdx: number, value: string) => {
    setDraft((prev) => {
      if (!prev || !prev.options) return prev;
      const options = [...prev.options];
      options[optIdx] = value;
      return { ...prev, options };
    });
  };

  const updateDraftCriterion = (cIdx: number, value: string) => {
    setDraft((prev) => {
      if (!prev || !prev.rubric) return prev;
      const rubric = [...prev.rubric];
      rubric[cIdx] = value;
      return { ...prev, rubric };
    });
  };

  const addDraftCriterion = () => {
    setDraft((prev) =>
      prev ? { ...prev, rubric: [...(prev.rubric || []), ""] } : prev,
    );
  };

  const removeDraftCriterion = (cIdx: number) => {
    setDraft((prev) =>
      prev && prev.rubric
        ? { ...prev, rubric: prev.rubric.filter((_, i) => i !== cIdx) }
        : prev,
    );
  };

  const commitEditing = () => {
    if (!draft || !questionRecord || editingIndex === null) return;

    if (!draft.question.trim()) {
      setEditError(t("questionsView.questionRequired"));
      return;
    }

    let edited: GeneratedQuestion;
    if (draft.type === "mcq") {
      const options = (draft.options || []).map((o) => o.trim());
      if (options.length !== 4 || options.some((o) => !o)) {
        setEditError(t("questionsView.optionsRequired"));
        return;
      }
      edited = {
        ...draft,
        question: draft.question.trim(),
        options,
        answer: buildMcqAnswer(options, draftCorrectIdx, draftRationale),
        rubric: null,
      };
    } else {
      const rubric = (draft.rubric || [])
        .map((c) => c.trim())
        .filter(Boolean);
      edited = {
        ...draft,
        question: draft.question.trim(),
        options: null,
        answer: draft.answer?.trim() || null,
        rubric: rubric.length > 0 ? rubric : null,
      };
    }

    const questions = [...questionRecord.questions];
    questions[editingIndex] = edited;
    setQuestionRecord({ ...questionRecord, questions });

    // An edited question invalidates any answer already given for it
    const nextAnswers = new Map(quizAnswers);
    nextAnswers.delete(editingIndex);
    setQuizAnswers(nextAnswers);
    const nextInputs = new Map(openAnswerInputs);
    nextInputs.delete(editingIndex);
    setOpenAnswerInputs(nextInputs);

    setHasEdits(true);
    setEditsSaved(false);
    // Confirmed — the question stays, so clear edit state without the
    // discard-new-question behaviour of cancelEditing()
    setPendingNewIndex(null);
    setEditingIndex(null);
    setDraft(null);
    setEditError(null);
  };

  const deleteQuestion = (index: number) => {
    if (!questionRecord) return;
    if (questionRecord.questions.length <= 1) return;

    const questions = questionRecord.questions.filter((_, i) => i !== index);
    setQuestionRecord({ ...questionRecord, questions });

    // Answers are keyed by position, so everything after the gap shifts down
    const shift = <T,>(map: Map<number, T>) => {
      const next = new Map<number, T>();
      map.forEach((value, key) => {
        if (key < index) next.set(key, value);
        else if (key > index) next.set(key - 1, value);
      });
      return next;
    };
    setQuizAnswers(shift(quizAnswers));
    setOpenAnswerInputs(shift(openAnswerInputs));

    // The list just shifted, so any open edit form points at the wrong item
    setPendingNewIndex(null);
    setEditingIndex(null);
    setDraft(null);
    setEditError(null);
    setHasEdits(true);
    setEditsSaved(false);
    setPendingDeleteIndex(null);
  };

  // Persists edits to an already-saved record (unsaved records use the
  // normal Save button, which posts the current in-memory questions).
  const handleSaveEdits = async () => {
    if (!questionRecord) return;
    const recordId =
      savedQuestionId || (questionRecordId !== "new" ? questionRecordId : null);
    if (!recordId) return;

    setUpdating(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `/api/materials/${materialId}/questions/save`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            recordId,
            questions: questionRecord.questions,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update questions");
      }

      setHasEdits(false);
      setEditsSaved(true);
    } catch (error) {
      console.error("Error updating questions:", error);
      alert(t("questionsView.validationError"));
    } finally {
      setUpdating(false);
    }
  };

  // Tailwind classes for the difficulty badge
  const difficultyBadgeClass = (difficulty: "easy" | "medium" | "hard") => {
    switch (difficulty) {
      case "easy":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "hard":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    }
  };

  const handleChatSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatLoading(true);

    // Add user message
    const newUserMessage = { role: "user" as const, content: userMessage };
    const newMessages: ChatMessage[] = [...chatMessages, newUserMessage];
    setChatMessages(newMessages);

    try {
      // Call OpenAI API
      const { data: { session: chatSession } } = await supabase.auth.getSession();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${chatSession?.access_token}`,
        },
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

      const newAssistantMessage = {
        role: "assistant" as const,
        content: data.message,
      };
      setChatMessages([...newMessages, newAssistantMessage]);

      // Save messages to database
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          await fetch("/api/chat/save", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              conversationId,
              messages: [newUserMessage, newAssistantMessage],
              chatType: "questions",
              materialId,
              questionId: questionRecordId !== "new" ? questionRecordId : null,
            }),
          });
        }
      } catch (saveError) {
        console.error("Error saving chat history:", saveError);
        // Don't fail the UI if save fails
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages([
        ...newMessages,
        {
          role: "assistant",
          content: t("questionsView.chatError"),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const exportLabels = () => ({
    correctAnswer: t("questionsView.correctAnswer"),
    name: t("questionsView.studentNameLine"),
    date: t("questionsView.studentDateLine"),
  });


  const handleSaveQuestions = async () => {
    if (!questionRecord || !isUnsaved) return;

    setSaving(true);
    try {
      if (!user) {
        router.push("/login");
        return;
      }

      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `/api/materials/${materialId}/questions/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            questions: questionRecord.questions,
            questionType: questionRecord.question_type,
          }),
        },
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

  // "teacher" keeps the correct answers and explanations; "student" is a plain
  // black-and-white paper to write on — no answers, no metadata.
  const exportToWord = async (variant: ExportVariant) => {
    if (!questionRecord || !material) return;

    const forStudent = variant === "student";
    const blocks = buildExportBlocks(questionRecord.questions, {
      variant,
      title: material.title,
      labels: exportLabels(),
    });

    // The student copy stays strictly black and white so it photocopies cleanly
    const children = blocks.map((block) => {
      switch (block.kind) {
        case "title":
          return new Paragraph({
            text: block.text,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: forStudent ? 300 : 500 },
          });
        case "nameLine":
          return new Paragraph({
            children: [new TextRun({ text: block.text, size: 22 })],
            spacing: { after: 500 },
          });
        case "question":
          return new Paragraph({
            children: [
              new TextRun({ text: `${block.number}. `, bold: true, size: 24 }),
              new TextRun({ text: block.text, size: 24 }),
            ],
            spacing: { before: 300, after: 200 },
          });
        case "option":
          return new Paragraph({
            children: [
              new TextRun({
                text: `   ${block.letter}) ${block.text}`,
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          });
        case "writingSpace":
          return new Paragraph({
            children: [new TextRun({ text: "", size: 22 })],
            spacing: { after: 240 },
          });
        case "answer":
          return new Paragraph({
            children: [
              new TextRun({
                text: `✓ ${block.label}: `,
                bold: true,
                size: 22,
                color: "059669",
              }),
              new TextRun({ text: block.text, size: 22, color: "059669" }),
            ],
            spacing: { before: 200, after: 400 },
          });
        case "spacer":
          return new Paragraph({ text: "", spacing: { after: 200 } });
      }
    });

    const doc = new Document({
      sections: [{ properties: {}, children }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(
      blob,
      `${material.title}${forStudent ? "" : " - odpovede"}.docx`,
    );
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
      <div className="bg-white dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 ">
        <div className="container-custom py-3 sm:py-4 md:py-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <button
                onClick={() => router.push(`/materials/${materialId}`)}
                className="p-2.5 sm:p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white group rounded-lg transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform cursor-pointer" />
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
                  <div className="absolute right-0 mt-2 w-56 sm:w-60 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-20">
                    <button
                      onClick={() => {
                        exportToWord("teacher");
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {t("questionsView.wordWithAnswers")}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        exportToWord("student");
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 text-gray-600 dark:text-gray-400 shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {t("questionsView.wordForStudent")}
                      </span>
                    </button>
                  </div>
                )}
              </div>
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
              ) : hasEdits ? (
                <button
                  onClick={handleSaveEdits}
                  disabled={updating}
                  className="inline-flex items-center justify-center gap-2 bg-linear-to-br from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Save className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                  <span className="hidden sm:inline">
                    {updating
                      ? t("questionsView.saving")
                      : t("questionsView.saveChangesButton")}
                  </span>
                </button>
              ) : (
                (savedQuestionId || editsSaved) && (
                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-2 bg-green-100 text-green-500 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold cursor-default"
                  >
                    <Check className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                    <span className="hidden sm:inline">
                      {editsSaved
                        ? t("questionsView.changesSaved")
                        : t("questionsView.questionsSaved")}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container-custom py-3 sm:py-4 md:py-6 px-3 sm:px-4">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Questions panel - 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Add question */}
            <div className="flex items-center justify-between gap-2">
              {hasEdits && !isUnsaved ? (
                <span className="text-[11px] sm:text-xs text-amber-600 dark:text-amber-400 font-medium">
                  {t("questionsView.unsavedChanges")}
                </span>
              ) : (
                <span />
              )}
              <button
                onClick={() => setShowAddModal(true)}
                disabled={editingIndex !== null}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-blue-400 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                {t("questionsView.addQuestion")}
              </button>
            </div>

            <div className="">
              <div className="space-y-3 sm:space-y-4">
                {questionRecord.questions.map((q, index) => {
                  const quizAnswer = quizAnswers.get(index);
                  const isAnswered = quizAnswer?.isChecked || false;

                  // --- Edit mode ---
                  if (editingIndex === index && draft) {
                    const inputClass =
                      "w-full px-2.5 sm:px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none text-xs sm:text-sm text-gray-900 dark:text-gray-200";
                    const labelClass =
                      "block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1";

                    return (
                      <div
                        key={index}
                        className="p-3 sm:p-4 rounded-lg border-2 border-blue-400 dark:border-blue-500 bg-white dark:bg-slate-800/70"
                      >
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">
                            {index + 1}.
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={cancelEditing}
                              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              {t("questionsView.cancelEdit")}
                            </button>
                            <button
                              onClick={commitEditing}
                              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              {t("questionsView.saveChanges")}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className={labelClass}>
                              {t("questionsView.questionTextLabel")}
                            </label>
                            <textarea
                              value={draft.question}
                              onChange={(e) =>
                                updateDraft({ question: e.target.value })
                              }
                              rows={2}
                              className={`${inputClass} resize-none`}
                            />
                          </div>

                          {draft.type === "mcq" && draft.options && (
                            <>
                              <div>
                                <label className={labelClass}>
                                  {t("questionsView.optionsLabel")}
                                </label>
                                <div className="space-y-1.5">
                                  {draft.options.map((option, optIdx) => (
                                    <div
                                      key={optIdx}
                                      className="flex items-center gap-2"
                                    >
                                      <input
                                        type="radio"
                                        name={`correct-${index}`}
                                        checked={draftCorrectIdx === optIdx}
                                        onChange={() =>
                                          setDraftCorrectIdx(optIdx)
                                        }
                                        aria-label={`${t("questionsView.correctAnswer")} ${String.fromCharCode(97 + optIdx)}`}
                                        className="w-4 h-4 accent-green-600 shrink-0 cursor-pointer"
                                      />
                                      <span className="font-bold text-xs sm:text-sm text-gray-500 dark:text-gray-400 w-4 shrink-0">
                                        {String.fromCharCode(97 + optIdx)}
                                      </span>
                                      <input
                                        type="text"
                                        value={option}
                                        onChange={(e) =>
                                          updateDraftOption(
                                            optIdx,
                                            e.target.value,
                                          )
                                        }
                                        className={inputClass}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className={labelClass}>
                                  {t("questionsView.explanationLabel")}
                                </label>
                                <textarea
                                  value={draftRationale}
                                  onChange={(e) =>
                                    setDraftRationale(e.target.value)
                                  }
                                  rows={2}
                                  className={`${inputClass} resize-none`}
                                />
                              </div>
                            </>
                          )}

                          {draft.type === "open" && (
                            <>
                              <div>
                                <label className={labelClass}>
                                  {t("questionsView.modelAnswerLabel")}
                                </label>
                                <textarea
                                  value={draft.answer || ""}
                                  onChange={(e) =>
                                    updateDraft({ answer: e.target.value })
                                  }
                                  rows={4}
                                  className={`${inputClass} resize-none`}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>
                                  {t("questionsView.rubricLabel")}
                                </label>
                                <div className="space-y-1.5">
                                  {(draft.rubric || []).map(
                                    (criterion, cIdx) => (
                                      <div
                                        key={cIdx}
                                        className="flex items-center gap-2"
                                      >
                                        <input
                                          type="text"
                                          value={criterion}
                                          onChange={(e) =>
                                            updateDraftCriterion(
                                              cIdx,
                                              e.target.value,
                                            )
                                          }
                                          className={inputClass}
                                        />
                                        <button
                                          onClick={() =>
                                            removeDraftCriterion(cIdx)
                                          }
                                          aria-label={t(
                                            "questionsView.removeCriterion",
                                          )}
                                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer shrink-0"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ),
                                  )}
                                </div>
                                <button
                                  onClick={addDraftCriterion}
                                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  {t("questionsView.addCriterion")}
                                </button>
                              </div>
                            </>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className={labelClass}>
                                {t("questionsView.topicLabel")}
                              </label>
                              <input
                                type="text"
                                value={draft.topic || ""}
                                onChange={(e) =>
                                  updateDraft({ topic: e.target.value })
                                }
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>
                                {t("questionsView.difficultyLabel")}
                              </label>
                              <select
                                value={draft.difficulty || "medium"}
                                onChange={(e) =>
                                  updateDraft({
                                    difficulty: e.target
                                      .value as GeneratedQuestion["difficulty"],
                                  })
                                }
                                className={`${inputClass} cursor-pointer`}
                              >
                                {DIFFICULTIES.map((d) => (
                                  <option key={d} value={d}>
                                    {t(`questionsView.difficulty.${d}`)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={labelClass}>
                                {t("questionsView.bloomLabel")}
                              </label>
                              <select
                                value={draft.bloom_level || "understand"}
                                onChange={(e) =>
                                  updateDraft({
                                    bloom_level: e.target
                                      .value as GeneratedQuestion["bloom_level"],
                                  })
                                }
                                className={`${inputClass} cursor-pointer`}
                              >
                                {BLOOM_LEVELS.map((b) => (
                                  <option key={b} value={b}>
                                    {t(`questionsView.bloom.${b}`)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {editError && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              {editError}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={index}
                      className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/70"
                    >
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
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
                          {q.difficulty && (
                            <span
                              className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${difficultyBadgeClass(
                                q.difficulty,
                              )}`}
                            >
                              {t(`questionsView.difficulty.${q.difficulty}`)}
                            </span>
                          )}
                          {q.bloom_level && (
                            <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              {t(`questionsView.bloom.${q.bloom_level}`)}
                            </span>
                          )}

                          {/* Edit / delete actions */}
                          <div className="ml-auto flex items-center gap-1">
                            <button
                              onClick={() => startEditing(index)}
                              title={t("questionsView.editQuestion")}
                              aria-label={t("questionsView.editQuestion")}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setPendingDeleteIndex(index)}
                              disabled={questionRecord.questions.length <= 1}
                              title={t("questionsView.deleteQuestion")}
                              aria-label={t("questionsView.deleteQuestion")}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {q.topic && (
                          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1.5 sm:mb-2 italic">
                            {q.topic}
                          </p>
                        )}
                        <p className="text-gray-900 dark:text-gray-200 mb-3 sm:mb-4 font-medium text-sm sm:text-base leading-tight">
                          {q.question}
                        </p>

                        {/* MCQ Options */}
                        {q.type === "mcq" && q.options && (
                          <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                            {q.options.map((option, optIdx) => {
                              const optionLetter = String.fromCharCode(
                                97 + optIdx,
                              );
                              const isSelected =
                                quizAnswer?.userAnswer === option;
                              const isCorrectOption =
                                correctOptionIndex(q.answer, q.options) ===
                                optIdx;

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
                                    handleMCQAnswer(index, optIdx, q)
                                  }
                                  disabled={isAnswered}
                                  className={`w-full flex items-start text-gray-700 dark:text-gray-400 space-x-2 sm:space-x-3 text-left p-2 sm:p-2.5 md:p-3 rounded-lg border transition-all ${buttonStyle} ${
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
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="font-semibold text-blue-900 dark:text-blue-300 text-xs sm:text-sm">
                                {t("questionsView.yourAnswer")}:
                              </div>
                              {typeof quizAnswer.score === "number" && (
                                <span
                                  className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                    quizAnswer.score >= 80
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                      : quizAnswer.score >= 50
                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                  }`}
                                >
                                  {t("questionsView.scoreLabel")}: {quizAnswer.score}%
                                </span>
                              )}
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

                        {/* Grading rubric for open questions */}
                        {q.type === "open" &&
                          isAnswered &&
                          q.rubric &&
                          q.rubric.length > 0 && (
                            <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-gray-50 dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600/40 rounded-lg">
                              <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1 text-[11px] sm:text-xs">
                                {t("questionsView.gradingCriteria")}:
                              </div>
                              <ul className="list-disc list-inside space-y-0.5 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                                {q.rubric.map((criterion, cIdx) => (
                                  <li key={cIdx}>{criterion}</li>
                                ))}
                              </ul>
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

      {/* Delete confirmation */}
      <ConfirmDeleteModal
        isOpen={pendingDeleteIndex !== null}
        onClose={() => setPendingDeleteIndex(null)}
        onConfirm={() => {
          if (pendingDeleteIndex !== null) deleteQuestion(pendingDeleteIndex);
        }}
        title={t("questionsView.deleteQuestion")}
        message={t("questionsView.confirmDeleteQuestion")}
      />

      {/* Add-question type picker */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              aria-label={t("questionsView.cancelEdit")}
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 pr-8">
              {t("questionsView.addQuestionTitle")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              {t("questionsView.chooseQuestionType")}
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => addQuestion("mcq")}
                className="w-full text-left p-3.5 rounded-xl border border-gray-200 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors cursor-pointer"
              >
                <div className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">
                  {t("questionsView.multipleChoice")}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t("questionsView.mcqTypeDescription")}
                </div>
              </button>
              <button
                onClick={() => addQuestion("open")}
                className="w-full text-left p-3.5 rounded-xl border border-gray-200 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors cursor-pointer"
              >
                <div className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">
                  {t("questionsView.open")}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t("questionsView.openTypeDescription")}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

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
