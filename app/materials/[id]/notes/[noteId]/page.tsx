"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
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
  Send,
  MessageSquare,
} from "lucide-react";

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

export default function NotesPage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params.noteId as string;
  const materialId = params.id as string;

  const [note, setNote] = useState<StudyNote | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load note
        const { data: noteData, error: noteError } = await supabase
          .from("study_notes")
          .select("*")
          .eq("id", noteId)
          .single();

        if (noteError) throw noteError;
        setNote(noteData as StudyNote);

        // Load material
        const { data: materialData, error: materialError } = await supabase
          .from("materials")
          .select("id, title, content")
          .eq("id", materialId)
          .single();

        if (materialError) throw materialError;
        setMaterial(materialData);

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
  }, [noteId, materialId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sendingMessage || !material || !note) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setSendingMessage(true);

    // Add user message to chat
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);

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

  const handleDownloadNotes = () => {
    if (!note || !material) return;

    let content = `# Study Notes: ${material.title}\n\n`;
    content += `Generated on: ${new Date(note.created_at).toLocaleDateString()}\n\n`;
    content += `---\n\n`;

    content += `## Summary\n\n${note.summary}\n\n`;
    content += `---\n\n`;

    content += `## Key Points\n\n`;
    note.key_points.forEach((point, index) => {
      content += `### ${index + 1}. ${point.title} [${point.importance}]\n\n`;
      content += `${point.description}\n\n`;
    });
    content += `---\n\n`;

    content += `## Important Concepts\n\n`;
    note.concepts.forEach((concept, index) => {
      content += `### ${index + 1}. ${concept.concept}\n\n`;
      content += `${concept.explanation}\n\n`;
      if (concept.examples && concept.examples.length > 0) {
        content += `**Examples:**\n`;
        concept.examples.forEach((example) => {
          content += `- ${example}\n`;
        });
        content += `\n`;
      }
    });
    content += `---\n\n`;

    content += `## Study Tips & Recommendations\n\n${note.study_tips}\n`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-notes-${material.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 via-white to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!note || !material) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Notes not found
          </h2>
          <Link
            href={`/materials/${materialId}`}
            className="text-purple-600 hover:text-purple-700"
          >
            Back to material
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/materials/${materialId}`}
                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
              <div className="flex items-center gap-3">
                <div className="bg-linear-to-br from-purple-100 to-purple-200 p-2 rounded-lg">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Study Notes</h1>
                  <p className="text-sm text-gray-600">{material.title}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleDownloadNotes}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Notes
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="container-custom py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
          {/* Left Column - Notes Content */}
          <div className="overflow-y-auto pr-4 space-y-6 custom-scrollbar">
            {/* Summary Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Summary</h2>
              </div>
              <div className="prose prose-lg max-w-none">
                <div className="text-gray-700 leading-relaxed space-y-4 whitespace-pre-wrap text-justify">
                  {note.summary}
                </div>
              </div>
            </div>

            {/* Key Points Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Star className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Key Points</h2>
              </div>
              <div className="space-y-4">
                {note.key_points.map((point, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-purple-500 bg-linear-to-r from-purple-50 to-transparent p-4 rounded-r-xl"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-base font-bold text-gray-900 flex-1">
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
                    <div className="text-gray-700 leading-relaxed space-y-2 whitespace-pre-wrap text-justify text-sm">
                      {point.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Concepts Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Important Concepts
                </h2>
              </div>
              <div className="grid gap-4">
                {note.concepts.map((concept, index) => (
                  <div
                    key={index}
                    className="bg-linear-to-br from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-100"
                  >
                    <h3 className="text-lg font-bold text-purple-900 mb-3">
                      {concept.concept}
                    </h3>
                    <div className="text-gray-700 mb-4 leading-relaxed space-y-2 whitespace-pre-wrap text-justify text-sm">
                      {concept.explanation}
                    </div>
                    {concept.examples && concept.examples.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center">
                          <Lightbulb className="w-3.5 h-3.5 mr-1.5 text-yellow-600" />
                          Examples:
                        </h4>
                        <ul className="space-y-1.5">
                          {concept.examples.map((example, exIndex) => (
                            <li
                              key={exIndex}
                              className="flex items-start gap-2 text-gray-700 text-sm"
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
            <div className="bg-linear-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-6 border border-yellow-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Study Tips & Recommendations
                </h2>
              </div>
              <div className="prose prose-lg max-w-none">
                <div className="text-gray-700 leading-relaxed space-y-4 whitespace-pre-wrap text-justify">
                  {note.study_tips}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Chat */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col h-full">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-linear-to-r from-purple-50 to-blue-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">AI Assistant</h2>
                  <p className="text-xs text-gray-600">
                    Ask questions or request modifications to your notes
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
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
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-900"
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
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="animate-bounce w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="animate-bounce w-2 h-2 bg-gray-400 rounded-full delay-100"></div>
                      <div className="animate-bounce w-2 h-2 bg-gray-400 rounded-full delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask about the notes or request changes..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  disabled={sendingMessage}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !inputMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
                >
                  <Send className="w-5 h-5" />
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
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c084fc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a855f7;
        }
      `}</style>
    </div>
  );
}
