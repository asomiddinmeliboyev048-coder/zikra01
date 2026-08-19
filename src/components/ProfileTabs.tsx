"use client";

import type { ReactNode } from "react";

interface ProfileTabsProps {
  reelsCount: number;
  videosCount: number;
  certificatesCount: number;
  reviewsCount: number;
  reels: ReactNode;
  videos: ReactNode;
  certificates: ReactNode;
  reviews: ReactNode;
}

export default function ProfileTabs({
  reelsCount,
  videosCount,
  certificatesCount,
  reviewsCount,
  reels,
  videos,
  certificates,
  reviews,
}: ProfileTabsProps) {
  return (
    <div className="mt-6 space-y-6">
      {/* INSTAGRAM STYLE NAV */}
      <div className="sticky top-0 z-20 border-y border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="grid grid-cols-4">
          <a
            href="#reels"
            className="flex flex-col items-center justify-center gap-1 px-1 py-3 text-gray-700 transition hover:text-black"
          >
            <span className="text-lg">🎬</span>
            <span className="text-[10px] font-semibold sm:text-xs">
              Reels
            </span>
            <span className="text-[9px] text-gray-400">
              {reelsCount}
            </span>
          </a>

          <a
            href="#videos"
            className="flex flex-col items-center justify-center gap-1 px-1 py-3 text-gray-700 transition hover:text-black"
          >
            <span className="text-lg">📚</span>
            <span className="text-[10px] font-semibold sm:text-xs">
              Videolar
            </span>
            <span className="text-[9px] text-gray-400">
              {videosCount}
            </span>
          </a>

          <a
            href="#certificates"
            className="flex flex-col items-center justify-center gap-1 px-1 py-3 text-gray-700 transition hover:text-black"
          >
            <span className="text-lg">📜</span>
            <span className="text-[10px] font-semibold sm:text-xs">
              Sertifikat
            </span>
            <span className="text-[9px] text-gray-400">
              {certificatesCount}
            </span>
          </a>

          <a
            href="#reviews"
            className="flex flex-col items-center justify-center gap-1 px-1 py-3 text-gray-700 transition hover:text-black"
          >
            <span className="text-lg">⭐</span>
            <span className="text-[10px] font-semibold sm:text-xs">
              Izohlar
            </span>
            <span className="text-[9px] text-gray-400">
              {reviewsCount}
            </span>
          </a>
        </div>
      </div>

      {/* REELS */}
      <section id="reels" className="scroll-mt-20">
        {reels}
      </section>

      {/* VIDEOS */}
      <section id="videos" className="scroll-mt-20">
        {videos}
      </section>

      {/* CERTIFICATES */}
      <section id="certificates" className="scroll-mt-20">
        {certificates}
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="scroll-mt-20">
        {reviews}
      </section>
    </div>
  );
}
