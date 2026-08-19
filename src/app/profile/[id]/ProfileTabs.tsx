"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type TabId = "reels" | "videos" | "certificates" | "reviews";

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
  const [activeTab, setActiveTab] = useState<TabId>("reels");

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
      label: "Video darslar",
      count: videosCount,
    },
    {
      id: "certificates",
      icon: "📜",
      label: "Sertifikatlar",
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
    <div className="mt-6">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="flex min-w-max sm:min-w-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "relative flex min-w-[150px] flex-1 items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition-all sm:min-w-0",
                    isActive
                      ? "text-gray-950"
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-700",
                  ].join(" ")}
                >
                  <span className="text-base">{tab.icon}</span>

                  <span>{tab.label}</span>

                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      isActive
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-500",
                    ].join(" ")}
                  >
                    {tab.count}
                  </span>

                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gray-900" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5">
        {activeTab === "reels" && reels}

        {activeTab === "videos" && videos}

        {activeTab === "certificates" && certificates}

        {activeTab === "reviews" && reviews}
      </div>
    </div>
  );
}
