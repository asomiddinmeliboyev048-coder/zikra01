"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { avatarFallback, timeAgo } from "@/lib/utils";
import { useReelLike } from "@/components/ReelLikeButton";
import ReelCommentsSheet from "@/components/ReelCommentsSheet";
import ReelOwnerMenu from "@/components/ReelOwnerMenu";
import ShareReelModal from "@/components/ShareReelModal";
import { recordReelViewAction } from "@/app/actions/reels";
import type { Reel } from "@/lib/types";

interface CurrentUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  username?: string | null;
}

interface ReelsPlayerProps {
  reels: Reel[];
  initialIndex?: number;
  currentUser: CurrentUser;
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
export default function ReelsPlayer({
  reels,
  initialIndex = 0,
  currentUser,
}: ReelsPlayerProps) {
  // Reels ro'yxati local state — o'chirish amalidan keyin UI'ni yangilash uchun
  const [list, setList] = useState<Reel[]>(reels);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [muted, setMuted] = useState(false); // Boshlang'ich holat: ovoz yoqilgan
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  // Izohlar Bottom Sheet ochiqmi
  const [commentsOpen, setCommentsOpen] = useState(false);
  // Reelni ulashish (chatga yuborish) oynasi ochiqmi
  const [shareOpen, setShareOpen] = useState(false);
  // Har bir reel uchun izohlar soni (badge) — server'dan kelgan boshlang'ich qiymat
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(reels.map((r) => [r.id, r.comments ?? 0]))
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartY = useRef(0);
  // Bir sessiyada bir reel uchun ko'rish bir marta yozilishini ta'minlaydi
  const viewedRef = useRef<Set<string>>(new Set());
  // Video ustiga 2 marta bosishni (double-tap) aniqlash uchun
  const lastTapRef = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentReel = list[currentIndex];
  const isOwner = currentReel?.user_id === currentUser.id;

  // Joriy reel uchun "like" holati (yon tugma + 2 marta bosish bir manbadan)
  const like = useReelLike(
    currentReel?.id ?? "",
    Boolean(currentReel?.liked),
    currentReel?.likes ?? 0
  );

  // Video markazida "yurakcha portlashi" animatsiyasi
  const [showHeart, setShowHeart] = useState(false);
  const [heartKey, setHeartKey] = useState(0);

  // Reel egasi o'z reelini o'chirganda ro'yxatdan olib tashlaymiz va indeksni to'g'rilaymiz
  const handleDeleted = useCallback(
    (reelId: string) => {
      setList((prev) => {
        const next = prev.filter((r) => r.id !== reelId);
        setCurrentIndex((idx) => Math.max(0, Math.min(idx, next.length - 1)));
        return next;
      });
    },
    []
  );

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

  // Ko'rishlar hisobi — reel ko'rilganda bir marta yoziladi.
  // O'z videosini ko'rish hisoblanmaydi; bir sessiyada takror yozilmaydi
  // (server tomonda ham unique (reel_id,user_id) himoya bor).
  useEffect(() => {
    const reel = list[currentIndex];
    if (!reel) return;
    if (reel.user_id === currentUser.id) return;
    if (viewedRef.current.has(reel.id)) return;
    viewedRef.current.add(reel.id);
    recordReelViewAction(reel.id);
  }, [currentIndex, list, currentUser.id]);

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

  // Video ustiga bosish:
  //   - bir marta  -> ovozni yoqish/o'chirish (double-tap bo'lmasligini kutib)
  //   - ikki marta tez (double-tap) -> like + markazda yurakcha animatsiyasi
  const handleVideoTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_MS = 280;
    if (now - lastTapRef.current < DOUBLE_MS) {
      // Double-tap aniqlandi — kutilayotgan bir martalik amalni bekor qilamiz
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }
      lastTapRef.current = 0;
      like.likeIfNeeded(); // hech qachon unlike qilmaydi
      setHeartKey((k) => k + 1);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    } else {
      lastTapRef.current = now;
      singleTapTimer.current = setTimeout(() => {
        toggleMute();
        singleTapTimer.current = null;
      }, DOUBLE_MS);
    }
  }, [like, toggleMute]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < list.length - 1 ? prev + 1 : prev));
  }, [list.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Touch swipe navigatsiya (mobil)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Izohlar/ulashish oynasi ochiq bo'lsa — reel navigatsiyasi o'chiriladi
    if (commentsOpen || shareOpen) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (diff > 50) goNext();
    else if (diff < -50) goPrev();
  };

  // Klaviatura navigatsiya (desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Izohlar/ulashish oynasi ochiq bo'lsa — navigatsiya klavishlari ishlamaydi
      if (commentsOpen || shareOpen) return;
      if (e.key === "ArrowUp") goPrev();
      else if (e.key === "ArrowDown") goNext();
      else if (e.key === "m" || e.key === "M") toggleMute();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goPrev, goNext, toggleMute, commentsOpen, shareOpen]);

  if (list.length === 0 || !currentReel) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <p className="text-lg">Hali reels mavjud emas</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div
        className="relative mx-auto h-full w-full max-w-[500px]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "none", overscrollBehavior: "none" }}
      >
        {/* Joriy video — bir marta bosilsa ovoz, 2 marta bosilsa like */}
        <video
          key={currentReel.id}
          ref={videoRef}
          src={currentReel.video_url}
          loop
          playsInline
          muted={muted}
          onClick={handleVideoTap}
          className="h-full w-full cursor-pointer object-contain"
          style={{ aspectRatio: "9/16" }}
        />

        {/* Double-tap yurakcha animatsiyasi (markazda) */}
        {showHeart && (
          <div
            key={heartKey}
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
          >
            <svg
              width="120"
              height="120"
              viewBox="0 0 24 24"
              fill="#ef4444"
              className="animate-heart-pop drop-shadow-2xl"
            >
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </div>
        )}

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

        {/* Egasi uchun "..." menyu (o'chirish) — tepa o'ng, ovoz tugmasidan chapda */}
        {isOwner && (
          <div className="absolute right-16 top-4 z-20">
            <ReelOwnerMenu reelId={currentReel.id} onDeleted={handleDeleted} />
          </div>
        )}

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
          {/* Like — yon tugma (video ustiga 2 marta bosish bilan bir holatni ulashadi) */}
          <button
            onClick={like.toggle}
            className="flex flex-col items-center gap-1"
            aria-label={like.liked ? "Yoqtirishni bekor qilish" : "Yoqtirish"}
            aria-pressed={like.liked}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 transition hover:scale-110 active:scale-95">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill={like.liked ? "#ef4444" : "none"}
                stroke={like.liked ? "#ef4444" : "white"}
                strokeWidth="2"
                className="transition-transform duration-200"
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-xs font-semibold text-white drop-shadow">
              {Math.max(0, like.count)}
            </span>
          </button>

          {/* Izohlar — Bottom Sheet'ni ochadi */}
          <button
            onClick={() => setCommentsOpen(true)}
            className="flex flex-col items-center gap-1"
            aria-label="Izohlar"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 transition hover:scale-110 active:scale-95">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path
                  d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-xs font-semibold text-white drop-shadow">
              {commentCounts[currentReel.id] ?? 0}
            </span>
          </button>

          {/* Ulashish — reelni chatdagi do'stga yuborish */}
          <button
            onClick={() => setShareOpen(true)}
            className="flex flex-col items-center gap-1"
            aria-label="Ulashish"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 transition hover:scale-110 active:scale-95">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
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
          {list.map((_, idx) => (
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
      {currentIndex > 0 && list[currentIndex - 1] && (
        <link rel="prefetch" href={list[currentIndex - 1].video_url} as="video" />
      )}
      {currentIndex < list.length - 1 && list[currentIndex + 1] && (
        <link rel="prefetch" href={list[currentIndex + 1].video_url} as="video" />
      )}

      {/* Izohlar Bottom Sheet — joriy reel uchun */}
      <ReelCommentsSheet
        reelId={currentReel.id}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        currentUser={currentUser}
        onCountChange={(count) =>
          setCommentCounts((prev) => ({ ...prev, [currentReel.id]: count }))
        }
      />

      {/* Reelni chatga yuborish oynasi */}
      <ShareReelModal
        videoUrl={currentReel.video_url}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
