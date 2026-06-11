"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendSupportMessageAction } from "@/app/actions/support";
import { formatTime, cn } from "@/lib/utils";

interface SupportMessage {
  id: string;
  sender_role: "user" | "admin";
  message: string;
  created_at: string;
}

export default function SupportWidget({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("support_messages")
      .select("id, sender_role, message, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    setMessages((data as SupportMessage[]) ?? []);
  }

  useEffect(() => {
    load();
    const supabase = createClient();
    const channel = supabase
      .channel(`support:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const m = payload.new as SupportMessage;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m]
          );
          if (m.sender_role === "admin" && !open) setHasUnread(true);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (open) {
      setHasUnread(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setSending(true);
    setText("");
    const res = await sendSupportMessageAction(t);
    setSending(false);
    if (res.error) {
      alert(res.error);
      setText(t);
    }
  }

  return (
    <>
      {/* Floating tugma */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-20 right-4 z-[55] flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-card-hover transition hover:bg-brand-600 sm:bottom-6"
        aria-label="Qo'llab-quvvatlash"
      >
        {open ? (
          <span className="text-2xl leading-none">✕</span>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinejoin="round" />
            <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 2.5M12 16h.01" strokeLinecap="round" />
          </svg>
        )}
        {hasUnread && !open && (
          <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-accent" />
        )}
      </button>

      {/* Chat oynasi */}
      {open && (
        <div className="fixed bottom-36 right-4 z-[55] flex h-[460px] w-[90vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card-hover dark:border-gray-800 dark:bg-gray-900 sm:bottom-24">
          <div className="bg-brand px-4 py-3 text-white">
            <p className="font-semibold">Zikra Qo&apos;llab-quvvatlash</p>
            <p className="text-xs text-brand-100">Odatda tez javob beramiz</p>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50/60 p-3 dark:bg-gray-950/40">
            <div className="rounded-xl rounded-bl-sm bg-white p-2.5 text-sm text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-200">
              👋 Salom! Savolingizni yozing — jamoamiz tez orada javob beradi.
            </div>
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn("flex", m.sender_role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    m.sender_role === "user"
                      ? "rounded-br-sm bg-brand text-white"
                      : "rounded-bl-sm bg-white text-gray-800 shadow-sm dark:bg-gray-800 dark:text-gray-200"
                  )}
                >
                  {m.sender_role === "admin" && (
                    <span className="mb-0.5 block text-[10px] font-semibold text-brand">Admin</span>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.message}</p>
                  <span className={cn("mt-0.5 block text-[10px]", m.sender_role === "user" ? "text-brand-100" : "text-gray-400")}>
                    {formatTime(m.created_at)}
                  </span>
                </div>
              </div>
            ))}
            {messages.length > 0 &&
              messages[messages.length - 1].sender_role === "user" && (
                <p className="text-center text-[11px] text-gray-400">
                  Xabaringiz qabul qilindi. Tez orada javob beramiz.
                </p>
              )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-gray-100 p-2 dark:border-gray-800">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Xabar yozing..."
              className="input flex-1"
            />
            <button type="submit" disabled={sending || !text.trim()} className="btn-primary px-4">
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
