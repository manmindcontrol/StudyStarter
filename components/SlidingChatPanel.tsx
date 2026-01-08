"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { X, ChevronRight } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  inputMessage: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  isSending: boolean;
  title?: string;
  subtitle?: string;
};

export default function SlidingChatPanel({
  isOpen,
  onClose,
  messages,
  inputMessage,
  onInputChange,
  onSendMessage,
  isSending,
  title = "AI Assistant",
  subtitle = "Ask questions about the content",
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <>
      {/* Overlay for mobile - Behind the panel */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* AI Chat Panel - Sliding on Mobile, Sticky on Desktop */}
      <div
        className={`
          fixed md:sticky md:top-4 inset-0 md:inset-auto z-50 md:z-auto
          w-full md:w-full lg:w-full
          md:h-[calc(100vh-2rem)]
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
          flex flex-col bg-gray-50 dark:bg-slate-800
          md:border md:border-gray-200 md:dark:border-slate-700 md:rounded-xl
          shadow-2xl md:shadow-lg
        `}
      >

        <div className="h-full flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-slate-700 bg-linear-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center">
                  <Image
                    src="/chatbot.svg"
                    alt="AI Assistant"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-300 truncate">
                    {title}
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {subtitle}
                  </p>
                </div>
              </div>
              {/* Close button - Mobile only */}
              <button
                onClick={onClose}
                className="md:hidden p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 custom-scrollbar min-h-0 bg-white dark:bg-slate-800">
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
                    Ask me anything about the content. I can help you
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
                      message.role === "user" ? "justify-end" : "justify-start"
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
                onChange={(e) => onInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Write a message..."
                className="flex-1 px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border text-gray-700 dark:text-gray-200 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-cyan-500 dark:focus:border-cyan-400 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                disabled={isSending}
              />
              <button
                onClick={onSendMessage}
                disabled={isSending || !inputMessage.trim()}
                className="bg-linear-to-br from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 dark:bg-linear-to-br dark:from-blue-700 dark:to-cyan-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 sm:p-3 rounded-xl transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
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
    </>
  );
}
