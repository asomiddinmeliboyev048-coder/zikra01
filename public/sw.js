// Zikra — service worker v5 (lahzali yuklanish uchun optimallashtirilgan)
//
// STRATEGIYALAR (har xil resurs — har xil yondashuv):
//
//  1) /_next/static/* va shriftlar  → KESH-BIRINCHI (cache-first)
//     Bu fayllar o'zgarmas (har build'da nomi/hash o'zgaradi), shuning uchun
//     keshdan darhol beriladi → yuklanish ~0 sekund.
//
//  2) Rasm / ikonka / avatar / thumbnail → STALE-WHILE-REVALIDATE
//     Keshdagi nusxa DARHOL ko'rsatiladi (sekundning ulushi), orqa fonda
//     yangisi yuklanib, kesh yangilanadi. Foydalanuvchi kutmaydi.
//
//  3) HTML sahifalar (navigatsiya) → TARMOQ-BIRINCHI (network-first)
//     Yangi deploy DARHOL ko'rinadi (sayt eski dizaynda qotib qolmaydi).
//     Faqat offline bo'lgandagina keshdan / '/' dan beriladi.
//
//  MUHIM: kesh nomi (v5, v6...) o'zgarganda eski kesh avtomatik tozalanadi.

const STATIC_CACHE = "zikra-static-v5";
const IMAGE_CACHE = "zikra-img-v5";
const PAGE_CACHE = "zikra-pages-v5";
const KEEP = [STATIC_CACHE, IMAGE_CACHE, PAGE_CACHE];

// Offline uchun boshlang'ich sahifalar
const CORE = ["/", "/discovery", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.addAll(CORE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ---- Strategiya yordamchilari ----

// KESH-BIRINCHI: keshda bo'lsa darhol, aks holda tarmoqdan olib keshlaymiz.
function cacheFirst(request, cacheName) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((res) => {
      if (res && (res.status === 200 || res.type === "opaque")) {
        const clone = res.clone();
        caches.open(cacheName).then((c) => c.put(request, clone)).catch(() => {});
      }
      return res;
    });
  });
}

// STALE-WHILE-REVALIDATE: keshdan darhol qaytaramiz, parallel ravishda
// tarmoqdan yangilab keshni yangilaymiz.
function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && (res.status === 200 || res.type === "opaque")) {
            cache.put(request, res.clone()).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      // Kesh bo'lsa darhol, bo'lmasa tarmoqni kutamiz.
      return cached || network;
    })
  );
}

// TARMOQ-BIRINCHI: avval tarmoqdan (eng yangi), offline bo'lsa keshdan.
function networkFirst(request, cacheName) {
  return fetch(request)
    .then((res) => {
      if (res && res.status === 200 && res.type === "basic") {
        const clone = res.clone();
        caches.open(cacheName).then((c) => c.put(request, clone)).catch(() => {});
      }
      return res;
    })
    .catch(() => caches.match(request).then((r) => r || caches.match("/")));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // API / auth / server action'lar — hech qachon keshlanmaydi (real-time, dinamik).
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    return;
  }

  // 1) O'zgarmas statik fayllar (Next build chunklari) + shriftlar → kesh-birinchi
  if (url.pathname.startsWith("/_next/static/") || request.destination === "font") {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 2) Rasm / ikonka / avatar / thumbnail → stale-while-revalidate
  const isImage =
    request.destination === "image" ||
    /\.(png|jpe?g|gif|webp|avif|svg|ico)(\?.*)?$/i.test(url.pathname);
  if (isImage) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // 3) HTML sahifalar (navigatsiya) → tarmoq-birinchi (yangi deploy darhol)
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  // 4) Qolgani (masalan RSC ma'lumot oqimi) → tarmoq, offline bo'lsa keshdan.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches.open(PAGE_CACHE).then((c) => c.put(request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});
