"use client";

import { useEffect, useRef, useState } from "react";
import { cn, formatCount } from "@/lib/utils";

/**
 * Reels uchun like tugmasi (prezentatsion — holatni tashqaridan oladi).
 * Like mantig'i `useReelLike` hook'ida; bu komponent faqat ko'rinish va
 * bosish hodisasini boshqaradi. Shu tufayli yon tugma va double-tap sinxron.
 */
export default function LikeButton({
  liked,
  count,
  onToggle,
}: {
  liked: boolean;
  count: number;
  onToggle: () => void;
}) {
  const [burst, setBurst] = useState(false);
  const prevLiked = useRef(liked);

  // "liked" false -> true bo'lganda yurakcha "burst" animatsiyasi
  useEffect(() => {
    if (liked && !prevLiked.current) {
      setBurst(true);
      const t = setTimeout(() => setBurst(false), 500);
      prevLiked.current = liked;
      return () => clearTimeout(t);
    }
    prevLiked.current = liked;
  }, [liked]);

  return (
    <button
      onClick={onToggle}
      className="group flex flex-col items-center gap-1"
      aria-label={liked ? "Yoqtirishni bekor qilish" : "Yoqtirish"}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/25 backdrop-blur-sm transition active:scale-90 group-hover:bg-black/40">
        <svg
          width="27"
          height="27"
          viewBox="0 0 24 24"
          fill={liked ? "#ef4444" : "none"}
          stroke={liked ? "#ef4444" : "white"}
          strokeWidth="2"
          className={cn("transition-transform", burst && "animate-scale-in")}
        >
          <path
            d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-xs font-semibold text-white drop-shadow">
        {formatCount(count)}
      </span>
    </button>
  );
}
