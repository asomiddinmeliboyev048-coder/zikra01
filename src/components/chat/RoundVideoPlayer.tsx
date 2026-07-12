"use client";

import { useRef, useState } from "react";

/**
 * Yumaloq video xabar pleyeri (Telegram uslubi).
 * Dumaloq (rounded-full) video. Bosilganda ovoz bilan ijro etiladi/pauza qilinadi.
 * `src` - video fayl public URL'i.
 */
export default function RoundVideoPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.muted = false; // ovoz bilan ijro
      v.play()
        .then(() => setPlaying(true))
        .catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="relative block h-48 w-48 overflow-hidden rounded-full bg-black"
      aria-label="Yumaloq video xabar"
    >
      <video
        ref={ref}
        src={src}
        playsInline
        loop
        muted
        preload="metadata"
        className="h-full w-full object-cover"
        onEnded={() => setPlaying(false)}
      />
      {/* Ijro belgisi (pauza holatida) */}
      {!playing && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      )}
    </button>
  );
}
