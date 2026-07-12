"use client";

import NotificationListener from "@/components/NotificationListener";
import CallProvider from "@/components/call/CallProvider";
import PushManager from "@/components/PushManager";

/**
 * Ilovaning fon xizmatlari — KO'RINMAYDIGAN, lekin har doim ishlab turishi
 * kerak bo'lgan qismlar:
 *   - NotificationListener: real-time bildirishnoma/toast
 *   - CallProvider: kiruvchi/chiquvchi video-audio qo'ng'iroqlar (chat'dagi
 *     qo'ng'iroq tugmalari shu provider'ga window-event yuboradi)
 *   - PushManager: push obunasi
 *
 * Bu xizmatlar `Navbar` (tepa menyu) ICHIDA emas, alohida ajratilgan.
 * Shu sababli chat suhbat oynasi to'liq ekran (menyusiz) bo'lganda ham
 * qo'ng'iroq va bildirishnomalar ishlashda davom etadi.
 */
export default function AppServices({ userId }: { userId: string }) {
  return (
    <>
      <NotificationListener userId={userId} />
      <CallProvider userId={userId} />
      <PushManager userId={userId} />
    </>
  );
}
