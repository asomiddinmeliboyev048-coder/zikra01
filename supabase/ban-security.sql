-- ============================================================
-- ZIKRA — Bloklash ustunlarini himoyalash (XAVFSIZLIK)
-- ============================================================
-- Bu skriptni Zikra ilovasi ishlatadigan Supabase loyihasining SQL Editor'ida
-- ishga tushiring. IDEMPOTENT (qayta ishga tushirsa xato bermaydi).
--
-- MUAMMO:
--   `profiles_update_own` RLS siyosati foydalanuvchiga o'z profilining ISTALGAN
--   ustunini yangilashga ruxsat beradi. Ya'ni bloklangan foydalanuvchi brauzer
--   konsoli orqali:
--       supabase.from('profiles').update({ status: 'active', banned_until: null })
--   deb o'zini BLOKDAN CHIQARIB OLISHI mumkin edi.
--
-- YECHIM:
--   BEFORE UPDATE triggeri — agar o'zgartirayotgan shaxs admin bo'lmasa,
--   bloklash ustunlari (status, banned_until, ban_reason) eski qiymatga
--   qaytariladi. Shunda faqat admin panel ularni o'zgartira oladi.
--
-- ESLATMA: `public.is_admin()` funksiyasi admin-schema.sql'da aniqlangan
--   (admin panel o'rnatilganda). Shu funksiyaga tayanadi.
-- ============================================================

-- ------------------------------------------------------------
-- 0) Ustunlar mavjudligini kafolatlash (agar admin migratsiyalari
--    to'liq ishlatilmagan bo'lsa ham ishlashi uchun — himoya chorasi)
-- ------------------------------------------------------------
alter table public.profiles add column if not exists status text not null default 'active'
  check (status in ('active', 'banned', 'under_review'));
alter table public.profiles add column if not exists banned_until timestamptz;
alter table public.profiles add column if not exists ban_reason text;
alter table public.profiles add column if not exists last_ip text;
alter table public.profiles add column if not exists last_device text;
alter table public.profiles add column if not exists last_user_agent text;
alter table public.profiles add column if not exists last_login_at timestamptz;

-- Blok holatini tez tekshirish uchun indeks
create index if not exists idx_profiles_status on public.profiles (status);

-- ------------------------------------------------------------
-- 1) Bloklash ustunlarini himoyalovchi trigger
-- ------------------------------------------------------------
create or replace function public.protect_ban_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Faqat admin (admin_users ro'yxatidagi email) bloklash ustunlarini
  -- o'zgartira oladi. Boshqa hollarda eski qiymatlar saqlab qolinadi.
  if not coalesce(public.is_admin(), false) then
    new.status       := old.status;
    new.banned_until := old.banned_until;
    new.ban_reason   := old.ban_reason;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_ban_columns on public.profiles;
create trigger trg_protect_ban_columns
  before update on public.profiles
  for each row execute function public.protect_ban_columns();

-- ============================================================
-- TUGADI
-- ============================================================
