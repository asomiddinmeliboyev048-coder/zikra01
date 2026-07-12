"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { avatarFallback, formatCount, timeAgo } from "@/lib/utils";
import { recordReelViewAction } from "@/app/actions/reels";
import { toggleFollowAction } from "@/app/actions/social";
import type { Reel } from "@/lib/types";
import LikeButton from "./LikeButton";
import CommentSheet from "./CommentSheet";
import ShareSheet from "./ShareSheet";
import { useReelLike } from "./useReelLike";

interface Props {
  reel: Reel;
  me: { id: string; full_name: string; avatar_url: string | null } | null;
  muted: boolean;
  onToggleMute: () => void;
}

const VIEW_THRESHOLD_MS = 2000; // 2 soniya ko'rilsa — ko'rish hisoblanadi

/**
 * Bitta to'liq ekranli reel — Instagram/TikTok uslubida.
 * IntersectionObserver orqali faqat ekranda ko'rinayotgan video ijro etiladi.
 */
export default function ReelCard({ reel, me, muted, onToggleMute }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewCounted = useRef(false);

  const [paused, setPaused] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [commentCount, setCommentCount] = useState(reel.comments ?? 0);

  // Like holati (yon tugma + double-tap uchun umumiy)
  const { liked, count: likeCount, toggle: toggleLike, likeOnly } = useReelLike(
    reel.id,
    Boolean(reel.liked),
    reel.likes ?? 0
  );

  // Double-tap "katta yurakcha" animatsiyasi
  const [heart, setHeart] = useState(0); // 0 = ko'rinmaydi, aks holda animatsiya kaliti
  const lastTap = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOwner = me?.id === reel.user_id;
  const [following, setFollowing] = useState(Boolean(reel.following));
  const [followBusy, setFollowBusy] = useState(false);

  // Ovoz holatini video elementga qo'llash
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // Ekranda ko'rinishni kuzatish -> play/pause + ko'rishni qayd etish
  useEffect(() => {
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          video.muted = muted;
          video.play().then(() => setPaused(false)).catch(() => {
            // Ovozli avtoplay bloklansa — ovozsiz urinib ko'ramiz
            video.muted = true;
            video.play().catch(() => setPaused(true));
          });

          // Ko'rishni qayd etish (2 soniyadan keyin, faqat bir marta)
          if (!viewCounted.current) {
            viewTimer.current = setTimeout(() => {
              viewCounted.current = true;
              recordReelViewAction(reel.id);
            }, VIEW_THRESHOLD_MS);
          }
        } else {
          video.pause();
          video.currentTime = 0;
          if (viewTimer.current) {
            clearTimeout(viewTimer.current);
            viewTimer.current = null;
          }
        }
      },
      { threshold: [0, 0.6, 1] }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (viewTimer.current) clearTimeout(viewTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reel.id]);

  // Videoni bosganda play/pause
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setPaused(false)).catch(() => {});
    } else {
      video.pause();
      setPaused(true);
    }
  }, []);

  // Katta markaziy yurakcha animatsiyasini ko'rsatish
  const triggerHeart = useCallback(() => {
    setHeart((k) => k + 1);
    if (heartTimer.current) clearTimeout(heartTimer.current);
    heartTimer.current = setTimeout(() => setHeart(0), 800);
  }, []);

  // Bir marta bosish = play/pause, 2 marta tez bosish = like (Instagram uslubi)
  const handleVideoTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // DOUBLE TAP — pending play/pause'ni bekor qilamiz
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }
      lastTap.current = 0;
      likeOnly(); // faqat like qo'yadi (agar bosilmagan bo'lsa)
      triggerHeart(); // yurakcha har doim chiqadi
    } else {
      // Birinchi bosish — 300ms kutamiz (ikkinchisi kelmasa play/pause)
      lastTap.current = now;
      singleTapTimer.current = setTimeout(() => {
        togglePlay();
        singleTapTimer.current = null;
      }, 300);
    }
  }, [likeOnly, togglePlay, triggerHeart]);

  // Tozalash
  useEffect(() => {
    return () => {
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
      if (heartTimer.current) clearTimeout(heartTimer.current);
    };
  }, []);

  const toggleFollow = useCallback(async () => {
    if (followBusy || isOwner) return;
    setFollowBusy(true);
    const prev = following;
    setFollowing(!prev);
    const res = await toggleFollowAction(reel.user_id);
    if (res.error) {
      setFollowing(prev);
    } else if (typeof res.following === "boolean") {
      setFollowing(res.following);
    }
    setFollowBusy(false);
  }, [followBusy, isOwner, following, reel.user_id]);

  const author = reel.user;
  const authorName = author?.username ? `@${author.username}` : author?.full_name ?? "Foydalanuvchi";

  return (
    <section
      ref={containerRef}
      className="relative flex h-[100dvh] w-full snap-start snap-always items-center justify-center bg-black"
    >
      <div className="relative h-full w-full max-w-[480px]">
        {/* VIDEO */}
        <video
          ref={videoRef}
          src={reel.video_url}
          loop
          playsInline
          muted={muted}
          preload="metadata"
          onClick={handleVideoTap}
          className="h-full w-full cursor-pointer bg-black object-contain"
        />

        {/* Double-tap katta yurakcha animatsiyasi */}
        {heart > 0 && (
          <div
            key={heart}
            className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
          >
            <svg
              width="120"
              height="120"
              viewBox="0 0 24 24"
              fill="#ef4444"
              className="animate-reel-heart drop-shadow-2xl"
            >
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </div>
        )}

        {/* Pauza ko'rsatkichi */}
        {paused && (
          <button
            onClick={togglePlay}
            className="absolute left-1/2 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
            aria-label="Ijro etish"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}

        {/* Yuqori panel: yopish + ovoz */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent p-4">
          <Link
            href="/discovery"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50"
            aria-label="Yopish"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </Link>
          <span className="rounded-full bg-black/30 px-3 py-1 text-sm font-semibold text-white backdrop-blur">
            Reels
          </span>
          <button
            onClick={onToggleMute}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50"
            aria-label={muted ? "Ovozni yoqish" : "Ovozni o'chirish"}
          >
            {muted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 9l-6 6M16 9l6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        {/* O'ng harakat paneli */}
        <div className="absolute bottom-28 right-2.5 z-20 flex flex-col items-center gap-5">
          <LikeButton liked={liked} count={likeCount} onToggle={toggleLike} />

          {/* Izohlar */}
          <button
            onClick={() => setShowComments(true)}
            className="group flex flex-col items-center gap-1"
            aria-label="Izohlar"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/25 backdrop-blur-sm transition active:scale-90 group-hover:bg-black/40">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-xs font-semibold text-white drop-shadow">
              {formatCount(commentCount)}
            </span>
          </button>

          {/* Ulashish */}
          <button
            onClick={() => setShowShare(true)}
            className="group flex flex-col items-center gap-1"
            aria-label="Ulashish"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/25 backdrop-blur-sm transition active:scale-90 group-hover:bg-black/40">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-xs font-semibold text-white drop-shadow">Yuborish</span>
          </button>

          {/* Ko'rishlar soni — faqat reel egasiga */}
          {isOwner && (
            <div className="flex flex-col items-center gap-1">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/25 backdrop-blur-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </span>
              <span className="text-xs font-semibold text-white drop-shadow">
                {formatCount(reel.views ?? 0)}
              </span>
            </div>
          )}
        </div>

        {/* Pastki chap: muallif + obuna + tavsif */}
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-4 pb-8 pt-16">
          <div className="flex items-center gap-2 pr-16">
            <Link href={`/profile/${reel.user_id}`} className="shrink-0">
              <Image
                src={author?.avatar_url || avatarFallback(author?.full_name ?? "Z")}
                alt={author?.full_name ?? ""}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-white object-cover"
                unoptimized
              />
            </Link>
            <Link
              href={`/profile/${reel.user_id}`}
              className="truncate font-semibold text-white drop-shadow hover:underline"
            >
              {authorName}
            </Link>
            {!isOwner && me && (
              <button
                onClick={toggleFollow}
                disabled={followBusy}
                className={
                  following
                    ? "shrink-0 rounded-full border border-white/70 px-3 py-1 text-xs font-semibold text-white transition disabled:opacity-60"
                    : "shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-900 transition hover:bg-white/90 disabled:opacity-60"
                }
              >
                {following ? "Obuna bo'lingan" : "Obuna bo'lish"}
              </button>
            )}
            <span className="shrink-0 text-xs text-gray-300 drop-shadow">
              • {timeAgo(reel.created_at)}
            </span>
          </div>
          {reel.description && (
            <p className="mt-2 line-clamp-3 pr-16 text-sm text-white/95 drop-shadow">
              {reel.description}
            </p>
          )}
        </div>

        {/* Izohlar paneli */}
        {showComments && (
          <CommentSheet
            reelId={reel.id}
            me={me}
            onClose={() => setShowComments(false)}
            onCountChange={setCommentCount}
          />
        )}

        {/* Ulashish paneli */}
        {showShare && <ShareSheet reelId={reel.id} onClose={() => setShowShare(false)} />}
      </div>
    </section>
  );
}
