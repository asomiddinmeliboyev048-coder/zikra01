"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * VideoThumbnail — video URL'idan avtomatik "muqova" (thumbnail) ko'rsatadi.
 *
 * MUAMMO: Galereyadan yuklangan videolarda alohida thumbnail (poster) rasmi
 * bo'lmagani uchun kartochkada bo'sh/yashil fon chiqardi.
 *
 * YECHIM: Canvas + CORS o'rniga eng ishonchli usul — HTML5 "media fragment"
 * (`#t=<sekund>`) dan foydalanish. `<video src="...#t=1" preload="metadata">`
 * brauzerni videoning 1-sekundidagi kadrini yuklab, uni STATIK poster sifatida
 * chizishга majbur qiladi (video ijro etilmaydi). Bu usul:
 *   - CORS sozlamasini talab qilmaydi (canvas.toDataURL "tainted canvas"
 *     xatosidan xoli);
 *   - qo'shimcha kutubxona kerak emas;
 *   - AWS S3'dan kelayotgan oddiy .mp4/.webm URL bilan to'g'ridan-to'g'ri ishlaydi.
 *
 * Ba'zi brauzerlar faqat metadata bilan kadrni chizmasligi mumkin, shuning uchun
 * `onLoadedMetadata`da `currentTime`ni majburan `seekTo`ga surib, kadr
 * chizilishini kafolatlaymiz (`onSeeked` -> ready).
 */
export default function VideoThumbnail({
  videoUrl,
  seekTo = 1,
  className,
}: {
  videoUrl: string;
  /** Qaysi soniyadagi kadr olinishi (default: 1s) */
  seekTo?: number;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  // URL'ga media fragment qo'shamiz (agar allaqachon # bo'lmasa)
  const posterSrc = videoUrl.includes("#") ? videoUrl : `${videoUrl}#t=${seekTo}`;

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-900">
      <video
        ref={videoRef}
        src={posterSrc}
        muted
        playsInline
        preload="metadata"
        // iOS Safari ba'zan poster kadrini chizishi uchun kerak
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...({ "webkit-playsinline": "true" } as any)}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          ready ? "opacity-100" : "opacity-0",
          className
        )}
        onLoadedMetadata={() => {
          const v = videoRef.current;
          if (!v) return;
          // Kadr chizilishi uchun currentTime'ni majburan suramiz
          try {
            if (v.currentTime < seekTo) v.currentTime = seekTo;
          } catch {
            /* seek qo'llab-quvvatlanmasa — onLoadedData'ga tayanamiz */
          }
        }}
        onSeeked={() => setReady(true)}
        onLoadedData={() => setReady(true)}
        onError={() => setReady(false)}
      />

      {/* Kadr yuklanmaguncha — muloyim shimmer/gradient placeholder */}
      {!ready && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-800 to-gray-900" />
      )}
    </div>
  );
}
