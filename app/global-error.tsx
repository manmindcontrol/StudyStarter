"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Link } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-blue-100 to-blue-200 px-4">
          <div className="text-center">
            {/* Large 500 in background */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[20rem] md:text-[25rem] font-bold text-blue-200/30 select-none leading-none">
                  500
                </span>
              </div>

              {/* Monster SVG */}
              <div className="relative z-10 flex justify-center py-12">
                <Image
                  src="/confused.svg"
                  alt="StudyStarter maskot - na stránke nastala chyba"
                  width={400}
                  height={400}
                  className="drop-shadow-2xl"
                  priority
                />
              </div>
            </div>

            {/* Error message */}
            <h1 className="text-4xl md:text-5xl font-bold text-blue-600 mb-4 mt-8">
              OOPS Something went wrong
            </h1>
            <p className="text-xl md:text-2xl text-blue-500 mb-8">
              Refresh the site.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={reset}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-200 shadow-lg"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="px-8 py-3 bg-white hover:bg-gray-50 text-blue-600 rounded-lg font-semibold transition-colors duration-200 shadow-lg"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
