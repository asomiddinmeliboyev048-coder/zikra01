"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { likeReelAction, unlikeReelAction } from "@/app/actions/reels";

/**
 * Reel like holatini boshqaruvchi umumiy hook (optimistik UI + Realtime).
 *
 * Bir reel uchun BITTA manba: ham yon paneldagi LikeButton, ham videoni
 * 2 marta bosish (double-tap) shu holatni ishlatadi, shuning uchun ikkalasi
 * doim sinxron bo'ladi.
 */
export function useReelLike(
  reelId: string,
  initialLiked: boolean,
  initialCount: number
) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const busy = useRef(false);
  const likedRef = useRef(initialLiked);

  // Ref'ni holat bilan sinxron ushlaymiz (double-tap closure uchun)
  useEffect(() => {
    likedRef.current = liked;
  }, [liked]);

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

  // Berilgan holatga o'tkazish (optimistik + server + xatoda orqaga qaytarish)
  const setLikeState = useCallback(
    async (next: boolean) => {
      if (busy.current) return;
      if (next === likedRef.current) return; // o'zgarish yo'q
      busy.current = true;

      setLiked(next);
      likedRef.current = next;
      setCount((c) => Math.max(0, c + (next ? 1 : -1)));

      try {
        const res = next
          ? await likeReelAction(reelId)
          : await unlikeReelAction(reelId);
        if (res?.error) {
          setLiked(!next);
          likedRef.current = !next;
          setCount((c) => Math.max(0, c + (next ? -1 : 1)));
        }
      } finally {
        busy.current = false;
      }
    },
    [reelId]
  );

  // Yon paneldagi tugma uchun: bosilganda holatni almashtiradi
  const toggle = useCallback(() => {
    setLikeState(!likedRef.current);
  }, [setLikeState]);

  // Double-tap uchun: FAQAT like qo'yadi (Instagram kabi — hech qachon olib tashlamaydi)
  const likeOnly = useCallback(() => {
    if (!likedRef.current) setLikeState(true);
  }, [setLikeState]);

  return { liked, count, toggle, likeOnly };
}
