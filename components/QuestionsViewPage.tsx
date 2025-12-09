"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  FileText,
  MessageSquare,
  Send,
  CheckCircle2,
  Circle,
  Loader2,
  ChevronLeft,
  Download,
  ExternalLink,
  FileDown,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [material, setMaterial] = useState<Material | null>(null);
  const [questionRecord, setQuestionRecord] = useState<QuestionRecord | null>(
    null
  );
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(
    new Set()
  );

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
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

      // Load question record
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
      setLoading(false);

      // Initial chat message
      setChatMessages([
        {
          role: "assistant",
          content: `Hello! I've generated ${questionData.questions.length} questions from the material "${materialData.title}". I can help you modify questions, add new ones, or explain answers. What do you need?`,
        },
      ]);
    };

    loadData();
  }, [materialId, questionRecordId, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!questionRecord || !material) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Questions not found
          </h2>
          <button
            onClick={() => router.push("/materials")}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to materials
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-gray-100 to-cyan-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/materials")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {material.title}
                </h1>
                <p className="text-sm text-gray-600">
                  {questionRecord.questions.length} generated questions
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => router.push(`/materials/${materialId}`)}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open document</span>
              </button>

              {/* Export dropdown */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      onClick={() => {
                        exportToWord();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                    >
                      <FileDown className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">Word (.docx)</span>
                    </button>
                    <button
                      onClick={() => {
                        exportQuestions();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">Text (.txt)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container-custom py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Questions panel - 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Generated Questions
              </h2>

              <div className="space-y-4">
                {questionRecord.questions.map((q, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedQuestions.has(index)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => toggleQuestion(index)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {selectedQuestions.has(index) ? (
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-900">
                            {index + 1}.
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              q.type === "mcq"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {q.type === "mcq" ? "Multiple Choice" : "Open"}
                          </span>
                        </div>
                        <p className="text-gray-900 mb-3 font-medium">{q.question}</p>

                        {q.type === "mcq" && q.options && (
                          <div className="space-y-2 mb-3">
                            {q.options.map((option, optIdx) => (
                              <div
                                key={optIdx}
                                className="flex items-start space-x-2 text-sm text-gray-700 p-2 rounded hover:bg-gray-50 transition-colors"
                              >
                                <span className="font-semibold text-blue-600 min-w-5">
                                  {String.fromCharCode(97 + optIdx)})
                                </span>
                                <span className="flex-1">{option}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {q.answer && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <span className="font-semibold text-green-700">✓ Správna odpoveď:</span>
                              <span className="text-green-800 flex-1">{q.answer}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat panel - 1 column on large screens */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 sticky top-24 flex flex-col h-[calc(100vh-8rem)]">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    AI Assistant
                  </h2>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Ask questions or request modifications
                </p>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input */}
              <form
                onSubmit={handleChatSubmit}
                className="p-4 border-t border-gray-200"
              >
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Write a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={chatLoading}
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
