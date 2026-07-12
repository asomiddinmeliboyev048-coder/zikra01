"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { avatarFallback, timeAgo } from "@/lib/utils";
import {
  getReelCommentsAction,
  addReelCommentAction,
} from "@/app/actions/reels";
import type { ReelComment } from "@/lib/types";

interface CurrentUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  username?: string | null;
}

interface ReelCommentsSheetProps {
  reelId: string;
  open: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  /** Izohlar soni o'zgarganda ota-komponentga xabar berish (badge yangilash uchun) */
  onCountChange?: (count: number) => void;
}

/**
 * Instagram/TikTok uslubidagi "Izohlar" Bottom Sheet.
 *
 * - Overlay (bg-black/50): bosilsa oyna yopiladi.
 * - Oyna pastdan (translate-y-full -> translate-y-0) silliq sirpanib chiqadi.
 * - Tuzilishi: tepa (drag handle + sarlavha) / o'rta (skroll ro'yxat) /
 *   past (fixed input + yuborish tugmasi).
 * - Ochilganda o'sha reelning izohlari Supabase'dan tortiladi (server action).
 * - Yuborilganda izoh bazaga yoziladi va darhol ro'yxatga qo'shiladi.
 */
export default function ReelCommentsSheet({
  reelId,
  open,
  onClose,
  currentUser,
  onCountChange,
}: ReelCommentsSheetProps) {
  const [mounted, setMounted] = useState(false); // DOM'da bormi
  const [show, setShow] = useState(false); // sirpanish animatsiyasi holati
  const [comments, setComments] = useState<ReelComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  // --- Ochilish / yopilish animatsiyasi ---
  useEffect(() => {
    if (open) {
      setMounted(true);
      // Keyingi frame'da translate-y-0 ga o'tkazamiz (silliq kirish uchun)
      const id = requestAnimationFrame(() => setShow(true));
      return () => cancelAnimationFrame(id);
    }
    // Yopilish: avval pastga sirpanadi, keyin DOM'dan olib tashlanadi
    setShow(false);
    const t = setTimeout(() => setMounted(false), 300);
    return () => clearTimeout(t);
  }, [open]);

  // --- Ochilganda izohlarni yuklash ---
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError(null);
    getReelCommentsAction(reelId).then((res) => {
      if (!active) return;
      if (res.error) setError(res.error);
      else if (res.comments) {
        setComments(res.comments);
        onCountChange?.(res.comments.length);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
    // reelId yoki open o'zgarganda qayta yuklaymiz
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reelId]);

  // ESC bilan yopish
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed || submitting) return;

      setSubmitting(true);
      setError(null);

      // --- Optimistic: darhol ro'yxatga qo'shamiz ---
      const tempId = `temp-${Date.now()}`;
      const optimistic: ReelComment = {
        id: tempId,
        reel_id: reelId,
        user_id: currentUser.id,
        content: trimmed,
        created_at: new Date().toISOString(),
        author: {
          id: currentUser.id,
          full_name: currentUser.full_name,
          avatar_url: currentUser.avatar_url,
          username: currentUser.username ?? null,
        },
      };
      setComments((prev) => {
        const next = [...prev, optimistic];
        onCountChange?.(next.length);
        return next;
      });
      setText("");
      // Ro'yxat oxiriga skroll
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });

      // --- Serverga yozamiz ---
      const res = await addReelCommentAction(reelId, trimmed);
      if (res.error || !res.comment) {
        // Rollback: vaqtinchalik izohni olib tashlaymiz
        setComments((prev) => {
          const next = prev.filter((c) => c.id !== tempId);
          onCountChange?.(next.length);
          return next;
        });
        setError(res.error ?? "Izohni yuborib bo'lmadi.");
        setText(trimmed); // matnni qaytaramiz, foydalanuvchi qayta urinib ko'rsin
      } else {
        // Vaqtinchalik izohni haqiqiy (server) izoh bilan almashtiramiz
        setComments((prev) =>
          prev.map((c) => (c.id === tempId ? (res.comment as ReelComment) : c))
        );
      }
      setSubmitting(false);
    },
    [text, submitting, reelId, currentUser, onCountChange]
  );

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Izohlar">
      {/* Overlay — bosilsa yopiladi */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          show ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Bottom Sheet */}
      <div
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[75vh] w-full max-w-[500px] flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
          show ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* --- TEPA: drag handle + sarlavha --- */}
        <div className="relative shrink-0 border-b border-gray-100 pb-3 pt-2">
          {/* Qalinroq kulrang qisqa chiziqcha */}
          <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-gray-300" />
          <h2 className="text-center text-base font-semibold text-gray-900">
            Izohlar
            {comments.length > 0 && (
              <span className="ml-1 text-gray-400">{comments.length}</span>
            )}
          </h2>
        </div>

        {/* --- O'RTA: skroll qilinadigan izohlar ro'yxati --- */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">
              Yuklanmoqda...
            </div>
          ) : error && comments.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-red-500">
              {error}
            </div>
          ) : comments.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-gray-700">Hali izohlar yo&apos;q</p>
              <p className="mt-1 text-xs text-gray-400">
                Birinchi bo&apos;lib izoh qoldiring!
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {comments.map((c) => (
                <li key={c.id} className="flex items-start gap-3">
                  <Link href={`/profile/${c.author?.id ?? c.user_id}`} className="shrink-0">
                    <Image
                      src={
                        c.author?.avatar_url ||
                        avatarFallback(c.author?.full_name ?? "Zikra")
                      }
                      alt={c.author?.full_name ?? "Foydalanuvchi"}
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full object-cover"
                      unoptimized
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${c.author?.id ?? c.user_id}`}
                        className="truncate text-sm font-semibold text-gray-900"
                      >
                        {c.author?.username || c.author?.full_name || "Foydalanuvchi"}
                      </Link>
                      <span className="shrink-0 text-xs text-gray-400">
                        {timeAgo(c.created_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-800">
                      {c.content}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* --- PASTKI: doimo qotib turadigan input --- */}
        <form
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-gray-100 bg-white px-3 py-2.5"
          style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
        >
          {error && comments.length > 0 && (
            <p className="mb-1.5 px-1 text-xs text-red-500">{error}</p>
          )}
          <div className="flex items-center gap-2">
            <Image
              src={currentUser.avatar_url || avatarFallback(currentUser.full_name)}
              alt="Siz"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-full object-cover"
              unoptimized
            />
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Izoh qoldiring..."
              maxLength={1000}
              className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#534AB7]/40"
            />
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className="shrink-0 rounded-full px-3 py-2 text-sm font-semibold text-[#534AB7] transition disabled:opacity-40"
            >
              {submitting ? "..." : "Yuborish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
