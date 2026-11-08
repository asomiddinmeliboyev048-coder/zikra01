// Zikra service worker — resilient offline and cache handling.
const STATIC_CACHE = "zikra-static-v6";
const IMAGE_CACHE = "zikra-img-v6";
const PAGE_CACHE = "zikra-pages-v6";
const KEEP = [STATIC_CACHE, IMAGE_CACHE, PAGE_CACHE];
const CORE = ["/", "/discovery", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE)
      .then((cache) => cache.addAll(CORE))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => !KEEP.includes(key)).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function offlineFallback(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const home = await caches.match("/");
  return home || Response.error();
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && (response.status === 200 || response.type === "opaque")) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  try {
    const response = await fetch(request);
    if (response && (response.status === 200 || response.type === "opaque")) {
      await cache.put(request, response.clone()).catch(() => undefined);
    }
    return cached || response;
  } catch {
    // Always return a valid Response; never resolve respondWith() with undefined.
    return cached || Response.error();
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    // Never cache redirects (e.g. Vercel SSO HTML returned for a manifest URL).
    if (response && !response.redirected && response.status === 200 && response.type === "basic") {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch {
    return offlineFallback(request);
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Let the browser handle cross-origin assets and requests directly.
  if (url.origin !== self.location.origin) return;

  // Never cache API/auth responses: they are user-specific and dynamic.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  if (url.pathname.startsWith("/_next/static/") || request.destination === "font") {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  const isImage = request.destination === "image" ||
    /\.(png|jpe?g|gif|webp|avif|svg|ico)(\?.*)?$/i.test(url.pathname);
  if (isImage) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  event.respondWith(
    fetch(request).catch(() => offlineFallback(request))
  );
});
