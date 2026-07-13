"use client";

import { useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import NotificationListener from "@/components/NotificationListener";
import SupportWidget from "@/components/SupportWidget";
import CallProvider from "@/components/call/CallProvider";
import PushManager from "@/components/PushManager";
import CreateMenu from "@/components/CreateMenu";
import { touchStreakAction } from "@/app/actions/streak";

/**
 * Viewport'ga nisbatan fixed turishi kerak bo'lgan widgetlar.
 * MUHIM: bular `backdrop-blur`li header ICHIDA bo'lmasligi kerak —
 * aks holda CSS containing-block qoidasi tufayli fixed pozitsiya buziladi
 * (support oynasi ochilmaydi, bottom-nav noto'g'ri joyda turadi).
 */
export default function FixedWidgets({
  userId,
  unread,
}: {
  userId: string;
  unread: number;
}) {
  // Kunlik faollik (streak) — kuniga BIR MARTA, klient tomonda (sahifa
  // yuklanishini bloklamaydi). localStorage bilan takrorlanmasligi ta'minlanadi.
  useEffect(() => {
    try {
      const key = `zikra-streak-${userId}`;
      const today = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem(key) === today) return;
      localStorage.setItem(key, today);
      touchStreakAction().catch(() => {});
    } catch {
      /* localStorage mavjud bo'lmasa e'tiborsiz */
    }
  }, [userId]);

  return (
    <>
      <NotificationListener userId={userId} />
      <SupportWidget userId={userId} />
      <CallProvider userId={userId} />
      <PushManager userId={userId} />
      <CreateMenu />
      <BottomNav profileId={userId} unread={unread} />
    </>
  );
}
