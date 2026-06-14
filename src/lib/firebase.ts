"use client";

// ============================================================
// Zikra — Firebase Cloud Messaging (FCM) klient yordamchisi
// Hammasi env o'zgaruvchilari mavjud bo'lgandagina ishlaydi (guard).
// Firebase sozlanmagan bo'lsa — hech narsa qilmaydi, ilova buzilmaydi.
// ============================================================

import type { Messaging } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/** Firebase to'liq sozlanganmi? */
export function firebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId &&
      VAPID_KEY
  );
}

/** Messaging klientini olish (qo'llab-quvvatlanmasa yoki sozlanmasa null) */
export async function getMessagingClient(): Promise<Messaging | null> {
  if (!firebaseConfigured()) return null;
  if (typeof window === "undefined") return null;

  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const { getMessaging, isSupported } = await import("firebase/messaging");

  if (!(await isSupported())) return null;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getMessaging(app);
}
