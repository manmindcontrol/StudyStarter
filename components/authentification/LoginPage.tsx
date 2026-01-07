"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { signIn } from "@/lib/auth";
import { BookOpen, Mail, Lock, AlertCircle } from "lucide-react";
import { signInWithGoogle } from "@/lib/auth";
import { useTranslation } from "@/hooks/useTranslation";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(""); // Clear error while typing
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError(t("login.errorEmail"));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError(t("login.errorInvalidEmail"));
      return false;
    }
    if (!formData.password) {
      setError(t("login.errorPassword"));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    const { user, error } = await signIn(
      formData.email,
      formData.password,
      rememberMe
    );

    if (error) {
      setError(t("login.errorIncorrectCredentials"));
      setLoading(false);
      return;
    }

    if (user) {
      // Ulož "remember me" preferenziu
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      // Successful login - redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    }

    setLoading(false);
  };
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    const { error } = await signInWithGoogle();

    if (error) {
      setError(t("login.errorGoogleSignIn"));
      setLoading(false);
    }
    // Google redirects to callback, so nothing else needed here
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl"></div>

        {/* Animated stars */}
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
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo and heading */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center space-x-2 mb-6"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="bg-linear-to-br from-blue-600 to-sky-500 text-white w-14 h-14 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-500/50"
            >
              <BookOpen className="w-8 h-8" />
            </motion.div>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">{t("login.title")}</h1>
          <p className="text-blue-200">{t("login.subtitle")}</p>
        </motion.div>

        {/* Formulár */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20"
        >
          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/50 rounded-lg flex items-start space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-300 mt-0.5 shrink-0" />
              <p className="text-sm text-red-100">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-blue-100 mb-2"
              >
                {t("login.email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-white placeholder-blue-300/50 backdrop-blur-sm"
                  placeholder={t("login.emailPlaceholder")}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-blue-100"
                >
                  {t("login.password")}
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs text-blue-300 hover:text-blue-200 transition-colors"
                >
                  {t("login.forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-transparent transition-all text-white placeholder-blue-300/50 backdrop-blur-sm"
                  placeholder={t("login.passwordPlaceholder")}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Remember Me checkbox */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-2 focus:ring-blue-400"
                disabled={loading}
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 block text-sm text-blue-200"
              >
                {t("login.rememberMe")}
              </label>
            </div>

            {/* Google sign-in */}
            <div className="relative">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>{t("login.continueWithGoogle")}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="relative flex justify-center text-sm">
                <span className="px-4  bg-white/10 border border-white/20 rounded-lg text-blue-300">
                  {t("login.orWithEmail")}
                </span>
              </div>
            </div>
            {/* Submit button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-600 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-blue-500/30 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("login.loggingIn")}
                </>
              ) : (
                t("login.loginButton")
              )}
            </motion.button>
          </form>

          {/* Divider */}

          {/* Registration link */}
          <div className="text-center mt-6">
            <p className="text-sm text-blue-200">
              {t("login.noAccount")}{" "}
              <Link
                href="/register"
                className="text-blue-300 hover:text-white font-semibold transition-colors"
              >
                {t("login.signUp")}
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Back to home page */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 text-center"
        >
          <Link
            href="/"
            className="text-sm text-blue-300 hover:text-white transition-colors inline-flex items-center space-x-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform duration-200">
              ←
            </span>
            <span>{t("login.backToHome")}</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
