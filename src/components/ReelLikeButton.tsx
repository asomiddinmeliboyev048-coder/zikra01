"use client";

import { useState, useCallback, useEffect } from "react";
import { likeReelAction, unlikeReelAction } from "@/app/actions/reels";

interface ReelLikeButtonProps {
  reelId: string;
  /** Server'dan kelgan boshlang'ich holat (joriy foydalanuvchi like bosganmi) */
  initialLiked?: boolean;
  /** Server'dan kelgan boshlang'ich like soni */
  initialCount?: number;
}

/**
 * Reel uchun mustaqil "Layk" tugmasi — Optimistic UI bilan.
 *
 * Ishlash mantig'i:
 *   1) Foydalanuvchi bosishi bilan DARHOL ikonka qizil bo'ladi va son o'zgaradi
 *      (server javobini kutmaymiz).
 *   2) Orqa fonda server action chaqiriladi: like yo'q bo'lsa insert, bor bo'lsa
 *      delete (mantiq server tomonida `reel_likes` jadvalida bajariladi).
 *   3) Server xato qaytarsa — optimistik o'zgarish orqaga qaytariladi (rollback).
 */
export default function ReelLikeButton({
  reelId,
  initialLiked = false,
  initialCount = 0,
}: ReelLikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  // "Pop" animatsiyasi uchun (yurakcha bosilganda bir marta kattalashadi)
  const [burst, setBurst] = useState(false);

  // Reel almashsa (ReelsPlayer'da boshqa reelga o'tilsa), holatni sinxronlaymiz
  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
  }, [reelId, initialLiked, initialCount]);

  const toggle = useCallback(async () => {
    if (pending) return;

    const nextLiked = !liked;

    // 1) OPTIMISTIC: darhol UI'ni yangilaymiz
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    setPending(true);
    if (nextLiked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 300);
    }

    // 2) Orqa fonda serverga so'rov
    try {
      const res = nextLiked
        ? await likeReelAction(reelId)
        : await unlikeReelAction(reelId);

      // 3) Xato bo'lsa — ROLLBACK
      if (res?.error) {
        setLiked(!nextLiked);
        setCount((c) => c + (nextLiked ? -1 : 1));
      }
    } catch {
      setLiked(!nextLiked);
      setCount((c) => c + (nextLiked ? -1 : 1));
    } finally {
      setPending(false);
    }
  }, [pending, liked, reelId]);

  return (
    <button
      onClick={toggle}
      className="flex flex-col items-center gap-1"
      aria-label={liked ? "Yoqtirishni bekor qilish" : "Yoqtirish"}
      aria-pressed={liked}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 transition hover:scale-110 active:scale-95">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill={liked ? "#ef4444" : "none"}
          stroke={liked ? "#ef4444" : "white"}
          strokeWidth="2"
          className={`transition-transform duration-300 ${
            burst ? "scale-125" : "scale-100"
          }`}
        >
          <path
            d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-xs font-semibold text-white drop-shadow">
        {Math.max(0, count)}
      </span>
    </button>
  );
}
