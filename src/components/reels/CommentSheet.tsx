"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  addReelCommentAction,
  deleteReelCommentAction,
  getReelCommentsAction,
  type ReelCommentRow,
} from "@/app/actions/reels";
import { avatarFallback, timeAgo } from "@/lib/utils";

interface Props {
  reelId: string;
  me: { id: string; full_name: string; avatar_url: string | null } | null;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

/**
 * Instagram uslubidagi pastdan chiqadigan izohlar paneli (bottom sheet).
 * Har bir reel faqat o'ziga tegishli izohlarni ko'rsatadi (reel_id bo'yicha).
 */
export default function CommentSheet({ reelId, me, onClose, onCountChange }: Props) {
  const [comments, setComments] = useState<ReelCommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Izohlarni yuklash
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await getReelCommentsAction(reelId);
      if (!alive) return;
      const list = res.comments ?? [];
      setComments(list);
      onCountChange?.(list.length);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reelId]);

  // Realtime: yangi izohlar
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`reel_comments:${reelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reel_comments",
          filter: `reel_id=eq.${reelId}`,
        },
        async (payload) => {
          const row = payload.new as ReelCommentRow;
          setComments((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev; // takror emas
            return [...prev, row];
          });
          // Muallif profilini olib to'ldiramiz
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, username")
            .eq("id", row.user_id)
            .single();
          if (data) {
            setComments((prev) =>
              prev.map((c) =>
                c.id === row.id ? { ...c, author: data as ReelCommentRow["author"] } : c
              )
            );
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [reelId]);

  // Yangi izoh qo'shilganda pastga scroll
  useEffect(() => {
    onCountChange?.(comments.length);
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setText("");

    const res = await addReelCommentAction(reelId, value);
    if (res.error) {
      setText(value); // qaytaramiz
      alert(res.error);
    } else if (res.comment) {
      setComments((prev) =>
        prev.some((c) => c.id === res.comment!.id) ? prev : [...prev, res.comment!]
      );
    }
    setSending(false);
  }

  async function remove(id: string) {
    const prev = comments;
    setComments((c) => c.filter((x) => x.id !== id));
    const res = await deleteReelCommentAction(id);
    if (res.error) {
      setComments(prev);
      alert(res.error);
    }
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end" onClick={onClose}>
      {/* Fon qoraytirish */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Panel */}
      <div
        className="relative z-10 flex max-h-[72%] min-h-[45%] flex-col rounded-t-2xl bg-white animate-slide-up dark:bg-[#161d31]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tutqich + sarlavha */}
        <div className="relative border-b border-gray-100 py-3 text-center dark:border-white/10">
          <span className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-gray-300" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Izohlar {comments.length > 0 && `(${comments.length})`}
          </h3>
          <button
            onClick={onClose}
            className="absolute right-3 top-2.5 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
            aria-label="Yopish"
          >
            ✕
          </button>
        </div>

        {/* Izohlar ro'yxati */}
        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-10 text-center">
              <span className="text-3xl">💬</span>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Hali izohlar yo&apos;q
              </p>
              <p className="text-xs text-gray-400">Birinchi bo&apos;lib izoh qoldiring!</p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Link href={`/profile/${c.user_id}`}>
                  <Image
                    src={c.author?.avatar_url || avatarFallback(c.author?.full_name ?? "Z")}
                    alt={c.author?.full_name ?? ""}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover"
                    unoptimized
                  />
                </Link>
                <div className="flex-1">
                  <p className="text-sm">
                    <Link
                      href={`/profile/${c.user_id}`}
                      className="font-semibold text-gray-900 hover:underline dark:text-white"
                    >
                      {c.author?.full_name ?? "Foydalanuvchi"}
                    </Link>{" "}
                    <span className="text-gray-700 dark:text-gray-300">{c.comment_text}</span>
                  </p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
                    <span>{timeAgo(c.created_at)}</span>
                    {me?.id === c.user_id && (
                      <button
                        onClick={() => remove(c.id)}
                        className="hover:text-accent"
                      >
                        O&apos;chirish
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Yangi izoh yozish */}
        {me ? (
          <form
            onSubmit={submit}
            className="flex items-center gap-2 border-t border-gray-100 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:border-white/10"
          >
            <Image
              src={me.avatar_url || avatarFallback(me.full_name)}
              alt={me.full_name}
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-full object-cover"
              unoptimized
            />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Izoh qoldiring..."
              maxLength={500}
              className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-brand/30 dark:bg-white/10 dark:text-white"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="shrink-0 rounded-full px-3 py-2 text-sm font-semibold text-brand disabled:opacity-40"
            >
              Yuborish
            </button>
          </form>
        ) : (
          <div className="border-t border-gray-100 p-4 text-center text-sm text-gray-500">
            Izoh yozish uchun tizimga kiring.
          </div>
        )}
      </div>
    </div>
  );
}
