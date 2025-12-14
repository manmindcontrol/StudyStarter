"use client";

import { useEffect, useState } from "react";
import { FileText, Brain, Sparkles, BookOpen, Loader2 } from "lucide-react";

type GeneratingNotesModalProps = {
  isOpen: boolean;
};

const loadingTexts = [
  {
    icon: FileText,
    text: "Analyzing document structure...",
    color: "text-purple-600",
  },
  {
    icon: Brain,
    text: "Identifying key concepts...",
    color: "text-purple-700",
  },
  {
    icon: Sparkles,
    text: "Extracting important information...",
    color: "text-purple-600",
  },
  {
    icon: BookOpen,
    text: "Organizing study materials...",
    color: "text-purple-700",
  },
  {
    icon: Brain,
    text: "Creating comprehensive explanations...",
    color: "text-purple-600",
  },
  {
    icon: Sparkles,
    text: "Generating examples and connections...",
    color: "text-purple-700",
  },
  {
    icon: FileText,
    text: "Finalizing study notes...",
    color: "text-purple-600",
  },
];

export default function GeneratingNotesModal({
  isOpen,
}: GeneratingNotesModalProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    // Change text every 3 seconds
    const textInterval = setInterval(() => {
      setCurrentTextIndex((prev) => {
        if (prev < loadingTexts.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 3000);

    // Smooth progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 95) {
          return prev + 0.5;
        }
        return prev;
      });
    }, 100);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentColor = loadingTexts[currentTextIndex].color;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-purple-50 via-pink-50 to-purple-50 opacity-50"></div>

        {/* Animated circles */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-0 w-40 h-40 bg-pink-400/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>

        <div className="relative z-10">
          {/* Main loader icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Spinning ring */}
              <div className="absolute inset-0">
                <Loader2 className="w-20 h-20 text-purple-600 animate-spin" />
              </div>
              {/* Center icon */}
              <div
                className={`flex items-center justify-center w-20 h-20 ${currentColor} transition-colors duration-500`}
              ></div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Generating Study Notes
          </h2>

          {/* Dynamic status text */}
          <div className="min-h-[60px] flex items-center justify-center mb-6">
            <p
              className={`text-center font-medium transition-all duration-500 ${currentColor}`}
            >
              {loadingTexts[currentTextIndex].text}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-purple-600 to-violet-400 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Loading dots indicator */}
          <div className="flex justify-center space-x-2 mb-4">
            {loadingTexts.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentTextIndex
                    ? "w-8 bg-linear-to-r from-purple-600 to-pink-500"
                    : index < currentTextIndex
                    ? "w-2 bg-purple-500"
                    : "w-2 bg-gray-300"
                }`}
              ></div>
            ))}
          </div>

          {/* Info text */}
          <p className="text-center text-sm text-gray-600">
            This may take a few moments. We are creating comprehensive study
            materials for you.
          </p>
        </div>
      </div>
    </div>
  );
}
