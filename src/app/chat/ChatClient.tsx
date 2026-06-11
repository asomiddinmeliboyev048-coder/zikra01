"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAction } from "@/app/actions/chat";
import { setReactionAction } from "@/app/actions/social";
import { uploadChatMedia } from "@/lib/storage";
import { avatarFallback, formatTime, timeAgo, cn } from "@/lib/utils";
import MatchBadge from "@/components/MatchBadge";
import type { Message } from "@/lib/types";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface ReactionAgg {
  emoji: string;
  count: number;
  mine: boolean;
}

export interface Conversation {
  partner: { id: string; full_name: string; avatar_url: string | null };
  conversation_id: string;
  last_message: string | null;
  last_at: string | null;
}

interface Props {
  meId: string;
  conversations: Conversation[];
  activeId: string | null;
  initialMessages: Message[];
  matchScore: number;
}

export default function ChatClient({
  meId,
  conversations,
  activeId,
  initialMessages,
  matchScore,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [reactions, setReactions] = useState<Record<string, ReactionAgg[]>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLInputElement>(null);

  const active = conversations.find((c) => c.partner.id === activeId) ?? null;

  // Reaksiyalarni yuklash
  async function loadReactions(msgIds: string[]) {
    if (msgIds.length === 0) {
      setReactions({});
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("message_reactions")
      .select("message_id, user_id, emoji")
      .in("message_id", msgIds);

    // Xatolik bo'lsa (masalan jadval yo'q yoki RLS) — joriy holatni saqlaymiz
    if (error) return;

    const map: Record<string, ReactionAgg[]> = {};
    for (const r of (data as { message_id: string; user_id: string; emoji: string }[]) ?? []) {
      if (!map[r.message_id]) map[r.message_id] = [];
      const arr = map[r.message_id];
      const found = arr.find((a) => a.emoji === r.emoji);
      if (found) {
        found.count += 1;
        if (r.user_id === meId) found.mine = true;
      } else {
        arr.push({ emoji: r.emoji, count: 1, mine: r.user_id === meId });
      }
    }
    setReactions(map);
  }

  // Xabarlar o'zgarsa reaksiyalarni qayta yuklash
  useEffect(() => {
    loadReactions(messages.map((m) => m.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  async function react(messageId: string, emoji: string) {
    // optimistik (immutable — obyektlarni nusxalaymiz)
    setReactions((prev) => {
      const arr = (prev[messageId] ?? []).map((a) => ({ ...a }));
      const mineExisting = arr.find((a) => a.mine);
      if (mineExisting && mineExisting.emoji === emoji) {
        mineExisting.count -= 1;
        mineExisting.mine = false;
      } else {
        if (mineExisting) {
          mineExisting.count -= 1;
          mineExisting.mine = false;
        }
        const target = arr.find((a) => a.emoji === emoji);
        if (target) {
          target.count += 1;
          target.mine = true;
        } else {
          arr.push({ emoji, count: 1, mine: true });
        }
      }
      return { ...prev, [messageId]: arr.filter((a) => a.count > 0) };
    });
    const res = await setReactionAction(messageId, emoji);
    if (res?.error) alert(res.error);
  }

  // Yangi xabarlar kelganda pastga aylantirish
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Server'dan kelgan boshlang'ich xabarlarni sinxronlash
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, activeId]);

  // Realtime subscription
  useEffect(() => {
    if (!active) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${active.conversation_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${active.conversation_id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        () => {
          loadReactions(messagesRef.current.map((m) => m.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Eng so'nggi xabarlar ro'yxatiga ref (realtime ichida ishlatish uchun)
  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || !activeId) return;
    setSending(true);
    setText("");
    const res = await sendMessageAction(activeId, content);
    setSending(false);
    if (res.error) {
      alert(res.error);
      setText(content);
    }
    // Yangi xabar realtime orqali keladi
  }

  function shareVideoLink() {
    const url = prompt("Video dars havolasini kiriting:");
    if (url) setText((t) => (t ? t + " " : "") + url);
  }

  async function handleMediaPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !activeId) return;
    setUploadingMedia(true);
    try {
      const url = await uploadChatMedia(f);
      const res = await sendMessageAction(activeId, url);
      if (res.error) alert(res.error);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Yuklashda xatolik.");
    } finally {
      setUploadingMedia(false);
    }
  }

  return (
    <div className="card flex w-full overflow-hidden">
      {/* Chap panel: suhbatlar */}
      <aside
        className={cn(
          "w-full border-r border-gray-100 sm:w-72 sm:shrink-0",
          activeId ? "hidden sm:block" : "block"
        )}
      >
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="font-semibold text-gray-900">Suhbatlar</h2>
        </div>
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">
              Hali suhbatlar yo&apos;q. Kashf etish sahifasidan kimnidir toping!
            </p>
          ) : (
            conversations.map((c) => (
              <Link
                key={c.partner.id}
                href={`/chat?with=${c.partner.id}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50",
                  c.partner.id === activeId && "bg-brand-50"
                )}
              >
                <Image
                  src={
                    c.partner.avatar_url || avatarFallback(c.partner.full_name)
                  }
                  alt={c.partner.full_name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                  unoptimized
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {c.partner.full_name}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {c.last_message ?? "Suhbatni boshlang"}
                  </p>
                </div>
                {c.last_at && (
                  <span className="shrink-0 text-[10px] text-gray-400">
                    {timeAgo(c.last_at)}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>
      </aside>

      {/* O'ng panel: xabarlar */}
      <section
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          activeId ? "flex" : "hidden sm:flex"
        )}
      >
        {active ? (
          <>
            {/* Sarlavha */}
            <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
              <button
                onClick={() => router.push("/chat")}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 sm:hidden"
                aria-label="Orqaga"
              >
                ←
              </button>
              <Link
                href={`/profile/${active.partner.id}`}
                className="flex items-center gap-3"
              >
                <Image
                  src={
                    active.partner.avatar_url ||
                    avatarFallback(active.partner.full_name)
                  }
                  alt={active.partner.full_name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                  unoptimized
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {active.partner.full_name}
                  </p>
                  <p className="text-xs text-gray-400">Profilni ko&apos;rish</p>
                </div>
              </Link>
              <div className="ml-auto">
                <MatchBadge score={matchScore} showLabel />
              </div>
            </div>

            {/* Xabarlar oqimi */}
            <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50/50 p-4">
              {messages.length === 0 && (
                <p className="mt-8 text-center text-sm text-gray-400">
                  Suhbatni boshlang — birinchi xabarni yuboring 👋
                </p>
              )}
              {messages.map((m) => (
                <MessageRow
                  key={m.id}
                  message={m}
                  mine={m.sender_id === meId}
                  aggs={reactions[m.id] ?? []}
                  onReact={react}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Xabar yozish */}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-1.5 border-t border-gray-100 p-3"
            >
              {/* Rasm/video biriktirish (galereya/fayl) */}
              <button
                type="button"
                onClick={() => mediaRef.current?.click()}
                disabled={uploadingMedia}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                title="Rasm yoki video yuborish"
              >
                {uploadingMedia ? "⏳" : "📎"}
              </button>
              <input
                ref={mediaRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaPick}
                className="hidden"
              />
              <button
                type="button"
                onClick={shareVideoLink}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                title="Video havolasini ulashish"
              >
                🎬
              </button>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Xabar yozing..."
                className="input flex-1"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="btn-primary px-4"
              >
                Yuborish
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <span className="text-4xl">💬</span>
            <p className="font-medium text-gray-700">Suhbat tanlang</p>
            <p className="text-sm text-gray-500">
              Yoki Kashf etish sahifasidan yangi hamkor toping.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

/** Bitta xabar qatori — pufakcha, reaksiya tugmasi va reaksiya chiplari */
function MessageRow({
  message,
  mine,
  aggs,
  onReact,
}: {
  message: Message;
  mine: boolean;
  aggs: ReactionAgg[];
  onReact: (messageId: string, emoji: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const trigger = (
    <div className="relative self-center">
      <button
        onClick={() => setPickerOpen((o) => !o)}
        className="rounded-full p-1 text-gray-300 opacity-0 transition hover:bg-gray-100 hover:text-gray-500 group-hover:opacity-100"
        aria-label="Reaksiya"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" strokeLinecap="round" />
        </svg>
      </button>
      {pickerOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setPickerOpen(false)} />
          <div
            className={cn(
              "absolute bottom-8 z-20 flex gap-1 rounded-full border border-gray-100 bg-white p-1 shadow-card-hover",
              mine ? "right-0" : "left-0"
            )}
          >
            {REACTION_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => {
                  onReact(message.id, e);
                  setPickerOpen(false);
                }}
                className="rounded-full px-1.5 text-lg transition hover:scale-125"
              >
                {e}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={cn("group flex", mine ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[80%] flex-col", mine ? "items-end" : "items-start")}>
        <div className="flex items-center gap-1">
          {mine && trigger}
          <div
            className={cn(
              "rounded-2xl px-4 py-2 text-sm",
              mine
                ? "rounded-br-sm bg-brand text-white"
                : "rounded-bl-sm bg-white text-gray-800 shadow-sm"
            )}
          >
            {renderMessageContent(message.content)}
            <span
              className={cn(
                "mt-1 block text-[10px]",
                mine ? "text-brand-100" : "text-gray-400"
              )}
            >
              {formatTime(message.created_at)}
            </span>
          </div>
          {!mine && trigger}
        </div>

        {aggs.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {aggs.map((a) => (
              <button
                key={a.emoji}
                onClick={() => onReact(message.id, a.emoji)}
                className={cn(
                  "flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition",
                  a.mine
                    ? "border-brand bg-brand-50 text-brand-700"
                    : "border-gray-200 bg-white text-gray-600"
                )}
              >
                <span>{a.emoji}</span>
                {a.count > 1 && <span>{a.count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Xabar matnini media (rasm/video) yoki matn sifatida ko'rsatish */
function renderMessageContent(content: string) {
  const url = content.trim();
  const isSingleUrl = /^https?:\/\/\S+$/.test(url);

  if (isSingleUrl) {
    if (/\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(url)) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="rasm"
            className="max-h-60 w-full rounded-lg object-cover"
          />
        </a>
      );
    }
    if (/\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url)) {
      return (
        <video
          src={url}
          controls
          className="max-h-60 w-full rounded-lg"
          preload="metadata"
        />
      );
    }
    const yt = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
    );
    if (yt) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`}
            alt="YouTube video"
            className="max-h-48 w-full object-cover"
          />
          <span className="mt-1 block text-xs underline">▶ Videoni ochish</span>
        </a>
      );
    }
  }

  return (
    <p className="whitespace-pre-wrap break-words">{linkify(content)}</p>
  );
}

/** Matndagi havolalarni bosiladigan link qilish */
function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
