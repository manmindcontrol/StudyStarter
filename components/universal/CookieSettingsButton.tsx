"use client";

import { useState } from "react";
import { Cookie } from "lucide-react";
import CookiePreferences from "../legal/CookiePreferences";

export default function CookieSettingsButton() {
  const [showPreferences, setShowPreferences] = useState(false);

  return (
    <>
      <li>
        <button
          onClick={() => setShowPreferences(true)}
          className="text-gray-300 hover:text-blue-400 text-sm transition-all duration-200 flex items-center group w-full text-left cursor-pointer"
        >
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3 group-hover:scale-150 group-hover:bg-blue-400 transition-all duration-200"></span>
          <span className="group-hover:translate-x-1 transition-transform duration-200">
            Cookie Settings
          </span>
        </button>
      </li>

      <CookiePreferences
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </>
  );
}
