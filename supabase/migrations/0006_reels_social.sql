-- ============================================================
-- ZIKRA — Reels uchun like va ko'rishlar (social)
-- ============================================================
-- video_likes / video_views pattern'iga mos ravishda.
-- Ushbu skriptni Supabase SQL Editor'da ishga tushiring.
-- ============================================================

-- ------------------------------------------------------------
-- Reel likes
-- ------------------------------------------------------------
create table if not exists public.reel_likes (
  id         uuid primary key default gen_random_uuid(),
  reel_id    uuid not null references public.reels (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (reel_id, user_id)
);

create index if not exists idx_reel_likes_reel_id on public.reel_likes (reel_id);

alter table public.reel_likes enable row level security;

drop policy if exists "zikra_read_reel_likes" on public.reel_likes;
create policy "zikra_read_reel_likes" on public.reel_likes
  for select using (true);

drop policy if exists "zikra_insert_own_reel_likes" on public.reel_likes;
create policy "zikra_insert_own_reel_likes" on public.reel_likes
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "zikra_delete_own_reel_likes" on public.reel_likes;
create policy "zikra_delete_own_reel_likes" on public.reel_likes
  for delete to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Reel views (har bir foydalanuvchiga 1 marta)
-- ------------------------------------------------------------
create table if not exists public.reel_views (
  id         uuid primary key default gen_random_uuid(),
  reel_id    uuid not null references public.reels (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (reel_id, user_id)
);

create index if not exists idx_reel_views_reel_id on public.reel_views (reel_id);

alter table public.reel_views enable row level security;

drop policy if exists "zikra_read_reel_views" on public.reel_views;
create policy "zikra_read_reel_views" on public.reel_views
  for select using (true);

drop policy if exists "zikra_insert_own_reel_views" on public.reel_views;
create policy "zikra_insert_own_reel_views" on public.reel_views
  for insert to authenticated
  with check (auth.uid() = user_id);

-- ============================================================
-- TUGADI
-- ============================================================
