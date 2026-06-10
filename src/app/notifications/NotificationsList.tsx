"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { markAllReadAction, markReadAction } from "@/app/actions/notifications";
import { timeAgo, cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/lib/types";

const ICON: Record<NotificationType, string> = {
  message: "💬",
  rating: "⭐",
  badge: "🏅",
  streak: "🔥",
  match: "🤝",
};

export default function NotificationsList({
  userId,
  initial,
}: {
  userId: string;
  initial: AppNotification[];
}) {
  const [items, setItems] = useState<AppNotification[]>(initial);

  // Realtime — yangi bildirishnomalar
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notif:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setItems((prev) => [payload.new as AppNotification, ...prev]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const unread = items.filter((n) => !n.is_read).length;

  async function handleMarkAll() {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await markAllReadAction();
  }

  async function handleRead(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await markReadAction(id);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bildirishnomalar</h1>
          {unread > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {unread} ta o&apos;qilmagan
            </p>
          )}
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAll} className="btn-outline text-sm">
            Hammasini o&apos;qildim
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-16 text-center">
          <span className="text-4xl">🔔</span>
          <p className="font-medium text-gray-700">Bildirishnomalar yo&apos;q</p>
          <p className="text-sm text-gray-500">
            Yangi xabar, baho yoki nishon olganingizda shu yerda ko&apos;rinadi.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const content = (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 transition",
                  n.is_read
                    ? "border-gray-100 bg-white"
                    : "border-brand-100 bg-brand-50/50"
                )}
              >
                <span className="text-xl">{ICON[n.type] ?? "🔔"}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{n.message}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {timeAgo(n.created_at)}
                  </p>
                </div>
                {!n.is_read && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
                )}
              </div>
            );

            return (
              <li key={n.id} onClick={() => !n.is_read && handleRead(n.id)}>
                {n.link ? (
                  <Link href={n.link}>{content}</Link>
                ) : (
                  <div className="cursor-pointer">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
