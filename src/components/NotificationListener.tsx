"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Toast {
  id: string;
  message: string;
}

/**
 * Joriy foydalanuvchi uchun yangi bildirishnomalarni (xabar, baho, nishon,
 * admin xabari) real-time kuzatadi. Yangi bildirishnoma kelganda:
 *   - qisqa tovush (biq) chaladi
 *   - ekranda toast ko'rsatadi
 *   - navbar hisoblagichini yangilaydi
 */
export default function NotificationListener({ userId }: { userId: string }) {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  function playBeep() {
    try {
      if (!audioCtxRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      // Ikki notali yumshoq "ding" tovush
      const now = ctx.currentTime;
      [880, 1175].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = now + i * 0.12;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.26);
      });
    } catch {
      // tovush qo'llab-quvvatlanmasa — jim
    }
  }

  function showToast(message: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notif-listen:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as { message: string; link?: string | null };
          playBeep();
          showToast(n.message);
          router.refresh();
          // OS bildirishnomasi — sahifa fon'da/yopiq-emas bo'lsa ko'rsatamiz
          // (ilovadan chiqib ketganda ham xabar ko'rinadi).
          if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted" &&
            document.visibilityState !== "visible"
          ) {
            try {
              const notif = new Notification("Zikra", {
                body: n.message,
                icon: "/icon.svg",
                tag: "zikra-notif",
              });
              notif.onclick = () => {
                window.focus();
                if (n.link) window.location.href = n.link;
                notif.close();
              };
            } catch {
              /* ignore */
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Brauzer bildirishnomasi uchun ruxsat so'rash (bir marta)
  useEffect(() => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-[60] flex flex-col gap-2 sm:bottom-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex max-w-xs animate-fade-in items-start gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-card-hover"
        >
          <span className="text-lg">🔔</span>
          <p className="text-sm text-gray-700">{t.message}</p>
        </div>
      ))}
    </div>
  );
}
