-- ============================================================
-- ZIKRA — Bloklash (ban) ustunlarini yoqish + TEST
-- Supabase -> SQL Editor'da ishga tushiring. IDEMPOTENT (qayta ishga tushsa
-- xato bermaydi).
-- ============================================================

-- 1) Kerakli ustunlarni qo'shamiz (agar mavjud bo'lsa — teginmaydi)
alter table public.profiles
  add column if not exists is_banned boolean not null default false;

alter table public.profiles
  add column if not exists ban_reason text;

alter table public.profiles
  add column if not exists banned_until timestamptz;   -- null = doimiy blok

-- (Loyihada "status" ustuni ham bo'lishi mumkin — middleware ikkalasini ham
--  tekshiradi: is_banned = true YOKI status = 'banned')

-- Tez tekshirish uchun indeks
create index if not exists idx_profiles_is_banned on public.profiles (is_banned);


-- ============================================================
-- 2) TEST — o'zingizni bloklab, qora ekran chiqishini tekshiring
-- ------------------------------------------------------------
-- Avval o'z user id'ingizni bilib oling (email bo'yicha):
--
--   select id, full_name from public.profiles
--   where id = (select id from auth.users where email = 'SIZNING@email.com');
--
-- Keyin o'zingizni bloklang (id'ni yuqoridagidan oling):
--
--   update public.profiles
--   set is_banned = true,
--       ban_reason = 'Test: qoidabuzarlik uchun bloklandingiz'
--   where id = 'SIZNING-USER-ID';
--
-- Endi saytga kiring -> qora ekran chiqishi kerak.
--
-- Blokdan chiqarish (test tugagach):
--
--   update public.profiles
--   set is_banned = false, ban_reason = null, banned_until = null
--   where id = 'SIZNING-USER-ID';
-- ============================================================
