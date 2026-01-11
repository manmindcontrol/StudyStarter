"use client";

import Link from "next/link";
import { BookOpen, Mic, FileText, Brain } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LandingPage() {
  const { t } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
  }, []);

  return (
    <section className="relative bg-linear-to-b from-blue-50 via-blue-50 to-cyan-50 py-24 overflow-hidden ">
      {/* Dekoratívne pozadie */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      {/* Monster - absolútne pozadie na všetkých zariadeniach */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none overflow-hidden ">
        <div className="w-[420px] sm:w-[420px] md:w-[480px] lg:w-[580px] xl:w-[580px] opacity-50 lg:opacity-100 lg:translate-x-60 translate-y-0 lg:translate-y-34">
          <Image
            src="/monster.svg"
            alt="AI Learning Monster"
            width={400}
            height={520}
            className="w-full h-auto drop-shadow-2xl"
            priority
          />
        </div>
      </div>

      <div className="container-custom relative">
        {/* 3-stĺpcový layout na desktope: Text | Icon rail */}
        <div className="grid items-center gap-10 lg:gap-14 lg:grid-cols-[1fr_auto]">
          {/* LEFT: Text content */}
          <div className="text-center lg:text-left relative z-20 max-w-2xl mx-auto lg:mx-0">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 bg-linear-to-r from-blue-100 to-cyan-100 px-5 py-2 rounded-full mb-8 border border-blue-200/50 shadow-sm"
            >
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-blue-700">
                {t("landing.badge")}
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight"
            >
              <span className="bg-linear-to-t from-gray-500 to-slate-900 bg-clip-text text-transparent">
                {t("landing.title")}{" "}
              </span>
              <span className="bg-linear-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent animate-linear">
                {t("landing.titleAI")}
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed"
            >
              {t("landing.description")}
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={isLoggedIn ? "/dashboard" : "/register"}
                  className="group btn-primary text-lg bg-linear-to-r from-blue-600 to-cyan-600 px-8 py-4 rounded-xl text-white hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 font-semibold inline-block"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>{t("landing.startFree")}</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-200">
                      →
                    </span>
                  </span>
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="#funkcie"
                  className="btn-secondary text-lg bg-white border-2 border-gray-100 px-8 py-4 rounded-xl hover:bg-gray-50 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-gray-700 hover:text-blue-600 inline-block"
                >
                  {t("landing.learnMore")}
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* RIGHT: Vertical icon rail (as on screenshot) */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="hidden lg:flex justify-self-end relative z-10"
          >
            <div className="w-[120px] bg-white/40 backdrop-blur-md border border-white/60 shadow-xl rounded-3xl p-4 flex flex-col items-center gap-6 text-center">
              <div className="space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 flex items-center justify-center shadow-sm">
                  <Mic className="w-7 h-7 text-blue-600" />
                </div>
                <p className="text-xs font-medium text-gray-600 leading-snug">
                  {t("landing.lectureRecording")}
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-green-100 flex items-center justify-center shadow-sm">
                  <FileText className="w-7 h-7 text-green-600" />
                </div>
                <p className="text-xs font-medium text-gray-600 leading-snug">
                  {t("landing.materialAnalysis")}
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-100 flex items-center justify-center shadow-sm">
                  <Brain className="w-7 h-7 text-purple-600" />
                </div>
                <p className="text-xs font-medium text-gray-600 leading-snug">
                  {t("landing.aiNotes")}
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-100 flex items-center justify-center shadow-sm">
                  <BookOpen className="w-7 h-7 text-orange-600" />
                </div>
                <p className="text-xs font-medium text-gray-600 leading-snug">
                  {t("landing.testQuestions")}
                </p>
              </div>
            </div>
          </motion.aside>
        </div>

        {/* MOBILE: Features panel pod textom */}
        <div className="lg:hidden relative">
          {/* Features panel pod textom - relatívne z-index */}
          <div className="relative z-10 mt-10 flex items-center justify-center px-4">
            <div className="bg-white/30 backdrop-blur-md border border-white/60 shadow-xl rounded-3xl p-3 sm:p-4 flex items-center gap-2 sm:gap-4 max-w-full">
              <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-100 flex items-center justify-center shadow-sm">
                  <Mic className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-[9px] sm:text-[10px] font-medium text-gray-600 text-center leading-tight">
                  {t("landing.lectureRecordingShort")}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-green-100 flex items-center justify-center shadow-sm">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-[9px] sm:text-[10px] font-medium text-gray-600 text-center leading-tight">
                  {t("landing.materialAnalysisShort")}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-purple-100 flex items-center justify-center shadow-sm">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-[9px] sm:text-[10px] font-medium text-gray-600 text-center leading-tight">
                  {t("landing.aiNotesShort")}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-orange-100 flex items-center justify-center shadow-sm">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-[9px] sm:text-[10px] font-medium text-gray-600 text-center leading-tight">
                  {t("landing.testQuestionsShort")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
