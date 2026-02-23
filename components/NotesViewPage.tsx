"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import {
  BookOpen,
  ArrowLeft,
  Lightbulb,
  Brain,
  Star,
  AlertCircle,
  CheckCircle2,
  Target,
  Download,
  Save,
  Check,
} from "lucide-react";
import SlidingChatPanel from "./SlidingChatPanel";

type KeyPoint = {
  title: string;
  description: string;
  importance: "high" | "medium" | "low";
};

type Concept = {
  concept: string;
  explanation: string;
  examples: string[];
};

type StudyNote = {
  id: string;
  material_id: string;
  summary: string;
  key_points: KeyPoint[];
  concepts: Concept[];
  study_tips: string;
  created_at: string;
};

type Material = {
  id: string;
  title: string;
  content: string | null;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  materialId: string;
  noteId: string;
};

export default function NotesViewPage({ materialId, noteId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useTranslation();

  const [note, setNote] = useState<StudyNote | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversationId] = useState<string>(() => crypto.randomUUID()); // Generate conversation ID once

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;

        // Load material first
        const { data: materialData, error: materialError } = await supabase
          .from("materials")
          .select("id, title, content")
          .eq("id", materialId)
          .single();

        if (materialError) throw materialError;
        setMaterial(materialData);

        // Check if this is unsaved data (noteId === "new")
        if (noteId === "new") {
          // Try to get data from sessionStorage first (preferred method)
          const unsavedDataFromStorage = sessionStorage.getItem("unsavedNotes");
          if (unsavedDataFromStorage) {
            const parsedData = JSON.parse(unsavedDataFromStorage);
            setNote({
              id: "new",
              material_id: materialId,
              summary: parsedData.summary,
              key_points: parsedData.key_points,
              concepts: parsedData.concepts,
              study_tips: parsedData.study_tips,
              created_at: new Date().toISOString(),
            });
            setIsUnsaved(true);
            // Clear the sessionStorage after reading
            sessionStorage.removeItem("unsavedNotes");
          } else {
            // Fallback to URL parameter for backward compatibility
            const unsavedData = searchParams.get("data");
            if (unsavedData) {
              const parsedData = JSON.parse(decodeURIComponent(unsavedData));
              setNote({
                id: "new",
                material_id: materialId,
                summary: parsedData.summary,
                key_points: parsedData.key_points,
                concepts: parsedData.concepts,
                study_tips: parsedData.study_tips,
                created_at: new Date().toISOString(),
              });
              setIsUnsaved(true);
            }
          }
        } else {
          // Load existing note from database
          const { data: noteData, error: noteError } = await supabase
            .from("study_notes")
            .select("*")
            .eq("id", noteId)
            .single();

          if (noteError) throw noteError;
          setNote(noteData as StudyNote);
          setIsUnsaved(false);
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
                    content: t("notesView.aiAssistantSubtitle"),
                  },
                ]);
              }
            } else {
              // Fallback to initial message
              setChatMessages([
                {
                  role: "assistant",
                  content: t("notesView.aiAssistantSubtitle"),
                },
              ]);
            }
          }
        } catch (historyError) {
          console.error("Error loading chat history:", historyError);
          // Fallback to initial message
          setChatMessages([
            {
              role: "assistant",
              content: t("notesView.aiAssistantSubtitle"),
            },
          ]);
        }
      } catch (error) {
        console.error("Error loading notes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [noteId, materialId, searchParams, conversationId]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sendingMessage || !material || !note) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setSendingMessage(true);

    // Add user message to chat
    const newUserMessage = { role: "user" as const, content: userMessage };
    setChatMessages((prev) => [...prev, newUserMessage]);

    try {
      // Call chat API
      const params = new URLSearchParams();
      if (locale) {
        params.set("lang", locale);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `/api/materials/${materialId}/notes/chat?${params.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            message: userMessage,
            noteId: noteId,
            materialContent: material.content?.substring(0, 10000),
            currentNotes: {
              summary: note.summary,
              key_points: note.key_points,
              concepts: note.concepts,
              study_tips: note.study_tips,
            },
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Add assistant response to chat
      const newAssistantMessage = {
        role: "assistant" as const,
        content: data.response,
      };
      setChatMessages((prev) => [...prev, newAssistantMessage]);

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
              chatType: "notes",
              materialId,
              noteId: noteId !== "new" ? noteId : null,
            }),
          });
        }
      } catch (saveError) {
        console.error("Error saving chat history:", saveError);
        // Don't fail the UI if save fails
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("notesView.aiAssistantSubtitle"),
        },
      ]);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDownloadNotes = async () => {
    if (!note || !material) return;

    const paragraphs: Paragraph[] = [];

    // Title
    paragraphs.push(
      new Paragraph({
        text: `Study Notes: ${material.title}`,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    );

    // Generated date
    paragraphs.push(
      new Paragraph({
        text: `Generated on: ${new Date(note.created_at).toLocaleDateString()}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    );

    // Summary Section
    paragraphs.push(
      new Paragraph({
        text: "Summary",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
    );
    paragraphs.push(
      new Paragraph({
        text: note.summary,
        spacing: { after: 400 },
      }),
    );

    // Key Points Section
    paragraphs.push(
      new Paragraph({
        text: "Key Points",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
    );

    note.key_points.forEach((point, index) => {
      paragraphs.push(
        new Paragraph({
          text: `${index + 1}. ${
            point.title
          } [${point.importance.toUpperCase()}]`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
      );
      paragraphs.push(
        new Paragraph({
          text: point.description,
          spacing: { after: 200 },
        }),
      );
    });

    // Concepts Section
    paragraphs.push(
      new Paragraph({
        text: "Important Concepts",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
    );

    note.concepts.forEach((concept, index) => {
      paragraphs.push(
        new Paragraph({
          text: `${index + 1}. ${concept.concept}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
      );
      paragraphs.push(
        new Paragraph({
          text: concept.explanation,
          spacing: { after: 200 },
        }),
      );

      if (concept.examples && concept.examples.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Examples:",
                bold: true,
              }),
            ],
            spacing: { before: 100, after: 100 },
          }),
        );

        concept.examples.forEach((example) => {
          paragraphs.push(
            new Paragraph({
              text: `• ${example}`,
              spacing: { after: 100 },
            }),
          );
        });
      }
    });

    // Study Tips Section
    paragraphs.push(
      new Paragraph({
        text: "Study Tips & Recommendations",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
    );
    paragraphs.push(
      new Paragraph({
        text: note.study_tips,
        spacing: { after: 200 },
      }),
    );

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    // Generate and download
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-notes-${material.title
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200 dark:border-red-700/20 dark:bg-red-900/20 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:border-yellow-700/20 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "low":
        return "bg-green-100 text-green-700 border-green-200 dark:border-green-700/20 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:border-gray-700/20 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case "high":
        return <AlertCircle className="w-4 h-4" />;
      case "medium":
        return <Target className="w-4 h-4" />;
      case "low":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const handleSaveNotes = async () => {
    if (!note || !isUnsaved) return;

    setSaving(true);
    try {
      const { user } = await getCurrentUser();
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

      const response = await fetch(`/api/materials/${materialId}/notes/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          summary: note.summary,
          keyPoints: note.key_points,
          concepts: note.concepts,
          studyTips: note.study_tips,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save notes");
      }

      // Update state to show saved status without redirecting
      setSavedNoteId(data.record.id);
      setIsUnsaved(false);
      setSaving(false);
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("Failed to save notes. Please try again.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 via-white to-blue-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
      </div>
    );
  }

  if (!note || !material) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 via-white to-blue-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t("notesView.notesNotFound")}
          </h2>
          <Link
            href={`/materials/${materialId}`}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            {t("notesView.backToMaterial")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-blue-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 dark:border-slate-700 dark:bg-slate-800/80 sticky top-0 z-10 shadow-sm ">
        <div className="container-custom py-3 sm:py-4 md:py-5 px-3 sm:px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
              <button
                onClick={() => router.push(`/materials/${materialId}`)}
                className="p-2.5 sm:p-3 text-gray-600 dark:text-gray-300 dark:hover:text-gray-400 hover:text-gray-900 group rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="bg-purple-100 dark:bg-purple-900/50 p-1.5 sm:p-2 rounded-lg shrink-0">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-gray-300 truncate">
                    {t("notesView.studyNotes")}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                    {material.title}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-2 shrink-0">
              {/* Chat Toggle Button - Mobile Only */}
              <button
                onClick={() => setIsChatOpen(true)}
                className="md:hidden px-3 sm:px-4 py-2.5 sm:py-3 bg-linear-to-br from-blue-600 to-purple-600 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shrink-0 relative"
              >
                {t("notesView.ai")}
                {chatMessages.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                    {chatMessages.length}
                  </span>
                )}
              </button>
              <button
                onClick={handleDownloadNotes}
                className="inline-flex items-center justify-center text-white gap-2 bg-linear-to-br from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer "
              >
                <Download className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
                <span className="hidden sm:inline">
                  {t("notesView.downloadNotes")}
                </span>
              </button>
              {isUnsaved ? (
                <button
                  onClick={handleSaveNotes}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 bg-linear-to-br from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[42px] sm:min-h-11"
                >
                  <Save className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  <span className="hidden sm:inline">
                    {saving ? t("notesView.saving") : t("notesView.saveNotes")}
                  </span>
                </button>
              ) : (
                savedNoteId && (
                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-2 bg-green-100 text-green-500 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold cursor-default min-h-[42px] sm:min-h-11"
                  >
                    <Check className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    <span className="hidden sm:inline">
                      {t("notesView.notesSaved")}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="container-custom py-3 sm:py-4 md:py-6 px-3 sm:px-4">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {/* Left Column - Notes Content */}
          <div className="overflow-y-auto lg:pr-4 space-y-3 sm:space-y-4 md:space-y-6 custom-scrollbar ">
            {/* Summary Section */}
            <div className="bg-white dark:bg-slate-700/70 rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm sm:shadow-md md:shadow-lg p-3 sm:p-4 md:p-6 border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4">
                <div className="bg-blue-100 dark:bg-blue-700/20 p-1.5 sm:p-2 rounded-lg">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-gray-300">
                  {t("notesView.summary")}
                </h2>
              </div>
              <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none">
                <div className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed space-y-2 sm:space-y-3 md:space-y-4 whitespace-pre-wrap text-justify">
                  {note.summary}
                </div>
              </div>
            </div>

            {/* Key Points Section */}
            <div className="bg-white dark:bg-slate-700/70 rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm sm:shadow-md md:shadow-lg p-3 sm:p-4 md:p-6 border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4">
                <div className="bg-green-100 dark:bg-green-700/20 p-1.5 sm:p-2 rounded-lg">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-gray-300">
                  {t("notesView.keyPoints")}
                </h2>
              </div>
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                {note.key_points.map((point, index) => (
                  <div
                    key={index}
                    className="border-l-3 sm:border-l-4 border-purple-500 bg-linear-to-r from-purple-50 to-transparent dark:bg-linear-to-r dark:from-purple-900/20 dark:to-transparent p-2.5 sm:p-3 md:p-4 rounded-r-lg sm:rounded-r-xl"
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-3 md:gap-4 mb-1.5 sm:mb-2">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-300 flex-1 leading-tight">
                        {point.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold border ${getImportanceColor(
                          point.importance,
                        )} shrink-0`}
                      >
                        {getImportanceIcon(point.importance)}
                        <span className="hidden sm:inline">
                          {point.importance}
                        </span>
                      </span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-1.5 sm:space-y-2 whitespace-pre-wrap text-justify text-xs sm:text-sm">
                      {point.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Concepts Section */}
            <div className="bg-white dark:bg-slate-700/70 rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm sm:shadow-md md:shadow-lg p-3 sm:p-4 md:p-6 border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4">
                <div className="bg-purple-100 dark:bg-purple-700/20 p-1.5 sm:p-2 rounded-lg">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-gray-300">
                  {t("notesView.importantConcepts")}
                </h2>
              </div>
              <div className="grid gap-2 sm:gap-3 md:gap-4">
                {note.concepts.map((concept, index) => (
                  <div
                    key={index}
                    className="bg-linear-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-purple-100 dark:border-purple-700/20"
                  >
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-purple-900 dark:text-purple-400 mb-2 sm:mb-3 leading-tight">
                      {concept.concept}
                    </h3>
                    <div className="text-gray-700 dark:text-gray-300 mb-2 sm:mb-3 md:mb-4 leading-relaxed space-y-1.5 sm:space-y-2 whitespace-pre-wrap text-justify text-xs sm:text-sm">
                      {concept.explanation}
                    </div>
                    {concept.examples && concept.examples.length > 0 && (
                      <div className="mt-2 sm:mt-3">
                        <h4 className="text-[10px] sm:text-xs font-semibold text-gray-900 dark:text-gray-300 mb-1.5 sm:mb-2 flex items-center">
                          <Lightbulb className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-yellow-600" />
                          {t("notesView.examples")}:
                        </h4>
                        <ul className="space-y-1 sm:space-y-1.5">
                          {concept.examples.map((example, exIndex) => (
                            <li
                              key={exIndex}
                              className="flex items-start gap-3 sm:gap-2 text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                            >
                              <span className="text-purple-600 font-bold mt-0.5 shrink-0">
                                •
                              </span>
                              <span className="leading-tight">{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Study Tips Section */}
            <div className="bg-linear-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-yellow-900/20 rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm sm:shadow-md md:shadow-lg p-3 sm:p-4 md:p-6 border border-yellow-200 dark:border-yellow-700/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4">
                <div className="bg-yellow-100 dark:bg-yellow-700/20 p-1.5 sm:p-2 rounded-lg">
                  <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-gray-300">
                  {t("notesView.studyTipsRecommendations")}
                </h2>
              </div>
              <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none">
                <div className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed space-y-2 sm:space-y-3 md:space-y-4 whitespace-pre-wrap text-justify">
                  {note.study_tips}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Chat - Sliding Panel Component */}
          <div className="lg:col-span-1">
            <SlidingChatPanel
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              messages={chatMessages}
              inputMessage={inputMessage}
              onInputChange={setInputMessage}
              onSendMessage={handleSendMessage}
              isSending={sendingMessage}
              title={t("notesView.aiAssistant")}
              subtitle={t("notesView.aiAssistantSubtitle")}
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
