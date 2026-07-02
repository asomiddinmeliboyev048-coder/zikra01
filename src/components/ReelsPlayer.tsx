"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { avatarFallback, timeAgo } from "@/lib/utils";
import { likeReelAction, unlikeReelAction } from "@/app/actions/reels";
import type { Reel } from "@/lib/types";

interface ReelsPlayerProps {
  reels: Reel[];
  initialIndex?: number;
}

/**
 * Instagram uslubidagi Reels pleyer — to'liq ekranli vertikal (9:16) videolar.
 *
 * Ovoz siyosati (autoplay policy) bilan ishlash:
 *   1) Video ovoz bilan (unmuted) avtomatik ijro etilishga urinadi.
 *   2) Agar brauzer buni bloklasa (NotAllowedError), video OVOZSIZ ijro
 *      etiladi va foydalanuvchiga "ovozni yoqish uchun bosing" ko'rsatkichi
 *      chiqadi. Foydalanuvchi bosishi bilan ovoz yoqiladi.
 */
export default function ReelsPlayer({ reels, initialIndex = 0 }: ReelsPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [muted, setMuted] = useState(false); // Boshlang'ich holat: ovoz yoqilgan
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());

  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartY = useRef(0);

  const currentReel = reels[currentIndex];

  /**
   * Joriy videoni ijro etadi. Avval ovoz bilan urinadi; brauzer bloklasa,
   * ovozsiz rejimga o'tib qayta urinadi va "tap to unmute" ko'rsatkichini yoqadi.
   */
  const playCurrent = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.muted = muted;

    try {
      await video.play();
      if (!muted) setAutoplayBlocked(false);
    } catch {
      // Brauzer ovozli avtomatik ijroni bloklagan bo'lishi mumkin.
      // Ovozsiz rejimga o'tib qayta urinamiz (bu deyarli har doim ishlaydi).
      if (!muted) {
        video.muted = true;
        setMuted(true);
        setAutoplayBlocked(true);
        try {
          await video.play();
        } catch {
          // Ovozsiz ham ijro bo'lmasa — foydalanuvchi qo'lda boshqaradi.
        }
      }
    }
  }, [muted]);

  // Video yoki ovoz holati o'zgarganda joriy videoni ijro et.
  // Har bir reel <video key> orqali alohida mount bo'ladi, shuning uchun
  // eski video avtomatik to'xtaydi (qo'lda pauza qilish shart emas).
  useEffect(() => {
    playCurrent();
  }, [currentIndex, playCurrent]);

  // Ovoz holatini almashtirish (foydalanuvchi qo'lda bosganda)
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    const next = !muted;
    setMuted(next);
    setAutoplayBlocked(false);
    if (video) {
      video.muted = next;
      // Foydalanuvchi ovozni yoqsa va video pauzada bo'lsa — ijro etamiz
      if (!next && video.paused) {
        video.play().catch(() => {
          /* foydalanuvchi harakati bo'lgani uchun bu kamdan-kam yuz beradi */
        });
      }
    }
  }, [muted]);

  // Like/unlike — optimistik yangilash + server action
  const toggleLike = useCallback(
    async (reelId: string) => {
      if (pending.has(reelId)) return;

      const reel = reels.find((r) => r.id === reelId);
      if (!reel) return;

      const wasLiked = liked.has(reelId) || Boolean(reel.liked);

      setLiked((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(reelId);
        else next.add(reelId);
        return next;
      });
      setPending((prev) => new Set(prev).add(reelId));

      try {
        const res = wasLiked
          ? await unlikeReelAction(reelId)
          : await likeReelAction(reelId);

        // Server xatosi bo'lsa — optimistik o'zgarishni orqaga qaytaramiz
        if (res?.error) {
          setLiked((prev) => {
            const next = new Set(prev);
            if (wasLiked) next.add(reelId);
            else next.delete(reelId);
            return next;
          });
        }
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(reelId);
          return next;
        });
      }
    },
    [reels, liked, pending]
  );

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < reels.length - 1 ? prev + 1 : prev));
  }, [reels.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Touch swipe navigatsiya (mobil)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (diff > 50) goNext();
    else if (diff < -50) goPrev();
  };

  // Klaviatura navigatsiya (desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") goPrev();
      else if (e.key === "ArrowDown") goNext();
      else if (e.key === "m" || e.key === "M") toggleMute();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goPrev, goNext, toggleMute]);

  if (reels.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <p className="text-lg">Hali reels mavjud emas</p>
      </div>
    );
  }

  const isLiked = liked.has(currentReel.id) || Boolean(currentReel.liked);
  const likeCount =
    (currentReel.likes ?? 0) +
    (liked.has(currentReel.id) && !currentReel.liked ? 1 : 0) -
    (!liked.has(currentReel.id) && currentReel.liked ? 1 : 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative mx-auto h-full w-full max-w-[500px]">
        {/* Joriy video — bosilganda ovozni almashtiradi */}
        <video
          key={currentReel.id}
          ref={videoRef}
          src={currentReel.video_url}
          loop
          playsInline
          muted={muted}
          onClick={toggleMute}
          className="h-full w-full cursor-pointer object-contain"
          style={{ aspectRatio: "9/16" }}
        />

        {/* Autoplay bloklangan — "ovozni yoqish uchun bosing" ko'rsatkichi */}
        {autoplayBlocked && muted && (
          <button
            onClick={toggleMute}
            className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-black/70 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/80"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 9l-6 6M16 9l6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Ovozni yoqish uchun bosing
          </button>
        )}

        {/* Yopish tugmasi (tepa chap) */}
        <Link
          href="/discovery"
          className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
          aria-label="Yopish"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </Link>

        {/* Ovoz tugmasi (tepa o'ng) */}
        <button
          onClick={toggleMute}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
          aria-label={muted ? "Ovozni yoqish" : "Ovozni o'chirish"}
        >
          {muted ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 9l-6 6M16 9l6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* O'ng tomon harakat tugmalari (Instagram uslubi) */}
        <div className="absolute bottom-24 right-3 z-10 flex flex-col items-center gap-5">
          {/* Like */}
          <button
            onClick={() => toggleLike(currentReel.id)}
            className="flex flex-col items-center gap-1"
            aria-label="Yoqtirish"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 transition hover:scale-110 active:scale-95">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill={isLiked ? "#ef4444" : "none"}
                stroke={isLiked ? "#ef4444" : "white"}
                strokeWidth="2"
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-xs font-semibold text-white drop-shadow">
              {likeCount}
            </span>
          </button>

          {/* Izoh (placeholder) */}
          <button className="flex flex-col items-center gap-1" aria-label="Izohlar">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 transition hover:scale-110">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path
                  d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>

          {/* Ulashish (placeholder) */}
          <button className="flex flex-col items-center gap-1" aria-label="Ulashish">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 transition hover:scale-110">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>

          {/* Muallif avatar (profilga link) */}
          {currentReel.user && (
            <Link href={`/profile/${currentReel.user.id}`} className="mt-1">
              <Image
                src={currentReel.user.avatar_url || avatarFallback(currentReel.user.full_name)}
                alt={currentReel.user.full_name}
                width={44}
                height={44}
                className="h-11 w-11 rounded-full border-2 border-white object-cover"
                unoptimized
              />
            </Link>
          )}
        </div>

        {/* Pastki ma'lumot — muallif va tavsif */}
        <div className="absolute bottom-6 left-4 right-20 z-10 text-white">
          {currentReel.user && (
            <Link
              href={`/profile/${currentReel.user.id}`}
              className="mb-2 flex items-center gap-2"
            >
              <Image
                src={currentReel.user.avatar_url || avatarFallback(currentReel.user.full_name)}
                alt={currentReel.user.full_name}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full border border-white object-cover"
                unoptimized
              />
              <span className="font-semibold drop-shadow-lg">
                {currentReel.user.username || currentReel.user.full_name}
              </span>
              <span className="text-xs text-gray-300">
                • {timeAgo(currentReel.created_at)}
              </span>
            </Link>
          )}
          {currentReel.description && (
            <p className="line-clamp-3 text-sm drop-shadow-lg">
              {currentReel.description}
            </p>
          )}
        </div>

        {/* Progress ko'rsatkichi (pastda markaz) */}
        <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
          {reels.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all ${
                idx === currentIndex ? "w-6 bg-white" : "w-1 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Qo'shni reels'ni oldindan yuklash (silliq o'tish uchun, ko'rinmaydi) */}
      {currentIndex > 0 && (
        <link rel="prefetch" href={reels[currentIndex - 1].video_url} as="video" />
      )}
      {currentIndex < reels.length - 1 && (
        <link rel="prefetch" href={reels[currentIndex + 1].video_url} as="video" />
      )}
    </div>
  );
}
