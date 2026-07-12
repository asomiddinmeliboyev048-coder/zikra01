"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { avatarFallback } from "@/lib/utils";
import {
  getChatPartnersAction,
  sendReelToChatAction,
  type ChatPartner,
} from "@/app/actions/chat";

interface ShareReelModalProps {
  videoUrl: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Reelni chatdagi do'stga yuborish oynasi.
 * Ochilganda foydalanuvchining suhbatdoshlari yuklanadi; kimgadir bosilganda
 * reel "reel:<video_url>" ko'rinishida yuboriladi va chatda video sifatida
 * to'g'ridan-to'g'ri o'ynaydi.
 */
export default function ShareReelModal({
  videoUrl,
  open,
  onClose,
}: ShareReelModalProps) {
  const [partners, setPartners] = useState<ChatPartner[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setSentTo(new Set());
    getChatPartnersAction().then((list) => {
      if (!active) return;
      setPartners(list);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [open]);

  if (!open) return null;

  const send = async (partnerId: string) => {
    if (sendingId || sentTo.has(partnerId)) return;
    setSendingId(partnerId);
    const res = await sendReelToChatAction(partnerId, videoUrl);
    setSendingId(null);
    if (res.error) {
      alert(res.error);
      return;
    }
    setSentTo((prev) => new Set(prev).add(partnerId));
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex max-h-[70vh] w-full max-w-sm flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h3 className="font-semibold text-gray-900">Reelni yuborish</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Yopish">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <p className="py-10 text-center text-sm text-gray-400">Yuklanmoqda...</p>
          ) : partners.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              Hali suhbatdoshlaringiz yo&apos;q. Avval kimdir bilan yozishing.
            </p>
          ) : (
            <ul className="space-y-1">
              {partners.map((p) => {
                const sent = sentTo.has(p.id);
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => send(p.id)}
                      disabled={sent || sendingId === p.id}
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-gray-50 disabled:opacity-70"
                    >
                      <Image
                        src={p.avatar_url || avatarFallback(p.full_name)}
                        alt={p.full_name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                        unoptimized
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {p.full_name}
                        </p>
                        {p.username && (
                          <p className="truncate text-xs text-gray-500">@{p.username}</p>
                        )}
                      </div>
                      <span
                        className={
                          sent
                            ? "rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700"
                            : "rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white"
                        }
                      >
                        {sent ? "Yuborildi ✓" : sendingId === p.id ? "..." : "Yuborish"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
