// Zikra — oddiy service worker (offline uchun asosiy keshlash)
const CACHE = "zikra-v1";
const CORE = ["/", "/discovery", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Navigatsiya: tarmoq-birinchi, offline bo'lsa keshdan
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Statik: keshdan, bo'lmasa tarmoqdan
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
