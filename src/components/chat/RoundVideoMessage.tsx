"use client";

import { useRef, useState } from "react";

/**
 * Yumaloq video xabar pleyeri (Telegram "video note" uslubi).
 * `circle:<url>` konventsiyasidagi xabarlar shu komponent bilan ko'rsatiladi.
 * Bosilganda ijro/pauza; ijro tugagach boshiga qaytadi.
 */
export default function RoundVideoMessage({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    if (playing) {
      v.pause();
      setPlaying(false);
    } else {
      v.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="relative block h-48 w-48 overflow-hidden rounded-full bg-black shadow-sm"
      aria-label={playing ? "Pauza" : "Ijro"}
    >
      <video
        ref={ref}
        src={src}
        playsInline
        preload="metadata"
        onEnded={() => setPlaying(false)}
        className="h-full w-full object-cover"
      />
      {/* Pauzada — ijro belgisi */}
      {!playing && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/25">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#14A08E">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      )}
      {/* Yumaloq video belgisi */}
      <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
        📹
      </span>
    </button>
  );
}
