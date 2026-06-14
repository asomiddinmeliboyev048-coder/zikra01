/* eslint-disable no-undef */
// ============================================================
// Zikra — Firebase Cloud Messaging Service Worker (background push)
// Konfiguratsiya ro'yxatdan o'tkazish vaqtida URL query orqali uzatiladi
// (PushManager.tsx) — shu sababli bu yerda maxfiy ma'lumot saqlanmaydi.
// ============================================================

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

const params = new URL(self.location).searchParams;
const config = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
};

// Faqat config mavjud bo'lsa ishga tushiramiz
if (config.projectId && config.appId && config.messagingSenderId) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  // Ilova fon'da/yopiq bo'lganda kelgan xabarlar
  messaging.onBackgroundMessage((payload) => {
    const title = (payload.notification && payload.notification.title) || "Zikra";
    const body = (payload.notification && payload.notification.body) || "";
    const link = (payload.data && payload.data.link) || "/";
    self.registration.showNotification(title, {
      body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { link },
    });
  });
}

// Bildirishnoma bosilganda tegishli sahifani ochish
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link =
    (event.notification.data && event.notification.data.link) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(link) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(link);
    })
  );
});
