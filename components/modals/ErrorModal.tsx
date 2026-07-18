"use client";

import { useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

type ErrorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
};

export default function ErrorModal({
  isOpen,
  onClose,
  title,
  message,
}: ErrorModalProps) {
  const { t } = useTranslation();

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-red-600 to-rose-500 dark:from-red-700 dark:to-rose-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">{title || t("modals.error.title")}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{message || t("modals.error.defaultMessage")}</p>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-slate-700/50 p-6 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full bg-linear-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg"
          >
            {t("modals.error.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
