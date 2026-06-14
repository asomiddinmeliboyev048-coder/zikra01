-- ============================================================
-- Zikra — Hisob PIN-kodi va oxirgi kirish vaqti
-- "Google Auth + Custom PIN Creation" oqimi uchun
-- ============================================================
-- Supabase SQL Editor'da yoki `supabase db push` orqali ishga tushiring.

-- 6 xonali PIN — HECH QACHON ochiq matn emas, SHA-256 hash sifatida saqlanadi.
alter table public.profiles
  add column if not exists pin_code text;

-- Foydalanuvchining oxirgi muvaffaqiyatli kirish vaqti
alter table public.profiles
  add column if not exists last_login timestamptz;

comment on column public.profiles.pin_code is
  '6 xonali hisob PIN-kodining SHA-256 hash''i (ochiq matn saqlanmaydi).';
comment on column public.profiles.last_login is
  'Foydalanuvchining oxirgi muvaffaqiyatli kirgan vaqti.';
