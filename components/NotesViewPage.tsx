"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
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
  ChevronRight,
} from "lucide-react";
import Image from "next/image";

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

  const [note, setNote] = useState<StudyNote | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
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

        // Add initial assistant message
        setChatMessages([
          {
            role: "assistant",
            content:
              "Hello! I'm here to help you with your study notes. You can ask me questions about the material, request clarifications, or ask me to expand on specific concepts. How can I help you?",
          },
        ]);
      } catch (error) {
        console.error("Error loading notes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [noteId, materialId, searchParams]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sendingMessage || !material || !note) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setSendingMessage(true);

    // Add user message to chat
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);

    try {
      // Call chat API
      const response = await fetch(`/api/materials/${materialId}/notes/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Add assistant response to chat
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
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
      })
    );

    // Generated date
    paragraphs.push(
      new Paragraph({
        text: `Generated on: ${new Date(note.created_at).toLocaleDateString()}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Summary Section
    paragraphs.push(
      new Paragraph({
        text: "Summary",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );
    paragraphs.push(
      new Paragraph({
        text: note.summary,
        spacing: { after: 400 },
      })
    );

    // Key Points Section
    paragraphs.push(
      new Paragraph({
        text: "Key Points",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    note.key_points.forEach((point, index) => {
      paragraphs.push(
        new Paragraph({
          text: `${index + 1}. ${
            point.title
          } [${point.importance.toUpperCase()}]`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
      paragraphs.push(
        new Paragraph({
          text: point.description,
          spacing: { after: 200 },
        })
      );
    });

    // Concepts Section
    paragraphs.push(
      new Paragraph({
        text: "Important Concepts",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    note.concepts.forEach((concept, index) => {
      paragraphs.push(
        new Paragraph({
          text: `${index + 1}. ${concept.concept}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
      paragraphs.push(
        new Paragraph({
          text: concept.explanation,
          spacing: { after: 200 },
        })
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
          })
        );

        concept.examples.forEach((example) => {
          paragraphs.push(
            new Paragraph({
              text: `• ${example}`,
              spacing: { after: 100 },
            })
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
      })
    );
    paragraphs.push(
      new Paragraph({
        text: note.study_tips,
        spacing: { after: 200 },
      })
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

      const response = await fetch(`/api/materials/${materialId}/notes/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: note.summary,
          keyPoints: note.key_points,
          concepts: note.concepts,
          studyTips: note.study_tips,
          userId: user.id,
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
            Notes not found
          </h2>
          <Link
            href={`/materials/${materialId}`}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Back to material
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-blue-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 dark:border-slate-700 dark:bg-slate-800/80 sticky top-0 z-10 shadow-sm">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/materials/${materialId}`)}
                className="p-2  text-gray-600 dark:text-gray-300 dark:hover:text-gray-400 hover:text-gray-900 group rounded-lg transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg">
                  <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-gray-300">
                    Study Notes
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400  ">
                    {material.title}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadNotes}
                className="inline-flex items-center text-white gap-2 bg-linear-to-br from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-white" />
                Download Notes
              </button>
              {isUnsaved ? (
                <button
                  onClick={handleSaveNotes}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-linear-to-br from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Notes"}
                </button>
              ) : (
                savedNoteId && (
                  <button
                    disabled
                    className="inline-flex items-center gap-2 bg-green-100 text-green-500 px-4 py-2 rounded-lg font-semibold cursor-default"
                  >
                    <Check className="w-4 h-4" />
                    Notes Saved
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="container-custom py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
          {/* Left Column - Notes Content */}
          <div className="overflow-y-auto pr-4 space-y-6 custom-scrollbar">
            {/* Summary Section */}
            <div className="bg-white dark:bg-slate-700/70 rounded-2xl shadow-lg p-6 border border-gray-100  dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 dark:bg-blue-700/20 p-2 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-300">
                  Summary
                </h2>
              </div>
              <div className="prose prose-lg max-w-none">
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-4 whitespace-pre-wrap text-justify">
                  {note.summary}
                </div>
              </div>
            </div>

            {/* Key Points Section */}
            <div className="bg-white dark:bg-slate-700/70 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 dark:bg-green-700/20 p-2 rounded-lg">
                  <Star className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-300">
                  Key Points
                </h2>
              </div>
              <div className="space-y-4">
                {note.key_points.map((point, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-purple-500 bg-linear-to-r from-purple-50 to-transparent dark:bg-linear-to-r dark:from-purple-900/20 dark:to-transparent p-4 rounded-r-xl"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-300 flex-1">
                        {point.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${getImportanceColor(
                          point.importance
                        )}`}
                      >
                        {getImportanceIcon(point.importance)}
                        {point.importance}
                      </span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-2 whitespace-pre-wrap text-justify text-sm">
                      {point.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Concepts Section */}
            <div className="bg-white dark:bg-slate-700/70 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 dark:bg-purple-700/20 p-2 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-300">
                  Important Concepts
                </h2>
              </div>
              <div className="grid gap-4">
                {note.concepts.map((concept, index) => (
                  <div
                    key={index}
                    className="bg-linear-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-5 border border-purple-100 dark:border-purple-700/20"
                  >
                    <h3 className="text-lg font-bold text-purple-900 dark:text-purple-400 mb-3">
                      {concept.concept}
                    </h3>
                    <div className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed space-y-2 whitespace-pre-wrap text-justify text-sm">
                      {concept.explanation}
                    </div>
                    {concept.examples && concept.examples.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2 flex items-center">
                          <Lightbulb className="w-3.5 h-3.5 mr-1.5 text-yellow-600" />
                          Examples:
                        </h4>
                        <ul className="space-y-1.5">
                          {concept.examples.map((example, exIndex) => (
                            <li
                              key={exIndex}
                              className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm"
                            >
                              <span className="text-purple-600 font-bold mt-0.5">
                                •
                              </span>
                              <span>{example}</span>
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
            <div className="bg-linear-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-yellow-900/20 rounded-2xl shadow-lg p-6 border border-yellow-200 dark:border-yellow-700/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-100 dark:bg-yellow-700/20 p-2 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-300">
                  Study Tips & Recommendations
                </h2>
              </div>
              <div className="prose prose-lg max-w-none">
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-4 whitespace-pre-wrap text-justify">
                  {note.study_tips}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Chat */}
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 flex flex-col h-full overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-linear-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-t-2xl shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                  <Image
                    src="/chatbot.svg"
                    alt="AI Assistant"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    AI Assistant
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Ask questions or request modifications to your notes
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-linear-to-br from-blue-600 to-cyan-500 text-white"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-200"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
              {sendingMessage && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-slate-700 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="animate-bounce w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                      <div className="animate-bounce w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full delay-100"></div>
                      <div className="animate-bounce w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask about the notes or request changes..."
                  className="flex-1 px-4 py-3 border text-gray-700 dark:text-gray-200 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl focus:ring-1 focus:border-blue-500 dark:focus:border-blue-400 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  disabled={sendingMessage}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !inputMessage.trim()}
                  className="bg-linear-to-br from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
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
