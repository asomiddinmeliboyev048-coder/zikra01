"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  sendMessageAction,
  editMessageAction,
  deleteMessageAction,
  clearConversationAction,
} from "@/app/actions/chat";
import { setReactionAction } from "@/app/actions/social";
import { saveItemAction, forwardMessageAction } from "@/app/actions/saved";
import { uploadChatMedia } from "@/lib/storage";
import { avatarFallback, formatTime, timeAgo, cn } from "@/lib/utils";
import MatchBadge from "@/components/MatchBadge";
import ChatComposer from "@/components/chat/ChatComposer";
import VoicePlayer from "@/components/chat/VoicePlayer";
import RoundVideoMessage from "@/components/chat/RoundVideoMessage";
import type { Message } from "@/lib/types";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface ReactionAgg {
  emoji: string;
  count: number;
  mine: boolean;
}

export interface Conversation {
  partner: { id: string; full_name: string; avatar_url: string | null; username?: string | null };
  conversation_id: string;
  last_message: string | null;
  last_at: string | null;
}

/** Qidiruv natijasidagi foydalanuvchi (yangi suhbat boshlash uchun) */
interface SearchProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  username: string | null;
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
  const [reactions, setReactions] = useState<Record<string, ReactionAgg[]>>({});
  // Qidiruv holati (suhbat va foydalanuvchi qidirish)
  const [query, setQuery] = useState("");
  const [userResults, setUserResults] = useState<SearchProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.partner.id === activeId) ?? null;

  // Qidiruvga mos mavjud suhbatlar (ism yoki @username bo'yicha)
  const q = query.trim().toLowerCase();
  const filteredConversations = q
    ? conversations.filter(
        (c) =>
          c.partner.full_name.toLowerCase().includes(q) ||
          (c.partner.username ?? "").toLowerCase().includes(q)
      )
    : conversations;

  // Foydalanuvchilarni Supabase'dan real-time qidirish (debounce bilan)
  useEffect(() => {
    const term = query.trim();
    if (term.length < 1) {
      setUserResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const supabase = createClient();
      const pattern = `%${term}%`;
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, username")
        .or(`username.ilike.${pattern},full_name.ilike.${pattern}`)
        .neq("id", meId)
        .limit(10);
      setUserResults((data as SearchProfile[]) ?? []);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query, meId]);

  // Mavjud suhbat hamkorlari — qidiruv natijasidan ularni ajratish uchun
  const partnerIdSet = new Set(conversations.map((c) => c.partner.id));
  const newUserResults = userResults.filter((u) => !partnerIdSet.has(u.id));

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

  const [forwardContent, setForwardContent] = useState<string | null>(null);

  // Suhbat tarixini tozalash uchun holat
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function saveMsg(content: string) {
    const res = await saveItemAction(content, "text");
    alert(res.error ? res.error : "📌 Saqlangan xabarlarga qo'shildi");
  }

  // Xabarni tahrirlash (optimistik)
  async function editMsg(messageId: string, newContent: string) {
    const text = newContent.trim();
    if (!text) return;
    const prev = messagesRef.current;
    setMessages((cur) =>
      cur.map((m) =>
        m.id === messageId
          ? { ...m, content: text, edited_at: new Date().toISOString() }
          : m
      )
    );
    const res = await editMessageAction(messageId, text);
    if (res.error) {
      setMessages(prev); // rollback
      alert(res.error);
    }
  }

  // Xabarni o'chirish (optimistik)
  async function deleteMsg(messageId: string) {
    const prev = messagesRef.current;
    setMessages((cur) => cur.filter((m) => m.id !== messageId));
    const res = await deleteMessageAction(messageId);
    if (res.error) {
      setMessages(prev); // rollback
      alert(res.error);
    }
  }

  // Butun suhbat tarixini o'chirish
  async function clearConversation() {
    if (!activeId || clearing) return;
    setClearing(true);
    const res = await clearConversationAction(activeId);
    setClearing(false);
    setClearOpen(false);
    setHeaderMenuOpen(false);
    if (res.error) {
      alert(res.error);
      return;
    }
    setMessages([]);
    // Suhbatlar ro'yxati serverda yangilanishi uchun sahifani yangilaymiz
    router.refresh();
  }

  // Nusxalash (Copy)
  async function copyMsg(content: string) {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      /* clipboard mavjud bo'lmasa — jimgina o'tkazamiz */
    }
  }

  async function doForward(content: string, toUserId: string) {
    const res = await forwardMessageAction(content, toUserId);
    setForwardContent(null);
    alert(res.error ? res.error : "Yuborildi ✓");
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
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${active.conversation_id}`,
        },
        (payload) => {
          const upd = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === upd.id ? upd : m)));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          // DELETE payload uchun conversation_id kerak — SQL'da REPLICA IDENTITY FULL o'rnatilgan
          filter: `conversation_id=eq.${active.conversation_id}`,
        },
        (payload) => {
          const oldMsg = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== oldMsg.id));
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

  // Matnli xabar yuborish
  async function sendText(content: string) {
    if (!activeId) return;
    const res = await sendMessageAction(activeId, content);
    if (res.error) alert(res.error);
    // Yangi xabar realtime orqali keladi
  }

  // Rasm/video fayl yuborish (composer'dagi skrepka orqali)
  async function pickMedia(file: File) {
    if (!activeId) return;
    try {
      const url = await uploadChatMedia(file);
      const res = await sendMessageAction(activeId, url);
      if (res.error) alert(res.error);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Yuklashda xatolik.");
    }
  }

  // Ovozli / yumaloq video xabar yuborish ("voice:<url>" yoki "circle:<url>")
  async function sendRecording(content: string) {
    if (!activeId) return;
    const res = await sendMessageAction(activeId, content);
    if (res.error) alert(res.error);
  }

  return (
    <div className="card flex w-full overflow-hidden rounded-none border-0 sm:rounded-2xl sm:border">
      {/* Chap panel: suhbatlar */}
      <aside
        className={cn(
          "w-full border-r border-gray-100 sm:w-72 sm:shrink-0",
          activeId ? "hidden sm:block" : "block"
        )}
      >
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
          <h2 className="mb-2 font-semibold text-gray-900">Suhbatlar</h2>
          {/* Qidiruv inputi — real-time filtr */}
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
              </svg>
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suhbat yoki foydalanuvchi qidirish..."
              className="input py-2 pl-9 pr-9 text-sm"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100"
                aria-label="Tozalash"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="max-h-[calc(100vh-14rem)] overflow-y-auto">
          {/* Saqlangan xabarlar — faqat qidiruv bo'sh bo'lganda yuqorida */}
          {!q && (
            <Link
              href="/saved"
              className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 transition hover:bg-gray-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-lg text-white">
                📌
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  Saqlangan xabarlar
                </p>
                <p className="truncate text-xs text-gray-500">Faqat siz ko&apos;rasiz</p>
              </div>
            </Link>
          )}

          {/* (a) Mavjud suhbatlar */}
          {filteredConversations.length > 0 && (
            <>
              {q && (
                <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Suhbatlar
                </p>
              )}
              {filteredConversations.map((c) => (
                <Link
                  key={c.partner.id}
                  href={`/chat?with=${c.partner.id}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50",
                    c.partner.id === activeId && "bg-brand-50"
                  )}
                >
                  <Image
                    src={c.partner.avatar_url || avatarFallback(c.partner.full_name)}
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
              ))}
            </>
          )}

          {/* (b) Yangi suhbat boshlash uchun foydalanuvchilar */}
          {q && newUserResults.length > 0 && (
            <>
              <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Yangi suhbat
              </p>
              {newUserResults.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50"
                >
                  <Image
                    src={u.avatar_url || avatarFallback(u.full_name)}
                    alt={u.full_name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                    unoptimized
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {u.full_name}
                    </p>
                    {u.username && (
                      <p className="truncate text-xs text-gray-500">@{u.username}</p>
                    )}
                  </div>
                  <Link
                    href={`/chat?with=${u.id}`}
                    className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600"
                  >
                    Xabar yozish
                  </Link>
                </div>
              ))}
            </>
          )}

          {/* Bo'sh holatlar */}
          {!q && conversations.length === 0 && (
            <p className="p-4 text-sm text-gray-400">
              Hali suhbatlar yo&apos;q. Yuqoridagi qidiruv orqali foydalanuvchi toping!
            </p>
          )}
          {q &&
            !searching &&
            filteredConversations.length === 0 &&
            newUserResults.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <span className="text-3xl">🔍</span>
                <p className="text-sm font-medium text-gray-600">Hech narsa topilmadi</p>
                <p className="text-xs text-gray-400">Boshqa nom yoki @username bilan qidiring.</p>
              </div>
            )}
          {q && searching && (
            <p className="px-4 py-4 text-center text-xs text-gray-400">Qidirilmoqda...</p>
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
              <div className="ml-auto flex items-center gap-1">
                {/* Video qo'ng'iroq */}
                <button
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("zikra:start-call", {
                        detail: {
                          calleeId: active.partner.id,
                          calleeName: active.partner.full_name,
                          calleeAvatar: active.partner.avatar_url,
                          callType: "video",
                        },
                      })
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-brand-50 hover:text-brand"
                  title="Video qo'ng'iroq"
                  aria-label="Video qo'ng'iroq"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m23 7-7 5 7 5V7z" strokeLinejoin="round" />
                    <rect x="1" y="5" width="15" height="14" rx="2" />
                  </svg>
                </button>
                {/* Ovozli qo'ng'iroq */}
                <button
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("zikra:start-call", {
                        detail: {
                          calleeId: active.partner.id,
                          calleeName: active.partner.full_name,
                          calleeAvatar: active.partner.avatar_url,
                          callType: "audio",
                        },
                      })
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-brand-50 hover:text-brand"
                  title="Ovozli qo'ng'iroq"
                  aria-label="Ovozli qo'ng'iroq"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" strokeLinejoin="round" />
                  </svg>
                </button>
                <MatchBadge score={matchScore} showLabel />

                {/* Suhbat menyusi (3 nuqta) — tarixni o'chirish */}
                <div className="relative">
                  <button
                    onClick={() => setHeaderMenuOpen((o) => !o)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"
                    aria-label="Suhbat menyusi"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="12" cy="19" r="2" />
                    </svg>
                  </button>
                  {headerMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setHeaderMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-11 z-30 w-52 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-card-hover">
                        <button
                          onClick={() => {
                            setHeaderMenuOpen(false);
                            setClearOpen(true);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Suhbatni o&apos;chirish
                        </button>
                      </div>
                    </>
                  )}
                </div>
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
                  onSave={saveMsg}
                  onForward={(c) => setForwardContent(c)}
                  onCopy={copyMsg}
                  onEdit={editMsg}
                  onDelete={deleteMsg}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Xabar yozish — Telegram uslubidagi panel */}
            <ChatComposer
              onSendText={sendText}
              onPickMedia={pickMedia}
              onSendRecording={sendRecording}
            />
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

      {/* Suhbatni o'chirish — tasdiqlash */}
      {clearOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !clearing && setClearOpen(false)}
          />
          <div className="relative w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900">
              Suhbatni o&apos;chirasizmi?
            </h3>
            <p className="mt-1.5 text-sm text-gray-500">
              {active?.partner.full_name} bilan bo&apos;lgan butun yozishmalar
              har ikki tomon uchun ham butunlay o&apos;chib ketadi.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setClearOpen(false)}
                disabled={clearing}
                className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={clearConversation}
                disabled={clearing}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {clearing ? "O'chirilmoqda..." : "O'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forward modal — suhbat tanlash */}
      {forwardContent !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-card-hover">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Kimga yuborish</h3>
              <button onClick={() => setForwardContent(null)} className="text-gray-400">✕</button>
            </div>
            {conversations.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">Suhbatlar yo&apos;q.</p>
            ) : (
              <ul className="max-h-80 space-y-1 overflow-y-auto">
                {conversations.map((c) => (
                  <li key={c.partner.id}>
                    <button
                      onClick={() => doForward(forwardContent, c.partner.id)}
                      className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
                    >
                      <Image
                        src={c.partner.avatar_url || avatarFallback(c.partner.full_name)}
                        alt=""
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full object-cover"
                        unoptimized
                      />
                      <span className="text-sm text-gray-800">{c.partner.full_name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Xabar matnli (tahrirlanadigan) turdami — ovoz/reel/media emas */
function isEditableText(content: string): boolean {
  const c = content.trim();
  return (
    !c.startsWith("voice:") &&
    !c.startsWith("reel:") &&
    !/^https?:\/\/\S+$/.test(c)
  );
}

/**
 * Bitta xabar qatori — Telegram uslubidagi uzoq bosish (long-press) / o'ng
 * tugma menyusi bilan: Reaksiya, Nusxalash, Tahrirlash (faqat matn),
 * Forward, Saqlash va O'chirish (faqat o'z xabari).
 */
function MessageRow({
  message,
  mine,
  aggs,
  onReact,
  onSave,
  onForward,
  onCopy,
  onEdit,
  onDelete,
}: {
  message: Message;
  mine: boolean;
  aggs: ReactionAgg[];
  onReact: (messageId: string, emoji: string) => void;
  onSave: (content: string) => void;
  onForward: (content: string) => void;
  onCopy: (content: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editable = mine && isEditableText(message.content);

  // Uzoq bosish (mobil) — 450ms ushlab turilsa menyu ochiladi
  const startPress = () => {
    pressTimer.current = setTimeout(() => setMenuOpen(true), 450);
  };
  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const closeMenu = () => setMenuOpen(false);

  const startEdit = () => {
    setEditText(message.content);
    setEditing(true);
    setMenuOpen(false);
  };

  const submitEdit = () => {
    const t = editText.trim();
    if (t && t !== message.content) onEdit(message.id, t);
    setEditing(false);
  };

  return (
    <div className={cn("group flex", mine ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[80%] flex-col", mine ? "items-end" : "items-start")}>
        {editing ? (
          /* --- Inline tahrirlash rejimi --- */
          <div className="flex w-full min-w-[220px] flex-col gap-2 rounded-2xl bg-white p-2 shadow-sm">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              autoFocus
              className="w-full resize-none rounded-lg bg-gray-50 p-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-brand/30"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitEdit();
                }
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg px-3 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100"
              >
                Bekor
              </button>
              <button
                onClick={submitEdit}
                className="rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-600"
              >
                Saqlash
              </button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "relative cursor-default select-none rounded-2xl px-4 py-2 text-sm",
              mine
                ? "rounded-br-sm bg-brand text-white"
                : "rounded-bl-sm bg-white text-gray-800 shadow-sm"
            )}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenuOpen(true);
            }}
            onTouchStart={startPress}
            onTouchEnd={cancelPress}
            onTouchMove={cancelPress}
          >
            {renderMessageContent(message.content, mine)}
            <span
              className={cn(
                "mt-1 flex items-center gap-1 text-[10px]",
                mine ? "text-brand-100" : "text-gray-400"
              )}
            >
              {formatTime(message.created_at)}
              {message.edited_at && <span>· tahrirlangan</span>}
            </span>
          </div>
        )}

        {/* Reaksiya chiplari */}
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

      {/* --- Kontekst menyu (long-press / o'ng tugma) --- */}
      {menuOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6" onClick={closeMenu}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Reaksiya emojilari */}
            <div className="flex justify-around border-b border-gray-100 px-2 py-3">
              {REACTION_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    onReact(message.id, e);
                    closeMenu();
                  }}
                  className="text-2xl transition hover:scale-125"
                >
                  {e}
                </button>
              ))}
            </div>

            {/* Amallar */}
            <MenuItem
              icon="📋"
              label="Nusxalash"
              onClick={() => {
                onCopy(message.content);
                closeMenu();
              }}
            />
            {editable && (
              <MenuItem icon="✏️" label="Tahrirlash" onClick={startEdit} />
            )}
            <MenuItem
              icon="↪️"
              label="Boshqa chatga yuborish"
              onClick={() => {
                onForward(message.content);
                closeMenu();
              }}
            />
            <MenuItem
              icon="📌"
              label="Saqlash"
              onClick={() => {
                onSave(message.content);
                closeMenu();
              }}
            />
            {mine && (
              <MenuItem
                icon="🗑"
                label="O'chirish"
                danger
                onClick={() => {
                  onDelete(message.id);
                  closeMenu();
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Kontekst menyu elementi */
function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-50",
        danger ? "text-red-600 hover:bg-red-50" : "text-gray-700"
      )}
    >
      <span className="text-base">{icon}</span>
      {label}
    </button>
  );
}

/** Xabar matnini media (rasm/video/ovoz) yoki matn sifatida ko'rsatish */
function renderMessageContent(content: string, mine: boolean) {
  const trimmed = content.trim();

  // Ovozli xabar — "voice:<url>" konventsiyasi
  if (trimmed.startsWith("voice:")) {
    const src = trimmed.slice("voice:".length);
    return <VoicePlayer src={src} mine={mine} />;
  }

  // Yumaloq video xabar — "circle:<url>" konventsiyasi
  if (trimmed.startsWith("circle:")) {
    const src = trimmed.slice("circle:".length);
    return <RoundVideoMessage src={src} />;
  }

  // Reel — "reel:<video_url>" konventsiyasi: chatda to'g'ridan-to'g'ri o'ynaydi
  if (trimmed.startsWith("reel:")) {
    const src = trimmed.slice("reel:".length);
    return (
      <div className="w-56">
        <div className="mb-1 flex items-center gap-1 text-xs font-semibold opacity-80">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Reel
        </div>
        <video
          src={src}
          controls
          playsInline
          preload="metadata"
          className="aspect-[9/16] w-full rounded-lg bg-black object-cover"
        />
      </div>
    );
  }

  const url = trimmed;
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
