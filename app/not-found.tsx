import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-blue-400 to-blue-100 px-2">
      <div className="text-center md:space-y-2">
        {/* Large 404 in background */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[15rem] md:text-[35rem] font-bold bg-linear-to-b from-blue-200 to-blue-300 text-transparent bg-clip-text select-none leading-none">
              404
            </span>
          </div>

          {/* Monster SVG */}
          <div className="relative z-10 flex justify-center py-2">
            <Image
              src="/monster.svg"
              alt="404 Monster"
              width={400}
              height={400}
              className="drop-shadow-2xl w-[300px] h-[300px] md:w-[400px] md:h-[400px]"
              priority
            />
          </div>
        </div>

        {/* Error message */}
        <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-t from-gray-500  to-slate-900 bg-clip-text text-transparent sm:py-1">
          OOPS Page not found
        </h1>
        <p className="text-lg md:text-xl bg-linear-to-t from-gray-400  to-slate-800 bg-clip-text text-transparent mb-8">
          The page you are looking for does not exist.
        </p>

        {/* Action button */}
        <div className="flex justify-center">
          <Link
            href="/"
            className="px-8 py-3 bg-linear-to-br from-blue-600 to-cyan-500 hover:from-blue-700 to:cyan-600 hover:scale-110  dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
