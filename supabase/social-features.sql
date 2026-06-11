-- ============================================================
-- ZIKRA — Ijtimoiy funksiyalar: obuna (follow), like, ko'rishlar
-- ============================================================
-- Ushbu skriptni Supabase SQL Editor'da ishga tushiring (schema.sql dan keyin).
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 1) JADVALLAR
-- ============================================================

-- Obuna tizimi
create table if not exists public.follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)   -- o'z-o'ziga obuna bo'lib bo'lmaydi
);

-- Video like tizimi
create table if not exists public.video_likes (
  id         uuid primary key default gen_random_uuid(),
  video_id   uuid not null references public.videos (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (video_id, user_id)
);

-- Ko'rishlar soni
create table if not exists public.video_views (
  id        uuid primary key default gen_random_uuid(),
  video_id  uuid not null references public.videos (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now()
);

-- Indekslar
create index if not exists idx_follows_following on public.follows (following_id);
create index if not exists idx_follows_follower on public.follows (follower_id);
create index if not exists idx_video_likes_video on public.video_likes (video_id);
create index if not exists idx_video_views_video on public.video_views (video_id);

-- ============================================================
-- 2) RLS
-- ============================================================
alter table public.follows      enable row level security;
alter table public.video_likes  enable row level security;
alter table public.video_views  enable row level security;

-- follows
drop policy if exists "follows_select_all" on public.follows;
create policy "follows_select_all" on public.follows for select using (true);
drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own" on public.follows
  for insert to authenticated
  with check (auth.uid() = follower_id and follower_id <> following_id);
drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own" on public.follows
  for delete to authenticated using (auth.uid() = follower_id);

-- video_likes
drop policy if exists "video_likes_select_all" on public.video_likes;
create policy "video_likes_select_all" on public.video_likes for select using (true);
drop policy if exists "video_likes_insert_own" on public.video_likes;
create policy "video_likes_insert_own" on public.video_likes
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "video_likes_delete_own" on public.video_likes;
create policy "video_likes_delete_own" on public.video_likes
  for delete to authenticated using (auth.uid() = user_id);

-- video_views
drop policy if exists "video_views_select_all" on public.video_views;
create policy "video_views_select_all" on public.video_views for select using (true);
drop policy if exists "video_views_insert_own" on public.video_views;
create policy "video_views_insert_own" on public.video_views
  for insert to authenticated with check (auth.uid() = user_id);

-- ============================================================
-- 3) BILDIRISHNOMA TRIGGERLARI
-- ============================================================

-- Yangi obunachi
create or replace function public.notify_new_follower()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  follower_name text;
begin
  select full_name into follower_name from public.profiles where id = new.follower_id;
  insert into public.notifications (user_id, type, message, link)
  values (
    new.following_id,
    'new_follower',
    coalesce(nullif(follower_name, ''), 'Kimdir') || ' sizga obuna bo''ldi',
    '/profile/' || new.follower_id
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_follower on public.follows;
create trigger trg_notify_new_follower
  after insert on public.follows
  for each row execute function public.notify_new_follower();

-- Video like
create or replace function public.notify_new_like()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_uploader uuid;
  v_title text;
  liker_name text;
begin
  select uploader_id, title into v_uploader, v_title from public.videos where id = new.video_id;
  if v_uploader is not null and v_uploader <> new.user_id then
    select full_name into liker_name from public.profiles where id = new.user_id;
    insert into public.notifications (user_id, type, message, link)
    values (
      v_uploader,
      'new_like',
      coalesce(nullif(liker_name, ''), 'Kimdir') || ' sizning darsingizni yoqtirdi',
      '/profile/' || v_uploader
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_new_like on public.video_likes;
create trigger trg_notify_new_like
  after insert on public.video_likes
  for each row execute function public.notify_new_like();

-- Obuna bo'lingan odam yangi video yukladi (video tasdiqlanganda)
create or replace function public.notify_followers_new_video()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  uploader_name text;
begin
  if new.status = 'published' and (old.status is distinct from 'published') then
    select full_name into uploader_name from public.profiles where id = new.uploader_id;
    insert into public.notifications (user_id, type, message, link)
    select
      f.follower_id,
      'new_video_from_following',
      coalesce(nullif(uploader_name, ''), 'Kimdir') || ' yangi dars yukladi: ' || new.title,
      '/videos'
    from public.follows f
    where f.following_id = new.uploader_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_followers_new_video on public.videos;
create trigger trg_notify_followers_new_video
  after update of status on public.videos
  for each row execute function public.notify_followers_new_video();

-- ============================================================
-- 4) REALTIME
-- ============================================================
do $$ begin
  alter publication supabase_realtime add table public.follows;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.video_likes;
exception when others then null; end $$;

-- ============================================================
-- TUGADI
-- ============================================================
