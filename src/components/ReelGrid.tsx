import Link from "next/link";
import type { Reel } from "@/lib/types";

interface ReelGridProps {
  reels: Reel[];
}

/**
 * Instagram uslubidagi Reels grid — foydalanuvchining barcha reels'larini
 * 3 ustunli grid ko'rinishida ko'rsatadi.
 */
export default function ReelGrid({ reels }: ReelGridProps) {
  if (reels.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Hali reel yuklanmagan. Yuqoridagi tugma orqali birinchi reelingizni qo&apos;shing.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {reels.map((reel) => (
        <Link
          key={reel.id}
          href={`/reels?start=${reel.id}`}
          className="group relative aspect-[9/16] overflow-hidden rounded-lg bg-gray-900"
        >
          {/* Video thumbnail (video element bilan first frame) */}
          <video
            src={reel.video_url}
            className="h-full w-full object-cover transition group-hover:scale-105"
            preload="metadata"
            muted
            playsInline
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/40" />

          {/* Play icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="white"
              className="drop-shadow-lg"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>

          {/* Like va ko'rish soni (pastda) */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs font-semibold text-white drop-shadow-lg">
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              {reel.likes ?? 0}
            </span>
            {reel.views !== undefined && (
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {reel.views}
              </span>
            )}
          </div>

          {/* Reel nishoni (tepadagi chap burchak) */}
          <div className="absolute left-2 top-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="drop-shadow-lg">
              <rect x="2" y="3" width="20" height="18" rx="2" />
              <path d="M2 7h20M7 3l-2 4M12 3l-2 4M17 3l-2 4" stroke="black" strokeWidth="1" />
            </svg>
          </div>
        </Link>
      ))}
    </div>
  );
}
