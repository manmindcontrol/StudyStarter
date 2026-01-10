"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Zap,
  Crown,
  Gift,
  ArrowRight,
  Loader2,
} from "lucide-react";

const tiers = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Try our platform with limited features",
    icon: Gift,
    color: "from-gray-500 to-gray-600",
    features: [
      { text: "1 study material upload", included: true },
      { text: "1x AI notes generation (lifetime)", included: true },
      { text: "1x AI quiz generation (lifetime)", included: true },
      { text: "Basic chatbot", included: true },
      { text: "PDF conversions (€0.50 each)", included: true, note: true },
      { text: "Advanced AI features", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Current Plan",
    highlighted: false,
  },
  {
    id: "basic",
    name: "Basic",
    price: 4.99,
    description: "Perfect for regular students",
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    features: [
      { text: "20 PDF conversions/month", included: true },
      { text: "10 materials uploads/month", included: true },
      { text: "10 AI notes generations/month", included: true },
      { text: "10 AI quiz generations/month", included: true },
      { text: "Advanced chatbot", included: true },
      { text: "Lecture uploads (audio/video)", included: true },
      { text: "Priority support", included: false },
    ],
    cta: "Upgrade to Basic",
    highlighted: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 9.99,
    description: "For power users who need unlimited access",
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    features: [
      { text: "Unlimited PDF conversions", included: true },
      { text: "Unlimited materials uploads", included: true },
      { text: "Unlimited AI notes generations", included: true },
      { text: "Unlimited AI quiz generations", included: true },
      { text: "Advanced AI features", included: true },
      { text: "Priority support", included: true },
      { text: "Export to multiple formats", included: true },
    ],
    cta: "Upgrade to Premium",
    highlighted: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (tierId: string) => {
    if (tierId === "free") return;

    setLoading(tierId);

    try {
      // Vytvor checkout session
      const response = await fetch("/api/stripe/create-subscription-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier: tierId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Presmeruj na Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create checkout session"
      );
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-100 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Select the perfect plan for your study needs. Upgrade or downgrade
            anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${
                  tier.highlighted
                    ? "ring-4 ring-blue-500 dark:ring-blue-400 scale-105 md:scale-110"
                    : "hover:scale-105"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    POPULAR
                  </div>
                )}

                <div className="p-8">
                  {/* Icon & Name */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${tier.color}`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {tier.name}
                    </h3>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                        €{tier.price.toFixed(2)}
                      </span>
                      {tier.price > 0 && (
                        <span className="ml-2 text-gray-600 dark:text-gray-400">
                          /month
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {tier.description}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-3 mt-0.5 shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-gray-400 dark:text-gray-600 mr-3 mt-0.5 shrink-0" />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included
                              ? "text-gray-700 dark:text-gray-300"
                              : "text-gray-400 dark:text-gray-600 line-through"
                          }`}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={tier.id === "free" || loading === tier.id}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                      tier.highlighted
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                        : tier.id === "free"
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading === tier.id ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <span>{tier.cta}</span>
                        {tier.id !== "free" && (
                          <ArrowRight className="w-5 h-5" />
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All plans include access to our core features. Cancel anytime, no
            questions asked.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Need help choosing?{" "}
            <a
              href="/contact"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
