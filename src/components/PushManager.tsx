"use client";

import { useEffect } from "react";
import {
  firebaseConfig,
  firebaseConfigured,
  getMessagingClient,
  VAPID_KEY,
} from "@/lib/firebase";
import { savePushTokenAction } from "@/app/actions/push";

/**
 * PushManager — FCM push bildirishnomalarini ro'yxatdan o'tkazadi.
 *  - Service Worker (firebase-messaging-sw.js) ni alohida scope'da ro'yxatdan o'tkazadi
 *    (mavjud PWA sw.js bilan to'qnashmaydi).
 *  - FCM tokenini oladi va Supabase'ga (push_tokens) saqlaydi.
 *  - Ilova ochiq bo'lganda (foreground) kelgan xabarlarni ko'rsatadi.
 *
 * Firebase env sozlanmagan bo'lsa — butunlay no-op (hech narsa qilmaydi).
 */
export default function PushManager({ userId }: { userId: string }) {
  useEffect(() => {
    let unsub: (() => void) | undefined;

    (async () => {
      if (!firebaseConfigured()) return;
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator) || typeof Notification === "undefined") return;

      try {
        // SW'ni env config bilan (query orqali) alohida scope'da ro'yxatdan o'tkazamiz
        const params = new URLSearchParams({
          apiKey: firebaseConfig.apiKey ?? "",
          authDomain: firebaseConfig.authDomain ?? "",
          projectId: firebaseConfig.projectId ?? "",
          messagingSenderId: firebaseConfig.messagingSenderId ?? "",
          appId: firebaseConfig.appId ?? "",
        });
        const registration = await navigator.serviceWorker.register(
          `/firebase-messaging-sw.js?${params.toString()}`,
          { scope: "/firebase-cloud-messaging-push-scope" }
        );

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const messaging = await getMessagingClient();
        if (!messaging) return;

        const { getToken, onMessage } = await import("firebase/messaging");
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });
        if (token) await savePushTokenAction(token);

        // Foreground (ilova ochiq) xabarlar
        const stop = onMessage(messaging, (payload) => {
          const d = payload.data || {};
          // Qo'ng'iroq push'i — CallProvider o'zi ko'rsatadi, o'tkazib yuboramiz
          if (d.link && d.link.indexOf("call=1") !== -1) return;
          const title = d.title || payload.notification?.title || "Zikra";
          const body = d.body || payload.notification?.body || "";
          if (Notification.permission === "granted") {
            new Notification(title, { body, icon: "/icon.svg" });
          }
        });
        unsub = () => stop();
      } catch {
        // Push qo'llab-quvvatlanmasa yoki sozlanmasa — jim o'tkazib yuboramiz
      }
    })();

    return () => unsub?.();
  }, [userId]);

  return null;
}
