-- ============================================================
-- ZIKRA — Profil sharhlari (rating + izoh) yangilanishi
-- ============================================================
-- Foydalanuvchilar suhbatdan keyin bir-birining profiliga kirib
-- to'g'ridan-to'g'ri baho va izoh qoldira olishi uchun.
-- Ushbu skriptni Supabase SQL Editor'da ishga tushiring (schema.sql dan keyin).
-- ============================================================

-- Profil sharhi darsga bog'lanmagani uchun lesson_id ixtiyoriy bo'lsin
alter table public.ratings alter column lesson_id drop not null;

-- Bir foydalanuvchi bir kishiga faqat bitta profil sharhi qoldira oladi
create unique index if not exists uniq_profile_review
  on public.ratings (rater_id, rated_id)
  where lesson_id is null;

-- ============================================================
-- TUGADI
-- ============================================================
