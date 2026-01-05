"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  FileText,
  ChevronLeft,
  Loader2,
  ChevronRight,
  MessageCircle,
  X,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import Image from "next/image";

type Material = {
  id: string;
  title: string;
  content: string | null;
  file_name: string | null;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  materialId: string;
};

export default function DocumentViewer({ materialId }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [material, setMaterial] = useState<Material | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        .select("id, title, content, file_name")
        .eq("id", materialId)
        .single();

      if (materialError || !materialData) {
        console.error("Material error:", materialError);
        setLoading(false);
        return;
      }

      setMaterial(materialData);
      setLoading(false);
    };

    loadData();
  }, [materialId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending || !material) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    const newMessages = [
      ...messages,
      { role: "user" as const, content: userMessage },
    ];
    setMessages(newMessages);
    setIsSending(true);

    try {
      const response = await fetch(`/api/materials/${material.id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          context: material.content,
          messages: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Material not found
          </h2>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="container-custom py-2 sm:py-3 md:py-4 px-3 sm:px-4">
          <div className="flex items-center justify-between space-x-2 sm:space-x-3 md:space-x-4">
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0 flex-1">
              <button
                onClick={() => router.push(`/materials/${materialId}`)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-400" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-gray-300 truncate">
                    {material.title}
                  </h1>
                  {material.file_name && (
                    <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 truncate">
                      {material.file_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* Chat Toggle Button - Mobile Only */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="md:hidden px-4 py-2.5 bg-linear-to-br from-blue-600 to-purple-600 text-white rounded-lg transition-colors shrink-0 relative font-bold text-sm"
            >
              AI
              {messages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                  {messages.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Document Content - Full Width on Mobile, Split on Desktop */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-800/80 md:border-r md:border-gray-200 md:dark:border-slate-700">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-300 mb-4 sm:mb-6">
                Document Content
              </h2>
              {material.content ? (
                <div className="prose prose-sm sm:prose-base max-w-none">
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                    {material.content}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Document content is not available.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Chat Panel - Sliding on Mobile, Fixed on Desktop */}
        <div
          className={`
            fixed md:relative inset-y-0 right-0 z-50
            w-full md:w-[400px] lg:w-[450px]
            transform transition-transform duration-300 ease-in-out
            ${
              isChatOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
            }
            flex flex-col bg-gray-50 dark:bg-slate-800
            md:border-l border-gray-200 dark:border-slate-700
            shadow-2xl md:shadow-none
          `}
        >
          {/* Overlay for mobile */}
          {isChatOpen && (
            <div
              className="md:hidden fixed inset-0 bg-black/50 -z-10"
              onClick={() => setIsChatOpen(false)}
            />
          )}

          <div className="h-full flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-slate-700 bg-linear-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center">
                    <Image
                      src="/chatbot.svg"
                      alt="AI Assistant"
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-300">
                      AI Assistant
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Ask questions about the document
                    </p>
                  </div>
                </div>
                {/* Close button - Mobile only */}
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="md:hidden p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 custom-scrollbar min-h-0">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center py-6 sm:py-8">
                  <div className="text-center max-w-md px-4">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
                      <Image
                        src="/chatbot.svg"
                        alt="AI Assistant"
                        width={80}
                        height={80}
                        className="opacity-60 object-contain"
                      />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-300 mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      Ask me anything about the document. I can help you
                      understand, summarize, or explain specific parts.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                          message.role === "user"
                            ? "bg-linear-to-br from-blue-600 to-cyan-500 dark:bg-linear-to-br dark:from-blue-700 dark:to-cyan-700 text-white"
                            : "bg-gray-100 text-gray-900 dark:bg-gray-800/80 dark:text-gray-300"
                        }`}
                      >
                        <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="animate-bounce w-2 h-2 bg-gray-400 rounded-full"></div>
                          <div className="animate-bounce w-2 h-2 bg-gray-400 rounded-full delay-100"></div>
                          <div className="animate-bounce w-2 h-2 bg-gray-400 rounded-full delay-200"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-slate-600 shrink-0 bg-white dark:bg-slate-800">
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
                  placeholder="Write a message..."
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border text-gray-700 dark:text-gray-200 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-cyan-500 dark:focus:border-cyan-400 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  disabled={isSending}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isSending || !inputMessage.trim()}
                  className="bg-linear-to-br from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 dark:bg-linear-to-br dark:from-blue-700 dark:to-cyan-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 sm:p-3 rounded-xl transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
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
