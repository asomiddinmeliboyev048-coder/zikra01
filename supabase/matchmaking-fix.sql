-- ============================================================
-- ZIKRA — Matchmaking bildirishnomalari + eski havolalarni tuzatish
-- Supabase -> SQL Editor'da ishga tushiring. IDEMPOTENT (qayta ishga tushsa
-- xato bermaydi).
-- ============================================================

-- ------------------------------------------------------------
-- 1) NOTIFICATIONS uchun INSERT siyosati (RLS)
-- ------------------------------------------------------------
-- Muammo: `notifications` jadvalida faqat select_own / update_own siyosatlari
-- bor edi, INSERT siyosati YO'Q. Shu tufayli server action orqali (foydalanuvchi
-- kontekstida) matchmaking bildirishnomasini yozib bo'lmasdi.
--
-- Yechim: foydalanuvchi O'ZIGA (user_id = auth.uid()) bildirishnoma yarata
-- olsin. Bu xavfsiz — birovga spam yubora olmaydi (faqat o'ziga).
drop policy if exists "notifications_insert_self" on public.notifications;
create policy "notifications_insert_self" on public.notifications
  for insert with check (auth.uid() = user_id);


-- ------------------------------------------------------------
-- 2) ESKI BILDIRISHNOMA HAVOLALARINI TO'G'RILASH (404 fix)
-- ------------------------------------------------------------
-- Route papkamiz `/match/[skillId]` (BIRLIKDA). Eski havolalar `/matches/...`
-- (ko'plikda) yoki `/skills/...` bo'lgani uchun 404 berardi. Ularni yangi
-- `/match/...` formatiga o'tkazamiz.

update public.notifications
set link = replace(link, '/matches/', '/match/')
where link like '/matches/%';

update public.notifications
set link = replace(link, '/skills/', '/match/')
where link like '/skills/%';

-- Tekshirish (ixtiyoriy): tuzatilgandan keyin qolgan g'alati havolalar bormi?
--   select distinct link from public.notifications
--   where link like '/matches/%' or link like '/skills/%';
-- ============================================================
