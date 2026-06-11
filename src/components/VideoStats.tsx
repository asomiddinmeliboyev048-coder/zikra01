"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toggleLikeAction } from "@/app/actions/social";
import { cn } from "@/lib/utils";

export default function VideoStats({
  videoId,
  initialLikes,
  initialLiked,
  initialViews,
}: {
  videoId: string;
  initialLikes: number;
  initialLiked: boolean;
  initialViews: number;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [busy, setBusy] = useState(false);

  // Real-time: like soni o'zgarsa yangilansin
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`video_likes:${videoId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "video_likes",
          filter: `video_id=eq.${videoId}`,
        },
        (payload) => {
          setLikes((c) =>
            payload.eventType === "INSERT"
              ? c + 1
              : payload.eventType === "DELETE"
              ? Math.max(0, c - 1)
              : c
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId]);

  async function toggle() {
    setBusy(true);
    const prev = liked;
    setLiked(!prev);
    setLikes((c) => (prev ? Math.max(0, c - 1) : c + 1));
    const res = await toggleLikeAction(videoId);
    setBusy(false);
    if (res.error) {
      setLiked(prev);
      setLikes((c) => (prev ? c + 1 : Math.max(0, c - 1)));
      alert(res.error);
    }
  }

  return (
    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
      <button
        onClick={toggle}
        disabled={busy}
        className={cn(
          "flex items-center gap-1 transition hover:scale-105",
          liked ? "text-red-500" : "text-gray-400 hover:text-red-400"
        )}
        aria-label="Like"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span className="font-medium">{likes}</span>
      </button>

      <span className="flex items-center gap-1">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        {initialViews} ko&apos;rish
      </span>
    </div>
  );
}
