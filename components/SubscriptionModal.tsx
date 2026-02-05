"use client";

import { useState, useEffect } from "react";
import {
  X,
  Check,
  Zap,
  Crown,
  Sparkles,
  Gift,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/lib/supabase";

interface SubscriptionModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isNewUser?: boolean;
  preselectedTier?: string;
  isFullPage?: boolean;
}

export default function SubscriptionModal({
  isOpen = true,
  onClose,
  isNewUser = false,
  preselectedTier = "basic",
  isFullPage = false,
}: SubscriptionModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>(preselectedTier);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen && !isFullPage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isFullPage]);

  if (!isOpen && !isFullPage) return null;

  const handleSelectPlan = async (tierId: string) => {
    if (tierId === "free") {
      if (isFullPage) {
        window.location.href = "/dashboard";
      } else {
        onClose?.();
      }
      return;
    }

    setLoading(tierId);
    try {
      // Get session token for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Please log in to subscribe.");
        setLoading(null);
        return;
      }

      const response = await fetch("/api/stripe/create-subscription-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tierId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Error creating checkout:", err);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const content = (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        {isNewUser && (
          <div className="inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            {t("pricing.welcomeBadge")}
          </div>
        )}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-blue-600 to-cyan-500 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("pricing.title")}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
          {t("pricing.subtitle")}
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {/* Free Plan */}
        <div
          onClick={() => setSelectedTier("free")}
          className={`border-2 rounded-xl p-4 sm:p-6 transition-all duration-300 cursor-pointer bg-white dark:bg-slate-800 hover:scale-[1.03] ${
            selectedTier === "free"
              ? "border-blue-500 shadow-lg scale-[1.02]"
              : "border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg"
          }`}
        >
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl mb-3">
              <Gift className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {t("pricing.free.name")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("pricing.free.description")}
            </p>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-3">
              €0
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                /{t("pricing.perMonth")}
              </span>
            </div>
          </div>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start text-sm">
              <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">
                {t("pricing.free.feature1")}
              </span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">
                {t("pricing.free.feature2")}
              </span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">
                {t("pricing.free.feature3")}
              </span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">
                {t("pricing.free.feature4")}
              </span>
            </li>
            <li className="flex items-start text-sm">
              <X className="w-5 h-5 text-gray-400 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-400 dark:text-gray-500">
                {t("pricing.free.feature5")}
              </span>
            </li>
            <li className="flex items-start text-sm">
              <X className="w-5 h-5 text-gray-400 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-400 dark:text-gray-500">
                {t("pricing.free.feature6")}
              </span>
            </li>
          </ul>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSelectPlan("free");
            }}
            disabled={loading !== null}
            className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
          >
            {t("pricing.free.cta")}
          </button>
        </div>

        {/* Basic Plan */}
        <div
          onClick={() => setSelectedTier("basic")}
          className={`border-2 rounded-xl p-4 sm:p-6 relative transition-all duration-300 cursor-pointer bg-white dark:bg-slate-800 ${
            selectedTier === "basic"
              ? "border-blue-500 shadow-2xl scale-105"
              : "border-blue-500 dark:border-blue-600 shadow-lg scale-[1.02] hover:scale-105 hover:shadow-2xl"
          }`}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            {t("pricing.recommended")}
          </div>

          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl mb-3">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {t("pricing.basic.name")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("pricing.basic.description")}
            </p>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-3">
              €4.99
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                /{t("pricing.perMonth")}
              </span>
            </div>
          </div>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start text-sm">
              <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {t("pricing.basic.feature1")}
              </span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {t("pricing.basic.feature2")}
              </span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {t("pricing.basic.feature3")}
              </span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {t("pricing.basic.feature4")}
              </span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">
                {t("pricing.basic.feature5")}
              </span>
            </li>
            <li className="flex items-start text-sm">
              <X className="w-5 h-5 text-gray-400 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-400 dark:text-gray-500">
                {t("pricing.basic.feature6")}
              </span>
            </li>
          </ul>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSelectPlan("basic");
            }}
            disabled={loading !== null}
            className="w-full bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading === "basic" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("pricing.processing")}
              </>
            ) : (
              <>
                {t("pricing.basic.cta")}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Premium Plan */}
        <div
          onClick={() => setSelectedTier("premium")}
          className={`border-2 rounded-xl p-4 sm:p-6 transition-all duration-300 cursor-pointer bg-white dark:bg-slate-800 ${
            selectedTier === "premium"
              ? "border-purple-500 shadow-lg scale-[1.02]"
              : "border-purple-500 dark:border-purple-600 hover:shadow-lg hover:scale-[1.03]"
          }`}
        >
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl mb-3">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {t("pricing.premium.name")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("pricing.premium.description")}
            </p>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-3">
              €9.99
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                /{t("pricing.perMonth")}
              </span>
            </div>
          </div>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start text-sm">
              <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {t("pricing.premium.feature1")}
              </span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {t("pricing.premium.feature2")}
              </span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {t("pricing.premium.feature3")}
              </span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {t("pricing.premium.feature4")}
              </span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">
                {t("pricing.premium.feature5")}
              </span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">
                {t("pricing.premium.feature6")}
              </span>
            </li>
          </ul>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSelectPlan("premium");
            }}
            disabled={loading !== null}
            className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading === "premium" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("pricing.processing")}
              </>
            ) : (
              <>
                {t("pricing.premium.cta")}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Try Free CTA */}
      <div className="bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 mb-6 border border-emerald-200 dark:border-emerald-800">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {t("pricing.tryFreeTitle")}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("pricing.tryFreeDescription")}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("pricing.footer1")}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          {t("pricing.footer2")}
        </p>
      </div>
    </>
  );

  // Full page layout
  if (isFullPage) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-gray-100 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">{content}</div>
      </div>
    );
  }

  // Modal layout
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full p-6 sm:p-8 my-8 relative">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={loading !== null}
          >
            <X className="w-6 h-6" />
          </button>
        )}
        {content}
      </div>
    </div>
  );
}
