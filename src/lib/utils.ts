// Umumiy yordamchi funksiyalar

/** Tailwind klasslarni shartli birlashtirish */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Ikki user id'dan barqaror conversation_id hosil qilish */
export function conversationId(a: string, b: string): string {
  return [a, b].sort().join("_");
}

/** Avatar yo'q bo'lsa ism harflaridan avatar URL */
export function avatarFallback(name: string): string {
  const initials = encodeURIComponent(name || "Zikra");
  return `https://ui-avatars.com/api/?name=${initials}&background=12A594&color=fff&bold=true`;
}

/** Soniyani "5:30" formatiga o'tkazish */
export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Sanani o'zbekcha nisbiy formatda ko'rsatish */
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diff < 60) return "hozirgina";
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} kun oldin`;

  return date.toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Vaqtni soat:daqiqa ko'rinishida */
export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** To'liq sana va vaqt */
export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("uz-UZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


/**
 * userAgent satridan brauzer va OS ni qisqa nomga aylantiradi.
 * Masalan: "Chrome · Windows". Kirish paytida last_device'ga yozish uchun.
 */
export function parseUserAgent(ua: string | null | undefined): string {
  if (!ua) return "Noma'lum qurilma";

  let browser = "Brauzer";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/opr\/|opera/i.test(ua)) browser = "Opera";
  else if (/firefox\//i.test(ua)) browser = "Firefox";
  else if (/samsungbrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/chrome\/|crios/i.test(ua)) browser = "Chrome";
  else if (/safari\//i.test(ua)) browser = "Safari";

  let os = "OS";
  if (/windows nt/i.test(ua)) os = "Windows";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/mac os x/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return `${browser} · ${os}`;
}

/** Katta sonlarni ixcham ko'rsatish: 1200 -> "1.2k", 1500000 -> "1.5M" */
export function formatCount(n: number | null | undefined): string {
  const v = n ?? 0;
  if (v < 1000) return String(v);
  if (v < 1_000_000) {
    const k = v / 1000;
    return `${k % 1 === 0 ? k : k.toFixed(1)}k`;
  }
  const m = v / 1_000_000;
  return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
}
