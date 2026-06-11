"use client";

import BottomNav from "@/components/BottomNav";
import NotificationListener from "@/components/NotificationListener";
import SupportWidget from "@/components/SupportWidget";

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
  return (
    <>
      <NotificationListener userId={userId} />
      <SupportWidget userId={userId} />
      <BottomNav profileId={userId} unread={unread} />
    </>
  );
}
