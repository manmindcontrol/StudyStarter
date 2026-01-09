"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Home,
  LayoutDashboard,
  FileText,
  ChevronDown,
} from "lucide-react";
import { getCurrentUser, signOut } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";
import LanguageSelector from "./LanguageSelector";
import { useTranslation } from "@/hooks/useTranslation";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const router = useRouter();
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { user } = await getCurrentUser();
      setUser(user);
    };
    checkUser();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setProfileDropdownOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
      <div className="container-custom">
        <div className="flex justify-between items-center h-18">
          {/* Logo and name */}
          <Link
            href="/"
            className="flex items-center space-x-3 hover:scale-105 transition-transform duration-200"
          >
            <Image
              src="/logo.png"
              alt="StudyStarter Logo"
              width={30}
              height={30}
              className="w-10 h-10"
            />

            <span className="text-xl text-gray-800 dark:text-white hidden sm:block">
              StudyStarter.io
            </span>
            <span className="text-xl font-bold text-gray-800 dark:text-white sm:hidden"></span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 relative group"
            >
              <Home className="w-5 h-5" />
              <span>{t("nav.home")}</span>
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-linear-to-r from-blue-400 to-cyan-300 group-hover:w-3/4 transition-all duration-300"></span>
            </Link>
            <Link
              href="/pdf-converter"
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 relative group"
            >
              <FileText className="w-5 h-5" />
              <span>{t("nav.pdfConverter")}</span>
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-linear-to-r from-blue-400 to-cyan-300 group-hover:w-3/4 transition-all duration-300"></span>
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 relative group"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>{t("nav.dashboard")}</span>
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-linear-to-r from-blue-400 to-cyan-300 group-hover:w-3/4 transition-all duration-300"></span>
              </Link>
            )}
          </div>

          {/* Desktop login */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageSelector />
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800"
                  aria-label="User menu"
                >
                  <div className="w-5 h-8  flex items-center justify-center text-white font-semibold shadow-md">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      profileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 py-2 px-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link
                      href="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors duration-150"
                    >
                      <UserIcon className="w-5 h-5" />
                      <span className="font-medium">{t("nav.profile")}</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">{t("nav.signOut")}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 font-medium px-5 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800"
                >
                  {t("nav.signIn")}
                </Link>
                <Link
                  href="/register"
                  className="bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold py-2.5 px-7 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
                >
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
            <div className="flex flex-col space-y-2">
              <Link
                href="/"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all duration-200 font-medium px-4 py-3 rounded-lg mx-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="w-5 h-5" />
                <span>{t("nav.home")}</span>
              </Link>
              <Link
                href="/pdf-converter"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all duration-200 font-medium px-4 py-3 rounded-lg mx-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FileText className="w-5 h-5" />
                <span>{t("nav.pdfConverter")}</span>
              </Link>
              {user && (
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all duration-200 font-medium px-4 py-3 rounded-lg mx-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>{t("nav.dashboard")}</span>
                </Link>
              )}

              <div
                className={`pt-4 px-4 space-y-3 ${
                  user
                    ? "border-t border-gray-200 dark:border-slate-700 mt-2"
                    : ""
                }`}
              >
                <div className="flex justify-center mb-3">
                  <LanguageSelector />
                </div>
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      className="flex items-center justify-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all duration-200 font-medium py-3 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <UserIcon className="w-5 h-5" />
                      <span>{t("nav.profile")}</span>
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center justify-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 font-medium py-3 rounded-lg"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>{t("nav.signOut")}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block text-center text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all duration-200 font-medium py-3 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("nav.signIn")}
                    </Link>
                    <Link
                      href="/register"
                      className="block text-center bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("nav.register")}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
