"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordViewAction, updateWatchProgressAction } from "@/app/actions/social";
import { normalizeUrl } from "@/lib/url";

function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}
function isFileVideo(url: string): boolean {
  return /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url);
}

interface Ad {
  id: string;
  title: string;
  video_url: string;
  redirect_url: string | null;
}

export default function VideoPlayer({
  videoId,
  url,
}: {
  videoId: string;
  url: string;
}) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [adChecked, setAdChecked] = useState(false);
  const [adDone, setAdDone] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const trackRef = useRef<number>(0);

  // Reklama olish
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("ad_videos")
      .select("id, title, video_url, redirect_url")
      .eq("is_active", true)
      .limit(10)
      .then(({ data }) => {
        const ads = (data as Ad[]) ?? [];
        if (ads.length > 0) {
          setAd(ads[Math.floor(Math.random() * ads.length)]);
        }
        setAdChecked(true);
      });
  }, []);

  // Asl video ko'rsatilganda — ko'rishni yozamiz
  useEffect(() => {
    if (adChecked && (adDone || !ad)) {
      recordViewAction(videoId);
    }
  }, [adChecked, adDone, ad, videoId]);

  // "O'tkazib yuborish" 5 soniyadan keyin
  useEffect(() => {
    if (!ad || adDone) return;
    setCanSkip(false);
    const t = setTimeout(() => setCanSkip(true), 5000);
    return () => clearTimeout(t);
  }, [ad, adDone]);

  function finishAd() {
    if (ad) {
      const supabase = createClient();
      supabase.rpc("bump_ad_view", { ad_id: ad.id });
    }
    setAdDone(true);
  }

  // Watch progress (file video uchun)
  function onTimeUpdate(e: React.SyntheticEvent<HTMLVideoElement>) {
    const v = e.currentTarget;
    if (!v.duration) return;
    const now = Math.floor(v.currentTime);
    if (now - trackRef.current >= 5) {
      trackRef.current = now;
      updateWatchProgressAction(videoId, v.currentTime, (v.currentTime / v.duration) * 100);
    }
  }

  // --- Reklama bosqichi ---
  if (adChecked && ad && !adDone) {
    const adYt = youtubeId(ad.video_url);
    return (
      <div className="relative aspect-video bg-black">
        {adYt ? (
          <iframe
            src={`https://www.youtube.com/embed/${adYt}?autoplay=1`}
            title={ad.title}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <video
            src={ad.video_url}
            autoPlay
            muted
            playsInline
            onEnded={finishAd}
            className="absolute inset-0 h-full w-full"
          />
        )}

        {/* Reklama belgisi */}
        <span className="absolute left-3 top-3 rounded bg-black/70 px-2 py-1 text-xs font-semibold text-yellow-300">
          Reklama
        </span>

        {/* "Batafsil" — havolani normalizatsiya qilamiz (https:// qo'shiladi),
            shunda tashqi manzil 404 bermay, yangi tabda to'g'ri ochiladi. */}
        {normalizeUrl(ad.redirect_url) && (
          <a
            href={normalizeUrl(ad.redirect_url)!}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 left-3 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white"
          >
            Batafsil →
          </a>
        )}

        {/* O'tkazib yuborish */}
        <button
          onClick={finishAd}
          disabled={!canSkip}
          className="absolute bottom-3 right-3 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-800 disabled:opacity-60"
        >
          {canSkip ? "O'tkazib yuborish ⏭" : "Reklama..."}
        </button>
      </div>
    );
  }

  // --- Asl video ---
  const yt = youtubeId(url);
  return (
    <div className="relative aspect-video bg-black">
      {yt ? (
        <iframe
          src={`https://www.youtube.com/embed/${yt}`}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : isFileVideo(url) ? (
        <video
          src={url}
          controls
          autoPlay
          playsInline
          onTimeUpdate={onTimeUpdate}
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand to-brand-700 text-white"
        >
          ▶ Videoni ochish
        </a>
      )}
    </div>
  );
}
