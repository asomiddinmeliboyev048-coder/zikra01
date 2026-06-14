"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Ovozli xabar pleyeri — play/pause tugmasi, progress bar va davomiylik.
 * `src` — audio fayl public URL'i. `mine` — pufakcha o'zimnikimi (rang uchun).
 */
export default function VoicePlayer({
  src,
  mine,
}: {
  src: string;
  mine: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrent(audio.currentTime);
    const onMeta = () => {
      // Ba'zi webm fayllarda duration Infinity bo'ladi — hiyla bilan aniqlaymiz
      if (audio.duration === Infinity || Number.isNaN(audio.duration)) {
        audio.currentTime = 1e9;
        audio.ontimeupdate = () => {
          audio.ontimeupdate = onTime;
          setDuration(audio.duration);
          audio.currentTime = 0;
        };
      } else {
        setDuration(audio.duration);
      }
    };
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  }

  const pct = duration ? (current / duration) * 100 : 0;
  const shown = playing || current > 0 ? current : duration;
  const mm = String(Math.floor(shown / 60)).padStart(2, "0");
  const ss = String(Math.floor(shown % 60)).padStart(2, "0");

  return (
    <div className="flex w-48 items-center gap-2 py-0.5">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base",
          mine ? "bg-white/25 text-white" : "bg-brand text-white"
        )}
        aria-label={playing ? "Pauza" : "Ijro"}
      >
        {playing ? "⏸" : "▶"}
      </button>
      <div className="flex-1">
        <div
          onClick={seek}
          className={cn(
            "h-1.5 w-full cursor-pointer rounded-full",
            mine ? "bg-white/30" : "bg-gray-200"
          )}
        >
          <div
            className={cn("h-full rounded-full", mine ? "bg-white" : "bg-brand")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span
          className={cn(
            "mt-0.5 block text-[10px]",
            mine ? "text-brand-100" : "text-gray-400"
          )}
        >
          🎤 {mm}:{ss}
        </span>
      </div>
    </div>
  );
}
