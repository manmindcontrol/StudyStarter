import Link from "next/link";
import { BookOpen, Mail, Github, Linkedin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-linear-to-br from-gray-900 via-slate-800 to-gray-900 border-t border-gray-700/50 mt-auto relative overflow-hidden">
      {/* Dekoratívne pozadie */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDE0YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02ek0yNCAzOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>

      <div className="container-custom py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* O aplikácii */}
          <div className="space-y-5">
            <div className="flex items-center space-x-3">
              <div className="bg-linear-to-br from-blue-500 via-blue-600 to-cyan-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl bg-linear-to-r from-white to-blue-100 bg-clip-text text-transparent">Študijný Asistent</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Inteligentný pomocník pre efektívne štúdium s podporou AI.
              Automatizuj zápis prednášok a prípravu na skúšky.
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Aktívne a pripravené pomôcť</span>
            </div>
          </div>

          {/* Funkcie */}
          <div>
            <h4 className="font-semibold text-white mb-5 text-lg">Funkcie</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/prednasky"
                  className="text-gray-300 hover:text-blue-400 text-sm transition-all duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3 group-hover:scale-150 group-hover:bg-blue-400 transition-all duration-200"></span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">Zápis prednášok</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/materialy"
                  className="text-gray-300 hover:text-blue-400 text-sm transition-all duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3 group-hover:scale-150 group-hover:bg-blue-400 transition-all duration-200"></span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">Spracovanie materiálov</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/testy"
                  className="text-gray-300 hover:text-blue-400 text-sm transition-all duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3 group-hover:scale-150 group-hover:bg-blue-400 transition-all duration-200"></span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">Generovanie testov</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Podpora */}
          <div>
            <h4 className="font-semibold text-white mb-5 text-lg">Podpora</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/help"
                  className="text-gray-300 hover:text-blue-400 text-sm transition-all duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3 group-hover:scale-150 group-hover:bg-blue-400 transition-all duration-200"></span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">Nápoveda</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-blue-400 text-sm transition-all duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3 group-hover:scale-150 group-hover:bg-blue-400 transition-all duration-200"></span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">Kontakt</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-gray-300 hover:text-blue-400 text-sm transition-all duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3 group-hover:scale-150 group-hover:bg-blue-400 transition-all duration-200"></span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">FAQ</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dokumentacia"
                  className="text-gray-300 hover:text-blue-400 text-sm transition-all duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3 group-hover:scale-150 group-hover:bg-blue-400 transition-all duration-200"></span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">Dokumentácia</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Právne a sociálne */}
          <div>
            <h4 className="font-semibold text-white mb-5 text-lg">Právne</h4>
            <ul className="space-y-3 mb-8">
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-300 hover:text-blue-400 text-sm transition-all duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3 group-hover:scale-150 group-hover:bg-blue-400 transition-all duration-200"></span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">Ochrana súkromia</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-300 hover:text-blue-400 text-sm transition-all duration-200 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3 group-hover:scale-150 group-hover:bg-blue-400 transition-all duration-200"></span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">Podmienky používania</span>
                </Link>
              </li>
            </ul>

            {/* Sociálne siete */}
            <div>
              <h5 className="font-semibold text-white mb-4 text-sm">
                Sleduj nás
              </h5>
              <div className="flex space-x-3">
                <a
                  href="mailto:info@studijny-asistent.sk"
                  className="w-10 h-10 bg-gray-700/50 hover:bg-linear-to-br hover:from-blue-600 hover:to-cyan-600 text-gray-300 hover:text-white rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30"
                  aria-label="Email"
                >
                  <Mail className="w-5 h-5" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-700/50 hover:bg-linear-to-br hover:from-blue-600 hover:to-cyan-600 text-gray-300 hover:text-white rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30"
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-700/50 hover:bg-linear-to-br hover:from-blue-600 hover:to-cyan-600 text-gray-300 hover:text-white rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright - spodná časť */}
        <div className="border-t border-gray-700/30 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {currentYear} Študijný Asistent. Všetky práva vyhradené.
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 text-xs">Vytvorené s</span>
              <span className="text-red-500 animate-pulse text-sm">❤️</span>
              <span className="text-gray-500 text-xs">pre študentov</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
