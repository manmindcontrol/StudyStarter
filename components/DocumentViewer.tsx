"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { FileText, ChevronLeft } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import SlidingChatPanel from "./SlidingChatPanel";

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
  const { locale } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [material, setMaterial] = useState<Material | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { user } = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

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
      const params = new URLSearchParams();
      if (locale) {
        params.set("lang", locale);
      }

      const response = await fetch(
        `/api/materials/${material.id}/chat?${params.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            context: material.content,
            messages: messages,
          }),
        },
      );

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
    <div className="min-h-screen bg-gray-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="container-custom py-2 sm:py-3 md:py-4 px-3 sm:px-4">
          <div className="flex items-center justify-between space-x-2 sm:space-x-3 md:space-x-4">
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0 flex-1">
              <button
                onClick={() => router.push(`/materials/${materialId}`)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0 cursor-pointer"
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
              className="md:hidden px-3 sm:px-4 py-2.5 sm:py-3 bg-linear-to-br from-blue-600 to-purple-600 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shrink-0 relative"
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
      <div className="container-custom py-3 sm:py-4 md:py-6 px-3 sm:px-4">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Document Content - 2 columns on large screens */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 shadow-sm border border-gray-200 dark:border-slate-700">
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

          {/* Chat Panel - 1 column on large screens */}
          <div className="lg:col-span-1">
            <SlidingChatPanel
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              messages={messages}
              inputMessage={inputMessage}
              onInputChange={setInputMessage}
              onSendMessage={handleSendMessage}
              isSending={isSending}
              title="AI Assistant"
              subtitle="Ask questions about the document"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
