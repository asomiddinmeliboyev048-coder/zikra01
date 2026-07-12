"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { likeReelAction, unlikeReelAction } from "@/app/actions/reels";

/**
 * Reel "like" holatini boshqaruvchi hook — Optimistic UI bilan.
 *
 * ReelsPlayer bir necha joyda (yon tugma + video ustiga 2 marta bosish) bir xil
 * like holatidan foydalanadi, shuning uchun mantiq shu hook'ka ajratilgan.
 *
 * Ishlashi:
 *   - toggle(): bosishda darhol UI yangilanadi, orqa fonda server chaqiriladi,
 *     xato bo'lsa rollback.
 *   - likeIfNeeded(): faqat hali like bosilmagan bo'lsa like qo'yadi
 *     (video ustiga 2 marta bosilganda ishlatiladi — hech qachon "unlike"
 *     qilmaydi).
 *   - Reel almashganda (reelId o'zgarsa) holat yangi reel qiymatlariga tiklanadi.
 *     initialLiked/initialCount o'zgarishining o'zi holatni tiklamaydi
 *     (server revalidatsiyasi foydalanuvchi tanlovini buzmasligi uchun).
 */
export function useReelLike(
  reelId: string,
  initialLiked = false,
  initialCount = 0
) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  const reelRef = useRef(reelId);
  useEffect(() => {
    if (reelRef.current !== reelId) {
      reelRef.current = reelId;
      setLiked(initialLiked);
      setCount(initialCount);
    }
  }, [reelId, initialLiked, initialCount]);

  const toggle = useCallback(async () => {
    if (pending) return;
    const next = !liked;
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    setPending(true);
    try {
      const res = next
        ? await likeReelAction(reelId)
        : await unlikeReelAction(reelId);
      if (res?.error) {
        setLiked(!next);
        setCount((c) => Math.max(0, c + (next ? -1 : 1)));
      }
    } catch {
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
    } finally {
      setPending(false);
    }
  }, [pending, liked, reelId]);

  const likeIfNeeded = useCallback(() => {
    if (!liked && !pending) toggle();
  }, [liked, pending, toggle]);

  return { liked, count, pending, toggle, likeIfNeeded };
}

interface ReelLikeButtonProps {
  reelId: string;
  initialLiked?: boolean;
  initialCount?: number;
}

/**
 * Mustaqil "Layk" tugmasi (useReelLike hook ustida). ReelsPlayer o'z tugmasini
 * hook orqali render qilgani uchun bu komponent zaxira/qayta ishlatish uchun.
 */
export default function ReelLikeButton({
  reelId,
  initialLiked = false,
  initialCount = 0,
}: ReelLikeButtonProps) {
  const { liked, count, toggle } = useReelLike(reelId, initialLiked, initialCount);
  const [burst, setBurst] = useState(false);

  const handle = useCallback(() => {
    if (!liked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 300);
    }
    toggle();
  }, [liked, toggle]);

  return (
    <button
      onClick={handle}
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
          className={`transition-transform duration-300 ${burst ? "scale-125" : "scale-100"}`}
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
