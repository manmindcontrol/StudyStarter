"use client";

import { useState } from "react";
import { X, Check, Zap, Crown, Sparkles } from "lucide-react";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({
  isOpen,
  onClose,
}: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectPlan = async (tierId: string) => {
    if (tierId === "free") {
      // User chose to stay on free plan
      onClose();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/stripe/create-subscription-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tierId: tierId, // Send tier ID, server will resolve price ID
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Error creating checkout:", err);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full p-8 my-8 animate-fade-in relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          disabled={loading}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-blue-600 to-cyan-500 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to StudyStarter! 🎉
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Choose a plan to get started with your learning journey
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Free Plan */}
          <div className="border-2 border-gray-200 dark:border-slate-700 rounded-xl p-6 hover:border-blue-300 dark:hover:border-blue-600 transition-all">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Free
              </h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                €0
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  /month
                </span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start text-sm">
                <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">
                  1 study material (lifetime)
                </span>
              </li>
              <li className="flex items-start text-sm">
                <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">
                  1 AI note generation (lifetime)
                </span>
              </li>
              <li className="flex items-start text-sm">
                <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">
                  1 AI quiz generation (lifetime)
                </span>
              </li>
              <li className="flex items-start text-sm">
                <X className="w-5 h-5 text-red-500 mr-2 shrink-0 mt-0.5" />
                <span className="text-gray-500 dark:text-gray-400">
                  PDF conversions (€0.50 each)
                </span>
              </li>
            </ul>

            <button
              onClick={() => handleSelectPlan("free")}
              disabled={loading}
              className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
            >
              Continue with Free
            </button>
          </div>

          {/* Basic Plan */}
          <div className="border-2 border-blue-500 dark:border-blue-600 rounded-xl p-6 relative shadow-lg transform scale-105">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              RECOMMENDED
            </div>

            <div className="text-center mb-4">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Basic
                </h3>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                €4.99
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  /month
                </span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start text-sm">
                <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>20 PDF conversions</strong>/month
                </span>
              </li>
              <li className="flex items-start text-sm">
                <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>10 materials</strong>/month
                </span>
              </li>
              <li className="flex items-start text-sm">
                <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>10 AI generations</strong>/month
                </span>
              </li>
              <li className="flex items-start text-sm">
                <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">
                  Lecture uploads
                </span>
              </li>
              <li className="flex items-start text-sm">
                <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">
                  Advanced chatbot
                </span>
              </li>
            </ul>

            <button
              onClick={() => handleSelectPlan("basic")}
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Start with Basic"}
            </button>
          </div>

          {/* Premium Plan */}
          <div className="border-2 border-purple-500 dark:border-purple-600 rounded-xl p-6 hover:shadow-lg transition-all">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center mb-2">
                <Crown className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-2" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Premium
                </h3>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                €9.99
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  /month
                </span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start text-sm">
                <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>Unlimited</strong> PDF conversions
                </span>
              </li>
              <li className="flex items-start text-sm">
                <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>Unlimited</strong> materials
                </span>
              </li>
              <li className="flex items-start text-sm">
                <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>Unlimited</strong> AI generations
                </span>
              </li>
              <li className="flex items-start text-sm">
                <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">
                  Priority support
                </span>
              </li>
              <li className="flex items-start text-sm">
                <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">
                  Advanced AI features
                </span>
              </li>
            </ul>

            <button
              onClick={() => handleSelectPlan("premium")}
              disabled={loading}
              className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Start with Premium"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          You can change or cancel your plan anytime from your profile settings.
        </p>
      </div>
    </div>
  );
}
