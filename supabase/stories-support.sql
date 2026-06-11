-- ============================================================
-- ZIKRA — Stories (hikoyalar) va Support (qo'llab-quvvatlash)
-- ============================================================
-- schema.sql, social-features.sql va admin migratsiyasidan keyin ishga tushiring.
-- (Support RLS public.is_admin() funksiyasiga tayanadi — u ZikraAdmin
--  admin-schema.sql da yaratiladi.)
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 1) STORAGE BUCKET (hikoya media)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('stories', 'stories', true)
on conflict (id) do nothing;

drop policy if exists "stories_public_read" on storage.objects;
create policy "stories_public_read" on storage.objects
  for select using (bucket_id = 'stories');

drop policy if exists "stories_upload_own" on storage.objects;
create policy "stories_upload_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'stories' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "stories_delete_own" on storage.objects;
create policy "stories_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'stories' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- 2) JADVALLAR
-- ============================================================
create table if not exists public.stories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  media_url  text not null,
  media_type text not null default 'image',          -- image | video
  caption    text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '48 hours')
);
create index if not exists idx_stories_user on public.stories (user_id);
create index if not exists idx_stories_expires on public.stories (expires_at);

create table if not exists public.story_views (
  id        uuid primary key default gen_random_uuid(),
  story_id  uuid not null references public.stories (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique (story_id, viewer_id)
);
create index if not exists idx_story_views_story on public.story_views (story_id);

create table if not exists public.story_likes (
  id         uuid primary key default gen_random_uuid(),
  story_id   uuid not null references public.stories (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (story_id, user_id)
);
create index if not exists idx_story_likes_story on public.story_likes (story_id);

-- Support (qo'llab-quvvatlash) xabarlari
create table if not exists public.support_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  sender_role text not null default 'user',           -- user | admin
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_support_user on public.support_messages (user_id, created_at);

-- ============================================================
-- 3) KUNIGA 1 HIKOYA TEKSHIRUVI (trigger)
-- ============================================================
create or replace function public.check_one_story_per_day()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.stories
    where user_id = new.user_id
      and created_at >= date_trunc('day', now())
  ) then
    raise exception 'BIR_KUN_BIR_HIKOYA';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_one_story_per_day on public.stories;
create trigger trg_one_story_per_day
  before insert on public.stories
  for each row execute function public.check_one_story_per_day();

-- ============================================================
-- 4) RLS
-- ============================================================
alter table public.stories          enable row level security;
alter table public.story_views      enable row level security;
alter table public.story_likes      enable row level security;
alter table public.support_messages enable row level security;

-- stories: hamma muddati o'tmaganlarni ko'radi; o'zinikini boshqaradi; admin hammasini ko'radi
drop policy if exists "stories_select" on public.stories;
create policy "stories_select" on public.stories
  for select using (expires_at > now() or auth.uid() = user_id or public.is_admin());
drop policy if exists "stories_insert_own" on public.stories;
create policy "stories_insert_own" on public.stories
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "stories_delete_own" on public.stories;
create policy "stories_delete_own" on public.stories
  for delete using (auth.uid() = user_id or public.is_admin());

-- story_views: ko'rganlar ro'yxatini faqat hikoya egasi (va admin) ko'radi;
-- ko'ruvchi o'z ko'rish yozuvini ko'radi (halqa rangini aniqlash uchun)
drop policy if exists "story_views_select" on public.story_views;
create policy "story_views_select" on public.story_views
  for select using (
    auth.uid() = viewer_id
    or public.is_admin()
    or exists (select 1 from public.stories s where s.id = story_id and s.user_id = auth.uid())
  );
drop policy if exists "story_views_insert_own" on public.story_views;
create policy "story_views_insert_own" on public.story_views
  for insert to authenticated with check (auth.uid() = viewer_id);

-- story_likes: egasi va admin ko'radi; ko'ruvchi o'zinikini ko'radi
drop policy if exists "story_likes_select" on public.story_likes;
create policy "story_likes_select" on public.story_likes
  for select using (
    auth.uid() = user_id
    or public.is_admin()
    or exists (select 1 from public.stories s where s.id = story_id and s.user_id = auth.uid())
  );
drop policy if exists "story_likes_insert_own" on public.story_likes;
create policy "story_likes_insert_own" on public.story_likes
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "story_likes_delete_own" on public.story_likes;
create policy "story_likes_delete_own" on public.story_likes
  for delete to authenticated using (auth.uid() = user_id);

-- support_messages: foydalanuvchi o'zinikini, admin hammasini
drop policy if exists "support_select" on public.support_messages;
create policy "support_select" on public.support_messages
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "support_insert_user" on public.support_messages;
create policy "support_insert_user" on public.support_messages
  for insert to authenticated
  with check (
    (auth.uid() = user_id and sender_role = 'user')
    or (public.is_admin() and sender_role = 'admin')
  );
drop policy if exists "support_update" on public.support_messages;
create policy "support_update" on public.support_messages
  for update using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- ============================================================
-- 5) BILDIRISHNOMA TRIGGERLARI
-- ============================================================

-- Hikoyaga like -> egasiga bildirishnoma
create or replace function public.notify_story_like()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  owner_id uuid;
  liker_name text;
begin
  select user_id into owner_id from public.stories where id = new.story_id;
  if owner_id is not null and owner_id <> new.user_id then
    select full_name into liker_name from public.profiles where id = new.user_id;
    insert into public.notifications (user_id, type, message, link)
    values (owner_id, 'new_like',
      coalesce(nullif(liker_name, ''), 'Kimdir') || ' hikoyangizni yoqtirdi', '/');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_story_like on public.story_likes;
create trigger trg_notify_story_like
  after insert on public.story_likes
  for each row execute function public.notify_story_like();

-- Admin support javobi -> foydalanuvchiga bildirishnoma
create or replace function public.notify_support_reply()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.sender_role = 'admin' then
    insert into public.notifications (user_id, type, message, link)
    values (new.user_id, 'message', 'Qo''llab-quvvatlash javob berdi', '/');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_support_reply on public.support_messages;
create trigger trg_notify_support_reply
  after insert on public.support_messages
  for each row execute function public.notify_support_reply();

-- ============================================================
-- 6) AVTOMATIK TOZALASH (cron)
-- ============================================================
-- pg_cron extension (Supabase: Database -> Extensions -> pg_cron yoqing)
create extension if not exists pg_cron;

-- Har soatda muddati o'tgan hikoyalarni o'chirish
select cron.schedule(
  'zikra-expire-stories',
  '0 * * * *',
  $$ delete from public.stories where expires_at < now(); $$
);

-- Har soatda 2 kundan eski ko'rishlarni tozalash (like'lar saqlanadi)
select cron.schedule(
  'zikra-clean-story-views',
  '30 * * * *',
  $$ delete from public.story_views where viewed_at < now() - interval '2 days'; $$
);

-- ============================================================
-- 7) REALTIME
-- ============================================================
do $$ begin alter publication supabase_realtime add table public.stories; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.story_likes; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.support_messages; exception when others then null; end $$;

-- ============================================================
-- TUGADI
-- ============================================================
