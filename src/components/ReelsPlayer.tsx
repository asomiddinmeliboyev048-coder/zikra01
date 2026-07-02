"use client";

import { useState, useRef, useEffect } from "react";
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
 * Instagram uslubidagi Reels pleyer — to'liq ekranli vertikal videolar,
 * avtomatik ijro (ovoz bilan), yuqoriga/pastga swipe orqali navgatsiya.
 */
export default function ReelsPlayer({ reels, initialIndex = 0 }: ReelsPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [muted, setMuted] = useState(false); // Boshlang'ich: ovoz yoqilgan
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  const currentReel = reels[currentIndex];

  // Video o'zgarganda — joriy videoni avtomatik ijro qil
  useEffect(() => {
    const video = videoRefs.current.get(currentIndex);
    if (video) {
      video.currentTime = 0;
      video.muted = muted;
      // Avtomatik ijro (ovoz bilan agar muted=false)
      video.play().catch((err) => {
        console.log("Autoplay xatolik (brauzer bloklagan bo'lishi mumkin):", err);
      });
    }

    // Oldingi va keyingi videolarni to'xtatish
    videoRefs.current.forEach((v, idx) => {
      if (idx !== currentIndex) {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [currentIndex, muted]);

  // Ovoz holatini o'zgartirish
  const toggleMute = () => {
    setMuted((prev) => !prev);
    const video = videoRefs.current.get(currentIndex);
    if (video) {
      video.muted = !muted;
    }
  };

  // Like toggle (client-side optimistic update + server action)
  const toggleLike = async (reelId: string) => {
    const currentReel = reels.find((r) => r.id === reelId);
    if (!currentReel) return;

    const wasLiked = liked.has(reelId) || currentReel.liked;
    const newLiked = new Set(liked);
    
    if (wasLiked) {
      newLiked.delete(reelId);
      // Optimistic UI update
      setLiked(newLiked);
      // Backend unlike action
      await unlikeReelAction(reelId);
    } else {
      newLiked.add(reelId);
      // Optimistic UI update
      setLiked(newLiked);
      // Backend like action
      await likeReelAction(reelId);
    }
  };

  // Touch swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    // Swipe up (keyingi reel) — 50px dan ko'proq
    if (diff > 50 && currentIndex < reels.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
    // Swipe down (oldingi reel) — -50px dan kam
    else if (diff < -50 && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Klaviatura navigatsiya (desktop uchun)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else if (e.key === "ArrowDown" && currentIndex < reels.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, reels.length]);

  if (reels.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <p className="text-lg">Hali reels mavjud emas</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Joriy video */}
      <div className="relative h-full w-full">
        <video
          ref={(el) => {
            if (el) videoRefs.current.set(currentIndex, el);
          }}
          src={currentReel.video_url}
          loop
          playsInline
          muted={muted}
          className="h-full w-full object-contain"
          style={{ aspectRatio: "9/16" }}
        />

        {/* Yopish tugmasi (tepadagi chap burchak) */}
        <Link
          href="/discovery"
          className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </Link>

        {/* Ovozni yoqish/o'chirish tugmasi (tepadagi o'ng burchak) */}
        <button
          onClick={toggleMute}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
        >
          {muted ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* O'ng tomon action tugmalari (Instagram style) */}
        <div className="absolute bottom-20 right-4 z-10 flex flex-col items-center gap-6">
          {/* Like */}
          <button
            onClick={() => toggleLike(currentReel.id)}
            className="flex flex-col items-center gap-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 transition hover:scale-110">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill={liked.has(currentReel.id) || currentReel.liked ? "red" : "none"}
                stroke={liked.has(currentReel.id) || currentReel.liked ? "red" : "white"}
                strokeWidth="2"
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-xs font-semibold text-white">
              {(currentReel.likes ?? 0) + (liked.has(currentReel.id) && !currentReel.liked ? 1 : 0)}
            </span>
          </button>

          {/* Izoh (hozircha faqat icon) */}
          <button className="flex flex-col items-center gap-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 transition hover:scale-110">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path
                  d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-xs font-semibold text-white">0</span>
          </button>

          {/* Ulashish */}
          <button className="flex flex-col items-center gap-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 transition hover:scale-110">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>

          {/* Foydalanuvchi avatar (profil sahifasiga link) */}
          {currentReel.user && (
            <Link
              href={`/profile/${currentReel.user.id}`}
              className="relative mt-2"
            >
              <Image
                src={currentReel.user.avatar_url || avatarFallback(currentReel.user.full_name)}
                alt={currentReel.user.full_name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full border-2 border-white object-cover"
                unoptimized
              />
            </Link>
          )}
        </div>

        {/* Pastki ma'lumot (foydalanuvchi nomi va tavsif) */}
        <div className="absolute bottom-4 left-4 right-20 z-10 text-white">
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
              <span className="text-xs text-gray-300">• {timeAgo(currentReel.created_at)}</span>
            </Link>
          )}
          {currentReel.description && (
            <p className="line-clamp-3 text-sm drop-shadow-lg">{currentReel.description}</p>
          )}
        </div>

        {/* Swipe ko'rsatkichi (pastda markaz) */}
        <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
          {reels.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 w-1 rounded-full transition-all ${
                idx === currentIndex ? "w-6 bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Keyingi va oldingi reels'ni oldindan yuklash (ko'rinmaydi, lekin cache uchun) */}
      {currentIndex > 0 && (
        <video
          ref={(el) => {
            if (el) videoRefs.current.set(currentIndex - 1, el);
          }}
          src={reels[currentIndex - 1].video_url}
          preload="auto"
          className="hidden"
        />
      )}
      {currentIndex < reels.length - 1 && (
        <video
          ref={(el) => {
            if (el) videoRefs.current.set(currentIndex + 1, el);
          }}
          src={reels[currentIndex + 1].video_url}
          preload="auto"
          className="hidden"
        />
      )}
    </div>
  );
}
