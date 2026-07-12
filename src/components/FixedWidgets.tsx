"use client";

import BottomNav from "@/components/BottomNav";
import SupportWidget from "@/components/SupportWidget";
import AppServices from "@/components/AppServices";

/**
 * Viewport'ga nisbatan fixed turishi kerak bo'lgan widgetlar + fon xizmatlari.
 * MUHIM: bular `backdrop-blur`li header ICHIDA bo'lmasligi kerak —
 * aks holda CSS containing-block qoidasi tufayli fixed pozitsiya buziladi
 * (support oynasi ochilmaydi, bottom-nav noto'g'ri joyda turadi).
 *
 * Fon xizmatlari (qo'ng'iroq, bildirishnoma, push) `AppServices`ga ajratilgan —
 * shunda chat suhbatida menyusiz (to'liq ekran) rejimda ham ular yashaydi.
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
      <AppServices userId={userId} />
      <SupportWidget userId={userId} />
      <BottomNav profileId={userId} unread={unread} />
    </>
  );
}
