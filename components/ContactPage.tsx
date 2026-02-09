"use client";

import Image from "next/image";
import { Mail, MessageCircle, Clock } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Full-screen background image */}
      <div className="absolute inset-0">
        <Image
          src="/contact.png"
          alt="Contact StudyStarter"
          fill
          className="object-cover object-[center_10%]"
          priority
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-xl">
            {/* Header */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
              {t("contact.title")}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-10">
              {t("contact.subtitle")}
            </p>

            {/* Contact Cards */}
            <div className="space-y-4">
              {/* Email Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/30 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-blue-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      {t("contact.emailTitle")}
                    </h3>
                    <a
                      href="mailto:info@studystarter.io"
                      className="text-blue-300 hover:text-blue-200 font-medium text-lg"
                    >
                      info@studystarter.io
                    </a>
                    <p className="text-gray-300 text-sm mt-2">
                      {t("contact.emailDescription")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Support Info */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/30 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-6 h-6 text-green-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      {t("contact.supportTitle")}
                    </h3>
                    <p className="text-gray-300">
                      {t("contact.supportDescription")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Response Time */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/30 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-purple-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      {t("contact.responseTitle")}
                    </h3>
                    <p className="text-gray-300">
                      {t("contact.responseDescription")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <a
              href="mailto:info@studystarter.io"
              className="mt-8 block w-full text-center bg-linear-to-r from-blue-600 to-cyan-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl"
            >
              {t("contact.sendEmail")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
