"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * PIN kiritish ekrani — to'liq ekran overlay (Instagram/Telegram uslubi).
 * Raqamli klaviatura, nuqta indikatorlari va xatolik holatini ko'rsatadi.
 * Mantiq (hash, saqlash, timeout) — PinGate komponentida.
 */
export default function PinLock({
  title,
  subtitle,
  length,
  error,
  resetSignal,
  onComplete,
  onForgot,
  showLengthToggle = false,
  onLengthChange,
  onBiometric,
  onClose,
}: {
  title: string;
  subtitle?: string;
  length: number;
  error?: string;
  /** Bu qiymat o'zgarsa kiritilgan raqamlar tozalanadi (masalan xato PIN'dan keyin) */
  resetSignal?: number;
  onComplete: (pin: string) => void;
  onForgot?: () => void;
  showLengthToggle?: boolean;
  onLengthChange?: (len: number) => void;
  /** Biometrik tugma (Face ID / barmoq izi) — berilsa ko'rsatiladi */
  onBiometric?: () => void;
  /** Yopish/bekor qilish tugmasi (yuqori chap ✕) — berilsa ko'rsatiladi */
  onClose?: () => void;
}) {
  const [entered, setEntered] = useState("");

  // Tashqi signal kelganda yoki uzunlik o'zgarganda tozalash
  useEffect(() => {
    setEntered("");
  }, [resetSignal, length]);

  // Xatolik kelganda kiritilgan raqamlarni tozalash
  useEffect(() => {
    if (error) setEntered("");
  }, [error]);

  // To'liq kiritilganda onComplete chaqirish
  useEffect(() => {
    if (entered.length === length) {
      const pin = entered;
      // Keyingi tick'da chaqiramiz (render paytida state yangilamaslik uchun)
      const id = setTimeout(() => onComplete(pin), 120);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entered, length]);

  function press(d: string) {
    setEntered((prev) => (prev.length >= length ? prev : prev + d));
  }
  function backspace() {
    setEntered((prev) => prev.slice(0, -1));
  }

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white px-6 py-10 dark:bg-[#0e1525]">
      {/* Yopish tugmasi (ixtiyoriy) */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-2xl text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Yopish"
        >
          ✕
        </button>
      )}
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center text-center">
        <Image
          src="/zikra-logo.svg"
          alt="Zikra"
          width={72}
          height={72}
          className="mb-4 rounded-full"
          unoptimized
          priority
        />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
        {subtitle && (
          <p className="mt-1 max-w-xs text-sm text-gray-500">{subtitle}</p>
        )}
      </div>

      {/* Uzunlik tanlovi (faqat sozlashda) */}
      {showLengthToggle && onLengthChange && (
        <div className="mb-6 flex gap-2 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          {[4, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onLengthChange(n)}
              className={cn(
                "min-h-[36px] rounded-lg px-4 text-sm font-medium transition",
                length === n
                  ? "bg-white text-brand shadow-sm dark:bg-gray-700"
                  : "text-gray-500"
              )}
            >
              {n} raqam
            </button>
          ))}
        </div>
      )}

      {/* Nuqta indikatorlari */}
      <div className="mb-2 flex gap-3">
        {Array.from({ length }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-3.5 w-3.5 rounded-full border-2 transition",
              i < entered.length
                ? "border-brand bg-brand"
                : "border-gray-300 bg-transparent dark:border-gray-600"
            )}
          />
        ))}
      </div>

      {/* Xatolik */}
      <p
        className={cn(
          "mb-6 h-5 text-sm font-medium transition",
          error ? "text-accent" : "text-transparent"
        )}
      >
        {error || "."}
      </p>

      {/* Raqamli klaviatura */}
      <div className="grid w-full max-w-xs grid-cols-3 gap-3">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            className="flex min-h-[64px] touch-manipulation items-center justify-center rounded-2xl bg-gray-100 text-2xl font-semibold text-gray-900 transition active:scale-95 active:bg-gray-200 dark:bg-gray-800 dark:text-gray-100"
          >
            {k}
          </button>
        ))}
        {/* Biometrik tugma (yoki bo'sh katak) */}
        {onBiometric ? (
          <button
            type="button"
            onClick={onBiometric}
            className="flex min-h-[64px] touch-manipulation items-center justify-center rounded-2xl text-2xl text-brand transition active:scale-95"
            aria-label="Biometrik bilan ochish"
            title="Face ID / Barmoq izi"
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M12 3.5c-2 0-3.8.6-5.3 1.7" />
              <path d="M17.3 5.2A8.5 8.5 0 0 1 20.5 12" />
              <path d="M3.5 12c0-1.6.4-3.1 1.2-4.4" />
              <path d="M12 7.5a4.5 4.5 0 0 0-4.5 4.5v2" />
              <path d="M12 7.5a4.5 4.5 0 0 1 4.5 4.5v4" />
              <path d="M12 12v3.5" />
              <path d="M7.5 16.5c0 1 .2 2 .5 3" />
              <path d="M16 19.5c.3-.8.5-1.6.5-2.5" />
            </svg>
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => press("0")}
          className="flex min-h-[64px] touch-manipulation items-center justify-center rounded-2xl bg-gray-100 text-2xl font-semibold text-gray-900 transition active:scale-95 active:bg-gray-200 dark:bg-gray-800 dark:text-gray-100"
        >
          0
        </button>
        <button
          type="button"
          onClick={backspace}
          className="flex min-h-[64px] touch-manipulation items-center justify-center rounded-2xl text-2xl text-gray-500 transition active:scale-95"
          aria-label="O'chirish"
        >
          ⌫
        </button>
      </div>

      {/* PIN ni unutdim */}
      {onForgot && (
        <button
          type="button"
          onClick={onForgot}
          className="mt-8 text-sm font-medium text-brand hover:underline"
        >
          PIN ni unutdingizmi? → Parol bilan kirish
        </button>
      )}
    </div>
  );
}
