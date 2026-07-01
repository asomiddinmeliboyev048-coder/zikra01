"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toggleReelLikeAction, recordReelViewAction } from "@/app/actions/reels";

export interface ReelView {
  id: string;
  user_id: string;
  video_url: string;
  description: string | null;
  created_at: string;
  uploader: { id: string; full_name: string | null; avatar_url: string | null } | null;
  likeCount: number;
  viewCount: number;
  likedByMe: boolean;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

/**
 * TikTok uslubidagi to'liq ekranli, vertikal "snap" viewer.
 * - Ko'rinishga kelgan reel avtomatik ijro etiladi (IntersectionObserver).
 * - Ko'rilganda 1 marta view yoziladi.
 * - Like tugmasi optimistik yangilanadi.
 */
export default function ReelsViewer({ reels }: { reels: ReelView[] }) {
  if (reels.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-black text-center text-white">
        <span className="text-5xl">🎞️</span>
        <p className="text-lg font-medium">Hali reel yo&apos;q</p>
        <Link href="/videos" className="text-sm text-brand-300 underline">
          Video darslarga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen snap-y snap-mandatory overflow-y-scroll bg-black">
      {reels.map((reel) => (
        <ReelSlide key={reel.id} reel={reel} />
      ))}
    </div>
  );
}

function ReelSlide({ reel }: { reel: ReelView }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewRecorded = useRef(false);

  const [liked, setLiked] = useState(reel.likedByMe);
  const [likes, setLikes] = useState(reel.likeCount);
  const [busy, setBusy] = useState(false);

  // Ko'rinishga kelganda ijro + view yozish; chiqib ketganda to'xtatish
  useEffect(() => {
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          video.play().catch(() => {
            /* autoplay bloklansa — jim ijro allaqachon muted */
          });
          if (!viewRecorded.current) {
            viewRecorded.current = true;
            void recordReelViewAction(reel.id);
          }
        } else {
          video.pause();
        }
      },
      { threshold: [0, 0.6, 1] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reel.id]);

  const toggleLike = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    // Optimistik
    const next = !liked;
    setLiked(next);
    setLikes((c) => c + (next ? 1 : -1));

    const res = await toggleReelLikeAction(reel.id);
    if (res.error || typeof res.liked !== "boolean") {
      // Qaytarib olamiz
      setLiked(!next);
      setLikes((c) => c + (next ? -1 : 1));
    } else if (res.liked !== next) {
      setLiked(res.liked);
    }
    setBusy(false);
  }, [busy, liked, reel.id]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen snap-start items-center justify-center bg-black"
    >
      <video
        ref={videoRef}
        src={reel.video_url}
        loop
        muted
        playsInline
        preload="metadata"
        onClick={(e) => {
          const v = e.currentTarget;
          if (v.paused) {
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        }}
        className="h-full w-full object-contain sm:max-w-md"
      />

      {/* Yuqori chap — orqaga */}
      <Link
        href="/videos"
        className="absolute left-4 top-4 z-10 rounded-full bg-white/15 px-3 py-1.5 text-sm text-white backdrop-blur hover:bg-white/25"
      >
        ← Videolar
      </Link>

      {/* Pastki ma'lumot */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-4 pb-8 sm:mx-auto sm:max-w-md">
        <Link
          href={`/profile/${reel.user_id}`}
          className="text-sm font-semibold text-white hover:underline"
        >
          @{reel.uploader?.full_name ?? "foydalanuvchi"}
        </Link>
        {reel.description && (
          <p className="mt-1 line-clamp-3 text-sm text-white/90">
            {reel.description}
          </p>
        )}
        <p className="mt-1 text-xs text-white/60">
          {formatCount(reel.viewCount)} ko&apos;rish
        </p>
      </div>

      {/* O'ng tomon — amallar */}
      <div className="absolute bottom-24 right-4 z-10 flex flex-col items-center gap-4">
        <button
          onClick={toggleLike}
          disabled={busy}
          className="flex flex-col items-center gap-1 disabled:opacity-60"
          aria-pressed={liked}
        >
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl backdrop-blur transition ${
              liked ? "bg-accent-500/80" : "bg-white/15 hover:bg-white/25"
            }`}
          >
            {liked ? "❤️" : "🤍"}
          </span>
          <span className="text-xs font-medium text-white">
            {formatCount(likes)}
          </span>
        </button>
      </div>
    </div>
  );
}
