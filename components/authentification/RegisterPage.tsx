"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { signUp } from "@/lib/auth";
import {
  BookOpen,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { signInWithGoogle } from "@/lib/auth";
import { div } from "framer-motion/client";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(""); // Vyčisti error pri písaní
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError("Zadaj svoje meno");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Zadaj email");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Neplatný email formát");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Heslo musí mať minimálne 6 znakov");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Heslá sa nezhodujú");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    const { user, error } = await signUp(
      formData.email,
      formData.password,
      formData.fullName
    );

    if (error) {
      setError(error);
      setLoading(false);
      return;
    }

    if (user) {
      setSuccess(true);
      // Počkaj chvíľu a presmeruj
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    }

    setLoading(false);
  };
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    const { error } = await signInWithGoogle();

    if (error) {
      setError("Chyba pri prihlásení cez Google");
      setLoading(false);
    }
    // Google presmeruje na callback, takže tu netreba robiť nič iné
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Dekoratívne pozadie */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl"></div>

        {/* Animované hviezdičky */}
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, -70, 90, -50, 0],
            y: [0, 80, -60, 70, 0],
            opacity: [0.3, 0.8, 0.4, 0.7, 0.3],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: "15%", left: "15%" }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, 90, -70, 50, 0],
            y: [0, -60, 80, -40, 0],
            opacity: [0.4, 0.7, 0.3, 0.8, 0.4],
          }}
          transition={{
            duration: 19,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.7,
          }}
          style={{ top: "50%", right: "15%" }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, -50, 70, -80, 0],
            y: [0, -70, 50, -30, 0],
            opacity: [0.5, 0.3, 0.7, 0.4, 0.5],
          }}
          transition={{
            duration: 21,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.3,
          }}
          style={{ bottom: "25%", left: "40%" }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, 60, -90, 40, 0],
            y: [0, 70, -50, 60, 0],
            opacity: [0.6, 0.4, 0.8, 0.3, 0.6],
          }}
          transition={{
            duration: 17,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.8,
          }}
          style={{ top: "70%", right: "35%" }}
        />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo a nadpis */}
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
              whileHover={{ scale: 1.05, rotate: -5 }}
              className="bg-linear-to-br from-purple-400 to-blue-400 text-white w-14 h-14 rounded-xl flex items-center justify-center shadow-2xl shadow-purple-500/50"
            >
              <BookOpen className="w-8 h-8" />
            </motion.div>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            Create your account
          </h1>
          <p className="text-blue-200">Start studying more effectively today</p>
        </motion.div>

        {/* Formulár */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20"
        >
          {/* Success správa */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-green-500/20 backdrop-blur-sm border border-green-400/50 rounded-lg flex items-start space-x-3"
            >
              <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-green-100">
                  Successfully registered!
                </h3>
                <p className="text-sm text-green-200">
                  Redirecting to dashboard...
                </p>
              </div>
            </motion.div>
          )}

          {/* Error správa */}
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
            {/* Meno */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-blue-100 mb-2"
              >
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all text-white placeholder-blue-300/50 backdrop-blur-sm"
                  placeholder="John Doe"
                  disabled={loading || success}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-blue-100 mb-2"
              >
                Email
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
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all text-white placeholder-blue-300/50 backdrop-blur-sm"
                  placeholder="your@email.com"
                  disabled={loading || success}
                />
              </div>
            </div>

            {/* Heslo */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-blue-100 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all text-white placeholder-blue-300/50 backdrop-blur-sm"
                  placeholder="••••••••"
                  disabled={loading || success}
                />
              </div>
              <p className="text-xs text-blue-300/70 mt-1">
                Minimum 6 characters
              </p>
            </div>

            {/* Potvrdenie hesla */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-blue-100 mb-2"
              >
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all text-white placeholder-blue-300/50 backdrop-blur-sm"
                  placeholder="••••••••"
                  disabled={loading || success}
                />
              </div>
            </div>

            {/* Google prihlásenie */}
            <div className="relative">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 hover:scale-105 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
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
                <span>Pokračovať s Google</span>
              </button>
            </div>

            {/* Oddeľovač */}
            <div className="relative my-6">
              <div className="relative flex justify-center text-sm">
                <span className="px-4  bg-white/10 border border-white/20 rounded-lg text-blue-300">
                  alebo emailom
                </span>
              </div>
            </div>

            {/* Submit button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || success}
              className="w-full bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-purple-500/30"
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
                  Creating account...
                </>
              ) : success ? (
                "Successfully created ✓"
              ) : (
                "Create account"
              )}
            </motion.button>
          </form>

          {/* Link na login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-blue-200">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-blue-300 hover:text-white font-semibold transition-colors"
              >
                Log in
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Späť na hlavnú stránku */}
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
            <span>Back to home</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
