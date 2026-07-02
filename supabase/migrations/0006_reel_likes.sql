-- ============================================================
-- ZIKRA — Reel like (yoqtirish) jadvali
-- ============================================================
-- ReelsPlayer'dagi like/unlike funksiyasi shu jadvalga tayanadi.
-- Ushbu skriptni Supabase SQL Editor'da ishga tushiring.
-- ============================================================

create table if not exists public.reel_likes (
  id         uuid primary key default gen_random_uuid(),
  reel_id    uuid not null references public.reels (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Bir foydalanuvchi bitta reelni faqat bir marta like qila oladi
  unique (reel_id, user_id)
);

create index if not exists idx_reel_likes_reel on public.reel_likes (reel_id);
create index if not exists idx_reel_likes_user on public.reel_likes (user_id);

comment on table public.reel_likes is
  'Reels (qisqa videolar) uchun like tizimi';

-- ------------------------------------------------------------
-- Row Level Security (RLS)
-- ------------------------------------------------------------
alter table public.reel_likes enable row level security;

-- Hamma like'larni o'qiy oladi (statistikani hisoblash uchun)
drop policy if exists "zikra_read_reel_likes" on public.reel_likes;
create policy "zikra_read_reel_likes" on public.reel_likes
  for select using (true);

-- Foydalanuvchi faqat O'ZI nomidan like qo'sha oladi
drop policy if exists "zikra_insert_own_reel_likes" on public.reel_likes;
create policy "zikra_insert_own_reel_likes" on public.reel_likes
  for insert to authenticated
  with check (auth.uid() = user_id);

-- Foydalanuvchi faqat O'ZINING like'ini olib tashlay oladi
drop policy if exists "zikra_delete_own_reel_likes" on public.reel_likes;
create policy "zikra_delete_own_reel_likes" on public.reel_likes
  for delete to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- TUGADI
-- ============================================================
