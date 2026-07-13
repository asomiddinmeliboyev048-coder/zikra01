-- ============================================================
-- ZIKRA — Reels jadvallari uchun RLS siyosatlari
-- ============================================================
-- Bu skriptni Supabase SQL Editor'da ishga tushiring. IDEMPOTENT.
--
-- MUAMMO: reel_comments / reel_likes / reel_views jadvallari qo'lda
-- yaratilgan. Supabase UI jadval yaratganda RLS'ni YOQADI, lekin siyosat
-- (policy) qo'shmaydi. Natijada INSERT bloklanadi -> IZOH YOZIB BO'LMAYDI,
-- like/ko'rish ham ishlamasligi mumkin.
--
-- Bu skript kerakli siyosatlarni qo'shadi:
--   - select: hamma o'qiy oladi (feed/statistika uchun)
--   - insert/delete: faqat o'z yozuvi (auth.uid() = user_id)
-- ============================================================

-- ---------- reels (asosiy) ----------
alter table public.reels enable row level security;

drop policy if exists "reels_select_all" on public.reels;
create policy "reels_select_all" on public.reels
  for select using (true);

drop policy if exists "reels_insert_own" on public.reels;
create policy "reels_insert_own" on public.reels
  for insert with check (auth.uid() = user_id);

drop policy if exists "reels_delete_own" on public.reels;
create policy "reels_delete_own" on public.reels
  for delete using (auth.uid() = user_id);

-- ---------- reel_comments (IZOHLAR) ----------
alter table public.reel_comments enable row level security;

drop policy if exists "reel_comments_select_all" on public.reel_comments;
create policy "reel_comments_select_all" on public.reel_comments
  for select using (true);

drop policy if exists "reel_comments_insert_own" on public.reel_comments;
create policy "reel_comments_insert_own" on public.reel_comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "reel_comments_delete_own" on public.reel_comments;
create policy "reel_comments_delete_own" on public.reel_comments
  for delete using (auth.uid() = user_id);

-- ---------- reel_likes (LAYKLAR) ----------
alter table public.reel_likes enable row level security;

drop policy if exists "reel_likes_select_all" on public.reel_likes;
create policy "reel_likes_select_all" on public.reel_likes
  for select using (true);

drop policy if exists "reel_likes_insert_own" on public.reel_likes;
create policy "reel_likes_insert_own" on public.reel_likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "reel_likes_delete_own" on public.reel_likes;
create policy "reel_likes_delete_own" on public.reel_likes
  for delete using (auth.uid() = user_id);

-- ---------- reel_views (KO'RISHLAR) ----------
alter table public.reel_views enable row level security;

drop policy if exists "reel_views_select_all" on public.reel_views;
create policy "reel_views_select_all" on public.reel_views
  for select using (true);

drop policy if exists "reel_views_insert_own" on public.reel_views;
create policy "reel_views_insert_own" on public.reel_views
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- TUGADI
-- ============================================================
