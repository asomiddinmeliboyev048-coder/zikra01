"use client";

import { useEffect, useRef, useState } from "react";
import type { Reel } from "@/lib/types";
import ReelCard from "./ReelCard";

interface Props {
  reels: Reel[];
  me: { id: string; full_name: string; avatar_url: string | null } | null;
  initialIndex?: number;
}

/**
 * Instagram/TikTok uslubidagi vertikal Reels lentasi.
 * - CSS scroll-snap bilan har bir video butun ekranni egallaydi.
 * - IntersectionObserver (ReelCard ichida) faqat ko'rinayotgan videoni ijro etadi.
 * - Ovoz holati butun lenta uchun umumiy (global).
 */
export default function ReelFeed({ reels, me, initialIndex = 0 }: Props) {
  // Brauzerlar ovozli avtoplay'ni bloklagani uchun boshlang'ich holat: ovozsiz.
  const [muted, setMuted] = useState(true);
  const [showHint, setShowHint] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Grid'dan tanlangan reeldan boshlash (?start=<id>)
  useEffect(() => {
    if (initialIndex > 0 && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: initialIndex * window.innerHeight,
        behavior: "auto",
      });
    }
  }, [initialIndex]);

  function toggleMute() {
    setMuted((m) => !m);
    setShowHint(false);
  }

  return (
    <div
      ref={scrollRef}
      className="hide-scrollbar fixed inset-0 z-50 h-[100dvh] snap-y snap-mandatory overflow-y-scroll overscroll-none bg-black"
    >
      {reels.map((reel) => (
        <ReelCard
          key={reel.id}
          reel={reel}
          me={me}
          muted={muted}
          onToggleMute={toggleMute}
        />
      ))}

      {/* Ovozni yoqish uchun bir martalik ko'rsatma */}
      {muted && showHint && (
        <button
          onClick={toggleMute}
          className="fixed left-1/2 top-5 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white backdrop-blur animate-fade-in"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 9l-6 6M16 9l6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Ovozni yoqish uchun bosing
        </button>
      )}
    </div>
  );
}
