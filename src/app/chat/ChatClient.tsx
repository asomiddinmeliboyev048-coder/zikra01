"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAction } from "@/app/actions/chat";
import { avatarFallback, formatTime, timeAgo, cn } from "@/lib/utils";
import MatchBadge from "@/components/MatchBadge";
import type { Message } from "@/lib/types";

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
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.partner.id === activeId) ?? null;

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [active]);

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
              {messages.map((m) => {
                const mine = m.sender_id === meId;
                return (
                  <div
                    key={m.id}
                    className={cn("flex", mine ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                        mine
                          ? "rounded-br-sm bg-brand text-white"
                          : "rounded-bl-sm bg-white text-gray-800 shadow-sm"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {linkify(m.content)}
                      </p>
                      <span
                        className={cn(
                          "mt-1 block text-[10px]",
                          mine ? "text-brand-100" : "text-gray-400"
                        )}
                      >
                        {formatTime(m.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Xabar yozish */}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 border-t border-gray-100 p-3"
            >
              <button
                type="button"
                onClick={shareVideoLink}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                title="Video dars havolasini ulashish"
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
