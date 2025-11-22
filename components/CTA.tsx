"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section className="relative py-24 bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      {/* Dekoratívne pozadie */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl"></div>
        {/* Animované hviezdičky */}
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, 100, -50, 80, 0],
            y: [0, -80, 60, -40, 0],
            opacity: [0.4, 0.8, 0.3, 0.7, 0.4],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: "20%", left: "20%" }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, -80, 60, -40, 0],
            y: [0, 70, -90, 50, 0],
            opacity: [0.3, 0.7, 0.4, 0.8, 0.3],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          style={{ top: "40%", right: "20%" }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, -60, 90, -70, 0],
            y: [0, -50, 80, -30, 0],
            opacity: [0.5, 0.3, 0.8, 0.4, 0.5],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          style={{ bottom: "30%", left: "33%" }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, 70, -80, 50, 0],
            y: [0, -60, 40, -70, 0],
            opacity: [0.6, 0.4, 0.7, 0.3, 0.6],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
          style={{ top: "60%", right: "30%" }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, -90, 40, -60, 0],
            y: [0, 80, -70, 50, 0],
            opacity: [0.4, 0.8, 0.5, 0.7, 0.4],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          style={{ top: "15%", left: "60%" }}
        />
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-7xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8 border border-white/20"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold text-white">
              Start today - it&apos;s free!
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight"
          >
            Ready to study{" "}
            <span className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              more effectively?
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed"
          >
            Join hundreds of students who are already using AI to improve their
            studies
          </motion.p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="group inline-flex items-center space-x-2 bg-white text-blue-600 font-bold py-4 px-10 rounded-xl hover:bg-gray-50 transition-all duration-300 text-lg shadow-2xl hover:shadow-white/20 hover:scale-105"
            >
              <span>Start for free</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">
                →
              </span>
            </Link>

            <div className="flex items-center space-x-2 text-blue-200 text-sm">
              <svg
                className="w-5 h-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>No credit card required</span>
            </div>
          </div>

          {/* Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                500+
              </div>
              <div className="text-sm text-blue-200">Active students</div>
            </div>
            <div className="text-center border-x border-white/20">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                10k+
              </div>
              <div className="text-sm text-blue-200">Processed lectures</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                4.9/5
              </div>
              <div className="text-sm text-blue-200">User rating</div>
            </div>
          </motion.div>

          {/* Reviews */}
          <div className="mt-20 max-w-6xl mx-auto">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-2xl font-bold text-white text-center mb-12"
            >
              What our students say
            </motion.h3>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Review 1 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-blue-100 mb-4 leading-relaxed">
                  This tool completely changed the way I study. I no longer have
                  to spend hours transcribing lectures, everything is saved
                  automatically.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div>
                    <div className="text-white font-semibold">Martin K.</div>
                    <div className="text-blue-300 text-sm">Medical student</div>
                  </div>
                </div>
              </motion.div>

              {/* Review 2 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-blue-100 mb-4 leading-relaxed">
                  Generating test questions is great for exam preparation. I
                  finally know what to focus on and what I should know.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-10 h-10 bg-linear-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                    L
                  </div>
                  <div>
                    <div className="text-white font-semibold">Lucia T.</div>
                    <div className="text-blue-300 text-sm">Law student</div>
                  </div>
                </div>
              </motion.div>

              {/* Review 3 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.7 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-blue-100 mb-4 leading-relaxed">
                  Simple and intuitive interface. I upload a PDF and in a few
                  minutes I have study materials ready. Brilliant!
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-10 h-10 bg-linear-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-bold">
                    P
                  </div>
                  <div>
                    <div className="text-white font-semibold">Peter S.</div>
                    <div className="text-blue-300 text-sm">
                      Computer science student
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
