"use client";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      number: "1",
      title: t("howItWorks.step1Title"),
      description: t("howItWorks.step1Description"),
    },
    {
      number: "2",
      title: t("howItWorks.step2Title"),
      description: t("howItWorks.step2Description"),
    },
    {
      number: "3",
      title: t("howItWorks.step3Title"),
      description: t("howItWorks.step3Description"),
    },
  ];

  return (
    <section className="relative py-24 bg-linear-to-b from-gray-50 to-white overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-200/30 rounded-full blur-3xl"></div>
      </div>

      {/* max width + centering + horizontal padding */}
      <div className="container-custom max-w-6xl mx-auto px-4 relative z-10">
        {/* Section heading */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block bg-linear-to-r from-blue-100 to-cyan-100 px-4 py-2 rounded-full mb-6 border border-blue-200/50"
          >
            <span className="text-sm font-semibold text-blue-700">
              {t("howItWorks.badge")}
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            {t("howItWorks.title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-600"
          >
            {t("howItWorks.subtitle")}
          </motion.p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connecting line between steps (desktop) */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-1 bg-linear-to-r from-blue-200 via-cyan-200 to-blue-200 -z-10"></div>

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.15 }}
              className="text-center group"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-blue-600 to-cyan-600 text-white text-3xl font-bold mb-6 shadow-xl shadow-blue-500/30 transition-all duration-300"
              >
                <span className="relative z-10">{step.number}</span>
                {/* Animated ring on hover */}
                <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 blur-sm"></div>
              </motion.div>

              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                {step.title}
              </h3>

              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
