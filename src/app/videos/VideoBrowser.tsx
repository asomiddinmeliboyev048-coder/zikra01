"use client";

import { useMemo, useState } from "react";
import VideoCard from "@/components/VideoCard";
import type { Video } from "@/lib/types";

export default function VideoBrowser({ videos }: { videos: Video[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return videos;
    return videos.filter((v) => v.title.toLowerCase().includes(s));
  }, [q, videos]);

  return (
    <div>
      {/* Qidiruv */}
      <div className="relative mb-6">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Video nomi bo'yicha qidiring..."
          className="input pl-10"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      ) : q.trim() ? (
        <div className="card flex flex-col items-center gap-2 py-16 text-center">
          <span className="text-4xl">🔍</span>
          <p className="font-medium text-gray-700">Bu nomda video topilmadi</p>
          <p className="text-sm text-gray-500">Boshqa nom bilan qidiring.</p>
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-2 py-16 text-center">
          <span className="text-4xl">🎬</span>
          <p className="font-medium text-gray-700">Hali video darslar yo&apos;q</p>
          <p className="text-sm text-gray-500">Birinchi bo&apos;lib o&apos;z darsingizni yuklang!</p>
        </div>
      )}
    </div>
  );
}
