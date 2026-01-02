"use client";
import { Mic, FileText, Brain } from "lucide-react";
import { motion } from "framer-motion";

export default function Features() {
  const features = [
    {
      icon: Mic,
      title: "Automatic lecture recording",
      description:
        "Record your lecture in real-time using a microphone. AI automatically transcribes speech to text and creates a clear transcript with editing options.",
      color: "green",
    },
    {
      icon: FileText,
      title: "Study materials processing",
      description:
        "Upload PDF or Word documents. AI analyzes them and prepares study materials precisely according to your exam questions from the provided materials.",
      color: "blue",
    },
    {
      icon: Brain,
      title: "Test and question generation",
      description:
        "Based on your materials, AI creates test questions for review. Perfect for exam preparation and knowledge verification.",
      color: "purple",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      purple: "bg-purple-100 text-purple-600",
      orange: "bg-orange-100 text-orange-600",
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <section
      id="funkcie"
      className="relative py-24 bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden"
    >
      {/* Dekoratívne pozadie */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl"></div>
        {/* Animované hviezdičky */}
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, 80, -60, 70, 0],
            y: [0, -70, 50, -60, 0],
            opacity: [0.3, 0.7, 0.4, 0.8, 0.3],
          }}
          transition={{
            duration: 17,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: "10%", left: "15%" }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, -70, 50, -60, 0],
            y: [0, 80, -70, 40, 0],
            opacity: [0.4, 0.6, 0.5, 0.9, 0.4],
          }}
          transition={{
            duration: 19,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.7,
          }}
          style={{ top: "25%", right: "25%" }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, -50, 80, -90, 0],
            y: [0, -60, 70, -40, 0],
            opacity: [0.5, 0.4, 0.7, 0.3, 0.5],
          }}
          transition={{
            duration: 21,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.2,
          }}
          style={{ bottom: "25%", left: "33%" }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, 60, -70, 40, 0],
            y: [0, -50, 60, -80, 0],
            opacity: [0.6, 0.3, 0.8, 0.4, 0.6],
          }}
          transition={{
            duration: 23,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.8,
          }}
          style={{ top: "70%", right: "35%" }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, -80, 30, -50, 0],
            y: [0, 70, -90, 60, 0],
            opacity: [0.4, 0.7, 0.5, 0.6, 0.4],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2.3,
          }}
          style={{ top: "50%", left: "65%" }}
        />
      </div>

      <div className="container-custom relative z-10">
        {/* Section heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/30"
          >
            <span className="text-sm font-semibold text-white">
              Why choose our assistant?
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
          >
            Features that make studying easier
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-300"
          >
            Harness the power of artificial intelligence for more effective
            learning and exam preparation
          </motion.p>
        </div>

        {/* Grid funkcií */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group rounded-2xl card hover:shadow-2xl transition-all duration-300 bg-white p-8 relative overflow-hidden"
              >
                {/* linear overlay pri hoveri */}
                <div className="absolute inset-0 bg-linear-to-br from-blue-50/0 to-cyan-50/0 group-hover:from-blue-50 group-hover:to-cyan-50 transition-all duration-300 rounded-2xl"></div>

                <div className="relative z-10">
                  <div
                    className={`w-14 h-14 rounded-xl ${getColorClasses(
                      feature.color
                    )} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Dekoratívna čiara */}
                <div className="absolute bottom-0 left-0 w-0 h-1 bg-linear-to-r from-blue-600 to-cyan-600 group-hover:w-full transition-all duration-500"></div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
