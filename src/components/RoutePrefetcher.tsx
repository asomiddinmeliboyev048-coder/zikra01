"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Zikra — asosiy bo'limlarni OLDINDAN yuklovchi (prefetch).
 *
 * Foydalanuvchi hech narsa bosmasidan turib, brauzer bo'sh (idle) bo'lgan
 * paytda asosiy navigatsiya sahifalarining RSC/loading chegarasini fon rejimida
 * yuklab qo'yamiz. Natijada foydalanuvchi tugmani bosgan zahoti skeleton darhol
 * ko'rinadi va server render "issiq" (warm) bo'ladi — kutish sezilmaydi.
 *
 * `router.prefetch` <Link> ning avtomatik prefetch'ini to'ldiradi: ekranda
 * ko'rinmagan (masalan dropdown ichidagi yoki mobil menyudagi) havolalar ham
 * oldindan tayyorlanadi.
 */
const ROUTES = [
  "/discovery",
  "/videos",
  "/reels",
  "/chat",
  "/lessons",
  "/notifications",
  "/saved",
];

export default function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    const run = () => {
      for (const r of ROUTES) {
        try {
          router.prefetch(r);
        } catch {
          /* prefetch xatolari e'tiborsiz qoldiriladi */
        }
      }
    };

    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(run, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }

    const t = setTimeout(run, 1500);
    return () => clearTimeout(t);
  }, [router]);

  return null;
}
