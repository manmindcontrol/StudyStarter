"use client";

import { useState } from "react";
import CookiePreferences from "../legal/CookiePreferences";

export default function CookieSettingsButton() {
  const [showPreferences, setShowPreferences] = useState(false);

  return (
    <div>
      <button
        onClick={() => setShowPreferences(true)}
        className="text-gray-400 hover:text-blue-400 text-sm transition-all duration-200 flex items-center group w-full text-left cursor-pointer"
      >
        <span className="transition-transform duration-200">
          Cookie Settings
        </span>
      </button>

      <CookiePreferences
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </div>
  );
}
