// ============================================================
// Zikra — bloklash (ban) holatini aniqlash yordamchisi
// ============================================================
//
// Bu funksiya HAM middleware'da (har so'rovda, refresh'da), HAM /banned
// sahifasida ishlatiladi. Ikkalasi ham AYNAN bir xil mantiqqa amal qilishi
// SHART — aks holda biri "bloklangan", ikkinchisi "bloklanmagan" deb hisoblab,
// cheksiz redirect (loop) yuzaga keladi.
//
// Mustahkamlik uchun ikkala keng tarqalgan ustunni ham tekshiramiz:
//   - status === 'banned'   (loyihaning asosiy sxemasi)
//   - is_banned === true     (agar admin panel shu boolean ustundan foydalansa)
// Shuningdek banned_until muddatini hisobga olamiz:
//   - muddat kelajakda bo'lsa  -> bloklangan (vaqtinchalik blok davom etyapti)
//   - muddat o'tmishda bo'lsa   -> blok tugagan (avtomatik ochiladi)
//   - muddat yo'q (null) + flag -> doimiy blok

export interface BanFields {
  status?: string | null;
  is_banned?: boolean | null;
  banned_until?: string | null;
}

export function isUserBanned(profile: BanFields | null | undefined): boolean {
  if (!profile) return false;

  const now = Date.now();
  const until = profile.banned_until
    ? new Date(profile.banned_until).getTime()
    : null;

  const untilInFuture = until !== null && !Number.isNaN(until) && until > now;
  const untilInPast = until !== null && !Number.isNaN(until) && until <= now;

  // Admin qaysi ustundan foydalansa ham ushlanadi
  const flagged = profile.status === "banned" || profile.is_banned === true;

  // Kelajakdagi muddat = aniq bloklangan.
  // Flag bor + muddat o'tmagan (yoki muddat umuman yo'q) = bloklangan.
  return untilInFuture || (flagged && !untilInPast);
}
