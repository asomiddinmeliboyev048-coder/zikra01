"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  getShareTargetsAction,
  getReelVideoUrlAction,
  type ShareTarget,
} from "@/app/actions/reels";
import { sendMessageAction } from "@/app/actions/chat";
import { avatarFallback } from "@/lib/utils";

interface Props {
  reelId: string;
  onClose: () => void;
}

/**
 * Reelni ulashish paneli (bottom sheet):
 *   1) "Havolani nusxalash" — reelning commaviy URL'ini clipboard'ga.
 *   2) Suhbatdoshga yuborish — mavjud suhbat/obunalar ro'yxatidan tanlab,
 *      reel havolasini chat orqali xabar sifatida yuboradi.
 */
export default function ShareSheet({ reelId, onClose }: Props) {
  const [targets, setTargets] = useState<ShareTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);
  // Reel videosining haqiqiy URL'i — chatga aynan shu yuboriladi (video pleyer bo'lib chiqadi)
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const reelUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/reels?start=${reelId}`
      : `/reels?start=${reelId}`;

  useEffect(() => {
    let alive = true;
    (async () => {
      const [tRes, vRes] = await Promise.all([
        getShareTargetsAction(),
        getReelVideoUrlAction(reelId),
      ]);
      if (!alive) return;
      setTargets(tRes.targets ?? []);
      if (vRes.videoUrl) setVideoUrl(vRes.videoUrl);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [reelId]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(reelUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Havolani nusxalab bo'lmadi. Qo'lda nusxalang: " + reelUrl);
    }
  }

  async function sendTo(target: ShareTarget) {
    if (sending || sentTo.has(target.id)) return;
    setSending(target.id);
    // Havola emas, videoning o'zini yuboramiz -> chatda video pleyer bo'lib ko'rinadi.
    // (Agar video URL topilmasa, zaxira sifatida sahifa havolasi ketadi.)
    const res = await sendMessageAction(target.id, videoUrl ?? reelUrl);
    setSending(null);
    if (res.error) {
      alert(res.error);
    } else {
      setSentTo((prev) => new Set(prev).add(target.id));
    }
  }

  const filtered = targets.filter((t) =>
    t.full_name.toLowerCase().includes(query.toLowerCase().trim())
  );

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative z-10 flex max-h-[72%] min-h-[45%] flex-col rounded-t-2xl bg-white animate-slide-up dark:bg-[#161d31]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sarlavha */}
        <div className="relative border-b border-gray-100 py-3 text-center dark:border-white/10">
          <span className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-gray-300" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Ulashish</h3>
          <button
            onClick={onClose}
            className="absolute right-3 top-2.5 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
            aria-label="Yopish"
          >
            ✕
          </button>
        </div>

        {/* Havolani nusxalash */}
        <div className="border-b border-gray-100 p-3 dark:border-white/10">
          <button
            onClick={copyLink}
            className="flex w-full items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand dark:bg-brand/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
              {copied ? "✓ Havola nusxalandi!" : "Havolani nusxalash"}
            </span>
          </button>
        </div>

        {/* Suhbatdoshlar ro'yxati */}
        <div className="px-3 pt-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suhbatdosh qidirish..."
            className="w-full rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-brand/30 dark:bg-white/10 dark:text-white"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {loading ? (
            <div className="flex justify-center py-10">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              {targets.length === 0
                ? "Hozircha yuboradigan suhbatdosh yo'q. Havolani nusxalab ulashing."
                : "Hech kim topilmadi."}
            </p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <Image
                    src={t.avatar_url || avatarFallback(t.full_name)}
                    alt={t.full_name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                    unoptimized
                  />
                  <div className="flex-1 truncate">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {t.full_name}
                    </p>
                    {t.username && (
                      <p className="truncate text-xs text-gray-400">@{t.username}</p>
                    )}
                  </div>
                  <button
                    onClick={() => sendTo(t)}
                    disabled={sentTo.has(t.id) || sending === t.id}
                    className="shrink-0 rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white transition disabled:opacity-60"
                  >
                    {sentTo.has(t.id)
                      ? "✓ Yuborildi"
                      : sending === t.id
                      ? "..."
                      : "Yuborish"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
