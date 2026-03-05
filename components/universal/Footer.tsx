import Link from "next/link";
import Image from "next/image";
import { Mail, ShieldCheck } from "lucide-react";
import CookieSettingsButton from "./CookieSettingsButton";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-linear-to-br from-gray-900 via-slate-800 to-gray-900 border-t border-gray-700/50 mt-auto relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDE0YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02ek0yNCAzOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>

      <div className="container-custom py-10 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-8">
          {/* Logo & Description */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/logo.webp"
                alt="StudyStarter Logo"
                width={40}
                height={40}
                className="w-9 h-9"
              />
              <span className="text-xl font-bold font-sora tracking-tight">
                <span className="text-white">Study</span>
                <span className="bg-linear-to-r from-cyan-400 to-sky-500 bg-clip-text text-transparent">
                  Starter
                </span>
                <span className="text-white text-xl">.io</span>
              </span>
            </Link>
            <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Active and ready to help</span>
            </div>
          </div>

          {/* Links - compact horizontal layout */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Link
              href="/contact"
              className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
            >
              Contact & Help
            </Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link
              href="/privacy"
              className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link
              href="/terms"
              className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
            >
              Terms of Use
            </Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link
              href="/cookies"
              className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
            >
              Cookies
            </Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <CookieSettingsButton />
          </div>
        </div>

        {/* Copyright + Stripe + Email */}
        <div className="border-t border-gray-700/30 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {currentYear} StudyStarter. All rights reserved.
            </p>

            <div className="flex items-center gap-1.5 text-gray-500 text-xs border border-gray-700/50 rounded-full px-3 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              <span>Secure payments by</span>
              <span className="font-semibold text-gray-300 tracking-wide">Stripe</span>
            </div>

            <a
              href="mailto:info@studystarter.io"
              className="flex items-center gap-2 text-gray-400 hover:text-blue-400 text-sm transition-colors duration-200"
            >
              <Mail className="w-4 h-4" />
              <span>info@studystarter.io</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
