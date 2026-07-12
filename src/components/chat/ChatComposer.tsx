"use client";

import { useRef, useState } from "react";
import EmojiPicker from "./EmojiPicker";
import MediaRecorderButton from "./MediaRecorderButton";

/**
 * Telegram uslubidagi xabar yozish paneli.
 *
 * Joylashuv (chapdan o'ngga):
 *   [😊 emoji] [📎 fayl] [ ....auto-resize textarea.... ] [ 🎤/📷 yoki ➤ ]
 *
 * - Chap: emoji tanlagich + fayl biriktirish (skrepka).
 * - O'rta: yozgan sari bo'yi o'sadigan textarea (auto-resize, maks ~6 qator).
 * - O'ng: matn bo'lsa — ko'k "Yuborish" tugmasi; matn bo'sh bo'lsa — ovozli/
 *   video xabar tugmasi (MediaRecorderButton).
 */
export default function ChatComposer({
  onSendText,
  onPickMedia,
  onSendRecording,
}: {
  onSendText: (text: string) => Promise<void> | void;
  onPickMedia: (file: File) => Promise<void> | void;
  onSendRecording: (content: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const MAX_H = 140; // ~6 qator

  function autoResize() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, MAX_H) + "px";
  }

  function resetHeight() {
    if (taRef.current) taRef.current.style.height = "auto";
  }

  async function submit() {
    const t = text.trim();
    if (!t) return;
    setText("");
    requestAnimationFrame(resetHeight);
    await onSendText(t);
  }

  function insertEmoji(emoji: string) {
    const ta = taRef.current;
    if (!ta) {
      setText((x) => x + emoji);
      return;
    }
    const start = ta.selectionStart ?? text.length;
    const end = ta.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
      autoResize();
    });
  }

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setUploading(true);
    try {
      await onPickMedia(f);
    } finally {
      setUploading(false);
    }
  }

  const hasText = text.trim().length > 0;

  return (
    <div className="flex items-end gap-1.5 border-t border-gray-100 bg-white p-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] md:pb-2.5">
      {/* Emoji */}
      <EmojiPicker onSelect={insertEmoji} />

      {/* Fayl biriktirish (skrepka) */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
        aria-label="Fayl biriktirish"
        title="Rasm yoki video biriktirish"
      >
        {uploading ? (
          <span className="text-sm">⏳</span>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <path
              d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        onChange={pickFile}
        className="hidden"
      />

      {/* Auto-resize textarea */}
      <textarea
        ref={taRef}
        rows={1}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          autoResize();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Xabar yozing..."
        className="max-h-[140px] min-h-[44px] flex-1 resize-none rounded-2xl bg-gray-100 px-4 py-2.5 text-sm leading-5 text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-brand/30"
      />

      {/* O'ng: matn bo'lsa Yuborish, aks holda ovozli/video xabar tugmasi */}
      {hasText ? (
        <button
          type="button"
          onClick={submit}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm transition hover:bg-brand-600"
          aria-label="Yuborish"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.993.993 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
          </svg>
        </button>
      ) : (
        <MediaRecorderButton onSend={onSendRecording} />
      )}
    </div>
  );
}
