"use client";

import { ReactNode, useState } from "react";

type Tab = "reels" | "videos" | "certificates" | "reviews";

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
  const [activeTab, setActiveTab] = useState<Tab>("reels");

  const tabs = [
    {
      id: "reels" as Tab,
      icon: "🎬",
      label: "Reels",
      count: reelsCount,
    },
    {
      id: "videos" as Tab,
      icon: "📚",
      label: "Video darslar",
      count: videosCount,
    },
    {
      id: "certificates" as Tab,
      icon: "📜",
      label: "Sertifikatlar",
      count: certificatesCount,
    },
    {
      id: "reviews" as Tab,
      icon: "⭐",
      label: "Izohlar",
      count: reviewsCount,
    },
  ];

  return (
    <div className="mt-6">
      {/* Instagram-style tabs */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur-xl">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex min-w-[150px] flex-1 items-center justify-center
                  gap-2 px-4 py-4 text-sm font-semibold transition-all
                  sm:min-w-0
                  ${
                    active
                      ? "text-gray-950"
                      : "text-gray-400 hover:text-gray-700"
                  }
                `}
              >
                <span className="text-base">{tab.icon}</span>

                <span className="whitespace-nowrap">
                  {tab.label}
                </span>

                <span
                  className={`
                    rounded-full px-2 py-0.5 text-[11px] font-bold
                    ${
                      active
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-500"
                    }
                  `}
                >
                  {tab.count}
                </span>

                {active && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gray-900" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="pt-6">
        {activeTab === "reels" && reels}

        {activeTab === "videos" && videos}

        {activeTab === "certificates" && certificates}

        {activeTab === "reviews" && reviews}
      </div>
    </div>
  );
}
