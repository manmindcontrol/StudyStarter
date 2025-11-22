"use client";
import Link from "next/link";
import { BookOpen, Mic, FileText, Brain } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <section className="relative bg-linear-to-br from-blue-50 via-white to-cyan-50 py-24 overflow-hidden">
      {/* Dekoratívne pozadie */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-linear-to-r from-blue-100 to-cyan-100 px-5 py-2 rounded-full mb-8 border border-blue-200/50 shadow-sm"
          >
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold text-blue-700">
              Nová AI-powered platforma pre študentov
            </span>
          </motion.div>

          {/* Hlavný nadpis */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="bg-linear-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Študuj efektívnejšie pomocou{" "}
            </span>
            <span className="bg-linear-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent animate-linear">
              AI
            </span>
          </motion.h1>

          {/* Popis */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto"
          >
            Automatický zápis prednášok, inteligentné spracovanie študijných
            materiálov a generovanie testových otázok. Všetko na jednom mieste.
          </motion.p>

          {/* CTA tlačidlá */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-5 justify-center mb-16"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/register"
                className="group btn-primary text-lg bg-linear-to-r from-blue-600 to-cyan-600 px-8 py-4 rounded-xl text-white hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 font-semibold inline-block"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>Začať zadarmo</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">
                    →
                  </span>
                </span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="#funkcie"
                className="btn-secondary text-lg bg-white border-2 border-gray-200 px-8 py-4 rounded-xl hover:bg-gray-50 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-gray-700 hover:text-blue-600 inline-block"
              >
                Zistiť viac
              </Link>
            </motion.div>
          </motion.div>

          {/* Ikony funkcií */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group flex flex-col items-center p-6 rounded-2xl hover:bg-white transition-all duration-300 hover:shadow-xl"
            >
              <div className="bg-linear-to-br from-blue-100 to-blue-200 p-5 rounded-2xl mb-4 shadow-lg shadow-blue-500/20 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all duration-300">
                <Mic className="w-8 h-8 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                Zápis prednášok
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group flex flex-col items-center p-6 rounded-2xl hover:bg-white transition-all duration-300 hover:shadow-xl"
            >
              <div className="bg-linear-to-br from-green-100 to-green-200 p-5 rounded-2xl mb-4 shadow-lg shadow-green-500/20 group-hover:shadow-xl group-hover:shadow-green-500/30 transition-all duration-300">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-green-600 transition-colors">
                Analýza materiálov
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group flex flex-col items-center p-6 rounded-2xl hover:bg-white transition-all duration-300 hover:shadow-xl"
            >
              <div className="bg-linear-to-br from-purple-100 to-purple-200 p-5 rounded-2xl mb-4 shadow-lg shadow-purple-500/20 group-hover:shadow-xl group-hover:shadow-purple-500/30 transition-all duration-300">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-purple-600 transition-colors">
                AI výcuc
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group flex flex-col items-center p-6 rounded-2xl hover:bg-white transition-all duration-300 hover:shadow-xl"
            >
              <div className="bg-linear-to-br from-orange-100 to-orange-200 p-5 rounded-2xl mb-4 shadow-lg shadow-orange-500/20 group-hover:shadow-xl group-hover:shadow-orange-500/30 transition-all duration-300">
                <BookOpen className="w-8 h-8 text-orange-600" />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600 transition-colors">
                Testové otázky
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
