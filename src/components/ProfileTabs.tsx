"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type TabId =
  | "reels"
  | "videos"
  | "certificates"
  | "reviews";

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
  const [
    activeTab,
    setActiveTab,
  ] = useState<TabId>("reels");

  const tabs: {
    id: TabId;
    icon: string;
    label: string;
    count: number;
  }[] = [
    {
      id: "reels",
      icon: "🎬",
      label: "Reels",
      count: reelsCount,
    },
    {
      id: "videos",
      icon: "📚",
      label: "Darslar",
      count: videosCount,
    },
    {
      id: "certificates",
      icon: "📜",
      label: "Sertifikat",
      count: certificatesCount,
    },
    {
      id: "reviews",
      icon: "⭐",
      label: "Izohlar",
      count: reviewsCount,
    },
  ];

  return (
    <div className="mt-6 w-full">

      {/* ======================================================
          TAB NAVIGATION
      ====================================================== */}

      <div className="w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        <div className="grid w-full grid-cols-4">

          {tabs.map((tab) => {
            const isActive =
              activeTab ===
              tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(
                    tab.id
                  )
                }
                className={[
                  "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-3 text-center transition-all",
                  "sm:flex-row sm:gap-2 sm:px-3 sm:py-4",
                  isActive
                    ? "text-gray-950"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-700",
                ].join(" ")}
              >

                {/* ICON */}

                <span className="shrink-0 text-base leading-none sm:text-lg">
                  {tab.icon}
                </span>

                {/* LABEL */}

                <span className="min-w-0 max-w-full truncate text-[9px] font-semibold sm:text-sm">
                  {tab.label}
                </span>

                {/* COUNT */}

                <span
                  className={[
                    "rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none sm:px-2 sm:text-[10px]",
                    isActive
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-500",
                  ].join(" ")}
                >
                  {tab.count}
                </span>

                {/* ACTIVE LINE */}

                {isActive && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-gray-900 sm:w-16" />
                )}

              </button>
            );
          })}

        </div>

      </div>

      {/* ======================================================
          ONLY ACTIVE CONTENT
      ====================================================== */}

      <div className="mt-5 w-full">

        {activeTab ===
          "reels" &&
          reels}

        {activeTab ===
          "videos" &&
          videos}

        {activeTab ===
          "certificates" &&
          certificates}

        {activeTab ===
          "reviews" &&
          reviews}

      </div>

    </div>
  );
}
