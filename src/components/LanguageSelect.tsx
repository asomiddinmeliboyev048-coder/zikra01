"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

const valid: Locale[] = ["uz", "en", "ru"];

export default function LanguageSelect() {
  const [locale, setLocale] = useState<Locale>("uz");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("zikra-locale");
      if (saved && valid.includes(saved as Locale)) setLocale(saved as Locale);
    } catch {}
  }, []);

  function change(next: string) {
    if (!valid.includes(next as Locale)) return;
    const value = next as Locale;
    setLocale(value);
    try { localStorage.setItem("zikra-locale", value); } catch {}
    document.documentElement.lang = value;
    window.dispatchEvent(new CustomEvent("zikra-locale-change", { detail: value }));
  }

  return (
    <select
      aria-label="Dastur tili"
      value={locale}
      onChange={(event) => change(event.target.value)}
      className="rounded-xl border border-gray-200 bg-white/85 px-3 py-2 text-xs font-bold text-gray-700 shadow-sm backdrop-blur dark:border-white/15 dark:bg-[#102824] dark:text-gray-100"
    >
      <option value="uz">🇺🇿 UZ</option>
      <option value="en">🇬🇧 EN</option>
      <option value="ru">🇷🇺 RU</option>
    </select>
  );
}
