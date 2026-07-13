"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { likeReelAction, unlikeReelAction } from "@/app/actions/reels";
import { cn, formatCount } from "@/lib/utils";

/** Tashqi (double-tap) chaqiruvlar uchun imperativ handle */
export interface LikeButtonHandle {
  /** Faqat hali yoqtirmagan bo'lsa like bosadi (Instagram double-tap) */
  like: () => void;
  /** Joriy holat yoqtirilganmi */
  isLiked: () => boolean;
}

/**
 * Reels uchun like tugmasi — optimistik UI + Supabase Realtime.
 *
 * - Bosilganda darhol (optimistik) holat o'zgaradi va server action chaqiriladi.
 * - reel_likes jadvalidagi o'zgarishlar realtime kuzatiladi: boshqa
 *   foydalanuvchi like bosganda ham son yangilanadi (haqiqiy son qayta olinadi).
 * - `ref` orqali double-tap'dan `like()` chaqirish mumkin.
 */
const LikeButton = forwardRef<
  LikeButtonHandle,
  {
    reelId: string;
    initialLiked: boolean;
    initialCount: number;
    onLikedChange?: (liked: boolean) => void;
  }
>(function LikeButton({ reelId, initialLiked, initialCount, onLikedChange }, ref) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [burst, setBurst] = useState(false);
  const busy = useRef(false);

  // Haqiqiy like sonini bazadan qayta olish (realtime drift'ni tuzatadi)
  const refreshCount = useCallback(async () => {
    const supabase = createClient();
    const { count: c } = await supabase
      .from("reel_likes")
      .select("id", { count: "exact", head: true })
      .eq("reel_id", reelId);
    if (typeof c === "number") setCount(c);
  }, [reelId]);

  // Realtime: shu reelning like'lari o'zgarganda sonni yangilaymiz
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`reel_likes:${reelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reel_likes",
          filter: `reel_id=eq.${reelId}`,
        },
        () => refreshCount()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [reelId, refreshCount]);

  // liked qiymatiga har doim yangi ref orqali murojaat (double-tap uchun)
  const likedRef = useRef(liked);
  useEffect(() => {
    likedRef.current = liked;
  }, [liked]);

  // Ichki: berilgan yo'nalishda (like/unlike) holatni o'zgartirish
  const setLikeState = useCallback(
    async (next: boolean) => {
      if (busy.current) return;
      if (next === likedRef.current) return; // o'zgarish yo'q
      busy.current = true;

      setLiked(next);
      setCount((c) => Math.max(0, c + (next ? 1 : -1)));
      onLikedChange?.(next);
      if (next) {
        setBurst(true);
        setTimeout(() => setBurst(false), 500);
      }

      try {
        const res = next
          ? await likeReelAction(reelId)
          : await unlikeReelAction(reelId);
        if (res?.error) {
          // Orqaga qaytarish
          setLiked(!next);
          setCount((c) => Math.max(0, c + (next ? -1 : 1)));
          onLikedChange?.(!next);
        }
      } finally {
        busy.current = false;
      }
    },
    [reelId, onLikedChange]
  );

  const toggle = useCallback(() => {
    setLikeState(!likedRef.current);
  }, [setLikeState]);

  // Double-tap: faqat yoqtirish (mavjud like'ni bekor qilmaydi)
  useImperativeHandle(
    ref,
    () => ({
      like: () => setLikeState(true),
      isLiked: () => likedRef.current,
    }),
    [setLikeState]
  );

  return (
    <button
      onClick={toggle}
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
});

export default LikeButton;
