// ============================================================
// Zikra — URL yordamchilari
// Tashqi havolalarni xavfsiz normalizatsiya qilish uchun.
// (Reklama "Batafsil" tugmasi 404 muammosini oldini oladi)
// ============================================================

/**
 * URL ni normalizatsiya qiladi:
 *  - bo'sh joylarni tozalaydi
 *  - protokol (http/https) bo'lmasa, "https://" qo'shadi
 *
 * Sabab: agar havola "google.com" ko'rinishida saqlangan bo'lsa,
 * <a href="google.com"> uni ICHKI (nisbiy) manzil deb hisoblab, joriy
 * sahifaga nisbatan ochadi (masalan /videos/google.com) va 404 beradi.
 * Protokol qo'shilsa, u to'g'ri tashqi havola sifatida ochiladi.
 *
 * @returns normalizatsiya qilingan URL, yoki bo'sh bo'lsa null
 */
export function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Maxsus protokollar o'zgarishsiz qoladi
  if (/^(mailto:|tel:)/i.test(trimmed)) return trimmed;

  // Protokol allaqachon bor bo'lsa — o'zgartirmaymiz
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // "//example.com" ko'rinishi -> https qo'shamiz
  if (trimmed.startsWith("//")) return `https:${trimmed}`;

  // Aks holda tashqi havola deb hisoblab https:// qo'shamiz
  return `https://${trimmed}`;
}
