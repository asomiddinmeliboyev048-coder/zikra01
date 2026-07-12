// Zikra — service worker (offline uchun asosiy keshlash)
//
// MUHIM: kesh nomi o'zgarganda (v2, v3...) eski kesh AVTOMATIK tozalanadi
// (activate hodisasida). Shu tufayli yangi deploy'dan keyin foydalanuvchi
// ESKI (keshlangan) dizayn/logo o'rniga YANGISINI ko'radi.
const CACHE = "zikra-v3";
const CORE = ["/", "/discovery", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Next.js hash'langan statik fayllar (/_next/static/...) — o'zgarmas,
  // shuning uchun kesh-birinchi (tez). Har build'da nomi o'zgaradi.
  const isImmutable = url.pathname.startsWith("/_next/static/");

  if (isImmutable) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // Qolgan HAMMASI (sahifalar, CSS, icon.svg, rasmlar...) — TARMOQ-BIRINCHI.
  // Bu yangi deploy'ni darhol ko'rsatadi; offline bo'lsagina keshdan beradi.
  event.respondWith(
    fetch(request)
      .then((res) => {
        // Muvaffaqiyatli javobni keyingi offline holat uchun keshga yozamiz
        if (res && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(request).then((r) => r || caches.match("/"))
      )
  );
});
