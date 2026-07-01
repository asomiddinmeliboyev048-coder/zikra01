-- ============================================================
-- ZIKRA — Reels (qisqa videolar) jadvali
-- ============================================================
-- Videolar AWS S3'ga yuklanadi, bazaga faqat URL (video_url) saqlanadi.
-- Ushbu skriptni Supabase SQL Editor'da ishga tushiring.
-- ============================================================

create table if not exists public.reels (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  video_url   text not null,
  description text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_reels_user_id on public.reels (user_id);
create index if not exists idx_reels_created_at on public.reels (created_at desc);

comment on table public.reels is
  'Foydalanuvchilar yuklagan qisqa o''quv videolari (S3''da saqlanadi)';
comment on column public.reels.video_url is
  'AWS S3''dagi videoning ommaviy URL manzili';

-- ------------------------------------------------------------
-- Row Level Security (RLS)
-- ------------------------------------------------------------
alter table public.reels enable row level security;

-- Hamma reels'larni o'qiy oladi
drop policy if exists "zikra_read_reels" on public.reels;
create policy "zikra_read_reels" on public.reels
  for select using (true);

-- Foydalanuvchi faqat O'ZINING reelini qo'sha oladi
drop policy if exists "zikra_insert_own_reels" on public.reels;
create policy "zikra_insert_own_reels" on public.reels
  for insert to authenticated
  with check (auth.uid() = user_id);

-- Foydalanuvchi faqat O'ZINING reelini o'chira oladi
drop policy if exists "zikra_delete_own_reels" on public.reels;
create policy "zikra_delete_own_reels" on public.reels
  for delete to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- TUGADI
-- ============================================================
