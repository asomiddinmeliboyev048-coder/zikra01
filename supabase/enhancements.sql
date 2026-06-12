-- ============================================================
-- ZIKRA — Yangilanishlar (views unique, username, ads, saved, 24h stories)
-- ============================================================
-- Avvalgi barcha migratsiyalardan keyin ishga tushiring.
-- ============================================================

create extension if not exists "pgcrypto";

-- 1) VIDEO VIEWS — bir foydalanuvchi = bitta ko'rish (unique)
-- Dublikatlarni o'chiramiz (eng erta ko'rishni qoldirib). min(uuid) mavjud emas,
-- shuning uchun row_number() ishlatamiz.
delete from public.video_views v
using (
  select id, row_number() over (
    partition by video_id, user_id order by viewed_at
  ) as rn
  from public.video_views
) d
where v.id = d.id and d.rn > 1;
alter table public.video_views add column if not exists watch_duration integer default 0;
alter table public.video_views add column if not exists watch_percentage integer default 0;
do $$ begin
  alter table public.video_views add constraint unique_video_view unique (video_id, user_id);
exception when duplicate_table then null; when duplicate_object then null; end $$;

-- 2) USERNAME — Telegram kabi
alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username)) where username is not null;

-- 3) AD VIDEOS — reklama videolari
create table if not exists public.ad_videos (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  video_url    text not null,
  redirect_url text,
  is_active    boolean not null default true,
  views_count  integer not null default 0,
  created_at   timestamptz not null default now()
);
alter table public.ad_videos enable row level security;
drop policy if exists "ads_select" on public.ad_videos;
create policy "ads_select" on public.ad_videos
  for select using (is_active = true or public.is_admin());
drop policy if exists "ads_manage_admin" on public.ad_videos;
create policy "ads_manage_admin" on public.ad_videos
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.bump_ad_view(ad_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.ad_videos set views_count = views_count + 1 where id = ad_id;
end;
$$;
grant execute on function public.bump_ad_view(uuid) to authenticated, anon;

-- 4) SAVED MESSAGES — saqlangan xabarlar
create table if not exists public.saved_messages (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  content      text,
  message_type text not null default 'text',
  reference_id uuid,
  created_at   timestamptz not null default now()
);
create index if not exists idx_saved_messages_user on public.saved_messages (user_id, created_at);
alter table public.saved_messages enable row level security;
drop policy if exists "saved_own" on public.saved_messages;
create policy "saved_own" on public.saved_messages
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5) STORIES — muddat 24 soat
alter table public.stories alter column expires_at set default (now() + interval '24 hours');

-- REALTIME
do $$ begin alter publication supabase_realtime add table public.saved_messages; exception when others then null; end $$;

-- TUGADI
