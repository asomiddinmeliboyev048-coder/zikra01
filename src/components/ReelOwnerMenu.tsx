"use client";

import { useState } from "react";
import { deleteReelAction } from "@/app/actions/reels";

interface ReelOwnerMenuProps {
  reelId: string;
  /** O'chirish muvaffaqiyatli bo'lganda ota-komponentni xabardor qiladi */
  onDeleted: (reelId: string) => void;
}

/**
 * Reel egasi uchun "..." menyusi — hozircha "O'chirish" amali bilan.
 * O'chirish tasdiqlash oynasi orqali amalga oshiriladi va reel ham Supabase
 * bazasidan, ham AWS S3'dan o'chadi (deleteReelAction ichida).
 */
export default function ReelOwnerMenu({ reelId, onDeleted }: ReelOwnerMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    const res = await deleteReelAction(reelId);
    setDeleting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setConfirmOpen(false);
    onDeleted(reelId);
  };

  return (
    <>
      {/* "..." tugmasi */}
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
        aria-label="Ko'proq"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {/* Dropdown */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-12 z-[56] w-44 overflow-hidden rounded-xl bg-white py-1 shadow-2xl">
            <button
              onClick={() => {
                setMenuOpen(false);
                setConfirmOpen(true);
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Reelni o&apos;chirish
            </button>
          </div>
        </>
      )}

      {/* Tasdiqlash oynasi */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => !deleting && setConfirmOpen(false)}
          />
          <div className="relative w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900">
              Reelni o&apos;chirasizmi?
            </h3>
            <p className="mt-1.5 text-sm text-gray-500">
              Bu amalni ortga qaytarib bo&apos;lmaydi. Video va unga tegishli
              barcha like/izohlar butunlay o&apos;chib ketadi.
            </p>
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "O'chirilmoqda..." : "O'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
