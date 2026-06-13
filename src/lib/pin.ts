// ============================================================
// Zikra — PIN kod himoyasi yordamchilari
// PIN HECH QACHON oddiy matn ko'rinishida saqlanmaydi — faqat SHA-256 hash.
// ============================================================

export const PIN_HASH_KEY = "zikra_pin_hash";
export const PIN_ENABLED_KEY = "zikra_pin_enabled";
export const PIN_LENGTH_KEY = "zikra_pin_length";
export const PIN_LAST_ACTIVE_KEY = "zikra_pin_last_active";
export const PIN_SETUP_DISMISSED_KEY = "zikra_pin_setup_dismissed";

/** Fon (background) dan keyin qayta qulflash uchun vaqt — 30 daqiqa */
export const PIN_LOCK_TIMEOUT_MS = 30 * 60 * 1000;

/** Matnni SHA-256 orqali hash qilish (Web Crypto API) */
export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** PIN yoqilganmi? */
export function isPinEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    localStorage.getItem(PIN_ENABLED_KEY) === "1" &&
    !!localStorage.getItem(PIN_HASH_KEY)
  );
}

/** PIN uzunligi (4 yoki 6) */
export function getPinLength(): number {
  if (typeof window === "undefined") return 4;
  const n = Number(localStorage.getItem(PIN_LENGTH_KEY));
  return n === 6 ? 6 : 4;
}

/** Yangi PIN o'rnatish (hash qilib saqlaydi) */
export async function setPin(pin: string): Promise<void> {
  const hash = await sha256(pin);
  localStorage.setItem(PIN_HASH_KEY, hash);
  localStorage.setItem(PIN_ENABLED_KEY, "1");
  localStorage.setItem(PIN_LENGTH_KEY, String(pin.length));
  touchActive();
}

/** Kiritilgan PIN to'g'rimi? */
export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_HASH_KEY);
  if (!stored) return false;
  const hash = await sha256(pin);
  return hash === stored;
}

/** PIN ni butunlay o'chirish (PIN unutilganda yoki o'chirilganda) */
export function clearPin(): void {
  localStorage.removeItem(PIN_HASH_KEY);
  localStorage.removeItem(PIN_ENABLED_KEY);
  localStorage.removeItem(PIN_LENGTH_KEY);
  localStorage.removeItem(PIN_LAST_ACTIVE_KEY);
}

/** Oxirgi faollik vaqtini belgilash */
export function touchActive(): void {
  localStorage.setItem(PIN_LAST_ACTIVE_KEY, String(Date.now()));
}

/** Timeout (30 daqiqa) o'tganmi — qayta qulflash kerakmi? */
export function isExpired(): boolean {
  const last = Number(localStorage.getItem(PIN_LAST_ACTIVE_KEY));
  if (!last) return true;
  return Date.now() - last > PIN_LOCK_TIMEOUT_MS;
}
