"use client";

import { useState } from "react";

/**
 * Yengil emoji tanlagich — tashqi kutubxonasiz.
 * Smaylik tugmasini bosganda emoji panelchasi ochiladi; emoji tanlanganda
 * `onSelect(emoji)` chaqiriladi (matn maydoniga qo'shish uchun).
 */

const EMOJIS = [
  "😀","😁","😂","🤣","😊","😍","😘","😎","🤩","🥰",
  "😉","🙂","🤔","🤗","😐","😴","😢","😭","😡","🥺",
  "👍","👎","👏","🙏","💪","🤝","👋","🙌","✌️","🤞",
  "❤️","🧡","💛","💚","💙","💜","🔥","✨","🎉","💯",
  "😅","😇","🥳","😜","🤪","😌","😔","😳","🤯","😱",
  "🎓","📚","💡","⭐","✅","❌","⚡","🚀","🎯","🏆",
];

export default function EmojiPicker({
  onSelect,
}: {
  onSelect: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Emoji"
        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <>
          {/* Tashqariga bosilganda yopish */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute bottom-12 left-0 z-40 w-72 rounded-2xl border border-gray-100 bg-white p-2 shadow-card-hover">
            <div className="grid max-h-56 grid-cols-8 gap-0.5 overflow-y-auto">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    onSelect(e);
                    // panel ochiq qoladi — ketma-ket bir necha emoji tanlash uchun
                  }}
                  className="rounded-lg p-1.5 text-xl transition hover:bg-gray-100"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
