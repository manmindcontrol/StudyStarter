"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, BookOpen } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-lg shadow-blue-500/5">
      <div className="container-custom">
        <div className="flex justify-between items-center h-18">
          {/* Logo and name */}
          <Link
            href="/"
            className="flex items-center space-x-3 hover:scale-105 transition-transform duration-200"
          >
            <div className="bg-linear-to-br from-blue-600 via-blue-500 to-cyan-500 text-white w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-shadow duration-300">
              <BookOpen className="w-7 h-7" />
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent hidden sm:block">
              Study Assistant
            </span>
            <span className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent sm:hidden">
              SA
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/#funkcie"
              className="text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 relative group"
            >
              Features
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-linear-to-r from-blue-600 to-cyan-500 group-hover:w-3/4 transition-all duration-300"></span>
            </Link>
            <Link
              href="/prednasky"
              className="text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 relative group"
            >
              Lectures
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-linear-to-r from-blue-600 to-cyan-500 group-hover:w-3/4 transition-all duration-300"></span>
            </Link>
            <Link
              href="/materialy"
              className="text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 relative group"
            >
              Materials
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-linear-to-r from-blue-600 to-cyan-500 group-hover:w-3/4 transition-all duration-300"></span>
            </Link>
            <Link
              href="/testy"
              className="text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 relative group"
            >
              Tests
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-linear-to-r from-blue-600 to-cyan-500 group-hover:w-3/4 transition-all duration-300"></span>
            </Link>
          </div>

          {/* Desktop login */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/login"
              className="text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium px-5 py-2 rounded-lg hover:bg-gray-50"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold py-2.5 px-7 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
            >
              Register
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2.5 rounded-xl hover:bg-linear-to-br hover:from-blue-50 hover:to-cyan-50 transition-all duration-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200/50 bg-linear-to-b from-white to-blue-50/30">
            <div className="flex flex-col space-y-2">
              <Link
                href="/#funkcie"
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium px-4 py-3 rounded-lg mx-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/prednasky"
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium px-4 py-3 rounded-lg mx-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Lectures
              </Link>
              <Link
                href="/materialy"
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium px-4 py-3 rounded-lg mx-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Materials
              </Link>
              <Link
                href="/testy"
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium px-4 py-3 rounded-lg mx-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tests
              </Link>

              <div className="border-t border-gray-200/50 pt-4 px-4 space-y-3 mt-2">
                <Link
                  href="/login"
                  className="block text-center text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200 font-medium py-3 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="block text-center bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
