"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDuration } from "@/lib/utils";

/**
 * Video kartochka thumbnaili — kursor ustiga kelganda (onMouseEnter)
 * video ovozsiz rejimda 5-10 soniyalik "teaser" sifatida ijro etiladi.
 * Kursor olib tashlanganda (onMouseLeave) thumbnailga qaytadi.
 *
 * Eslatma: teaser faqat to'g'ridan-to'g'ri video fayllar (mp4/webm/mov)
 * uchun ishlaydi. YouTube/Vimeo havolalarida faqat thumbnail ko'rsatiladi.
 */
const TEASER_MS = 8000; // teaser davomiyligi (8 soniya)

function isPreviewable(url: string | null | undefined): boolean {
  if (!url) return false;
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(url)) return false;
  return /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url) || /supabase\.|\/storage\//i.test(url);
}

export default function VideoThumb({
  id,
  title,
  thumbnailUrl,
  videoUrl,
  duration,
}: {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  videoUrl: string;
  duration: number | null;
}) {
  const [preview, setPreview] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canPreview = isPreviewable(videoUrl);

  function start() {
    if (!canPreview) return;
    setPreview(true);
    // 5-10 soniyadan keyin teaser to'xtaydi (resurs tejash uchun)
    timerRef.current = setTimeout(() => {
      stop();
    }, TEASER_MS);
    // Videoni boshlash
    requestAnimationFrame(() => {
      const v = videoRef.current;
      if (v) {
        v.currentTime = 0;
        v.muted = true;
        v.play().catch(() => {});
      }
    });
  }

  function stop() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
    setPreview(false);
  }

  return (
    <div
      className="relative aspect-video overflow-hidden bg-gray-900"
      onMouseEnter={start}
      onMouseLeave={stop}
    >
      {/* Thumbnail */}
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand to-brand-700">
          <PlayIcon />
        </div>
      )}

      {/* Teaser video (faqat hover paytida yuklanadi/ijro etiladi) */}
      {preview && (
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full animate-fade-in object-cover"
        />
      )}

      {/* Davomiylik */}
      {duration ? (
        <span className="absolute bottom-2 right-2 z-10 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
          {formatDuration(duration)}
        </span>
      ) : null}

      {/* "Teaser" belgisi */}
      {preview && (
        <span className="absolute left-2 top-2 z-10 rounded bg-brand/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Teaser
        </span>
      )}

      {/* Ochish havolasi + play overlay */}
      <Link
        href={`/videos/${id}`}
        className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition hover:bg-black/20"
        aria-label="Videoni ochish"
      >
        {!preview && (
          <span className="rounded-full bg-white/90 p-3 opacity-0 transition group-hover:opacity-100">
            <PlayIcon dark />
          </span>
        )}
      </Link>
    </div>
  );
}

function PlayIcon({ dark = false }: { dark?: boolean }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill={dark ? "#14A08E" : "white"}
      aria-hidden
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
