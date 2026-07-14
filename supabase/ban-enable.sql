-- ============================================================
-- ZIKRA — Bloklash (ban) ustunlarini yoqish + TEST
-- Supabase -> SQL Editor'da ishga tushiring. IDEMPOTENT.
-- ============================================================

-- 1) Kerakli ustunlar (mavjud bo'lsa — teginmaydi)
alter table public.profiles
  add column if not exists is_banned boolean not null default false;
alter table public.profiles
  add column if not exists ban_reason text;
alter table public.profiles
  add column if not exists banned_until timestamptz;   -- null = doimiy blok

create index if not exists idx_profiles_is_banned on public.profiles (is_banned);

-- Middleware ikkalasini ham tekshiradi: is_banned = true YOKI status = 'banned'.

-- ============================================================
-- 2) TEST
-- ------------------------------------------------------------
-- Bloklash (o'z id'ingizni qo'ying):
--   update public.profiles
--   set is_banned = true, ban_reason = 'Test: qoidabuzarlik uchun bloklandingiz'
--   where id = (select id from auth.users where email = 'SIZNING@email.com');
--
-- Blokdan chiqarish:
--   update public.profiles
--   set is_banned = false, ban_reason = null, banned_until = null
--   where id = (select id from auth.users where email = 'SIZNING@email.com');
-- ============================================================
