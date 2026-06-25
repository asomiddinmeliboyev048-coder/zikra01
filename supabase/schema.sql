-- ============================================================
-- ZIKRA — Supabase Database Schema
-- Learn. Teach. Be remembered.
-- ============================================================
-- Ushbu faylni Supabase SQL Editor'da to'liq ishga tushiring.
-- Tarkibi:
--   1) Jadvallar (tables)
--   2) Indekslar
--   3) Funksiyalar va triggerlar (XP, daraja, badge, reyting)
--   4) Row Level Security (RLS) qoidalari
--   5) Seed: ko'nikmalar (skills) va nishonlar (badges)
-- ============================================================

-- Kerakli extension
create extension if not exists "pgcrypto";

-- ============================================================
-- 1) JADVALLAR
-- ============================================================

-- --- profiles ---
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  city        text,
  bio         text,
  avatar_url  text,
  xp          integer not null default 0,
  level       text not null default 'Yangi boshlovchi',
  trust_score numeric(3,2) not null default 0,      -- o'rtacha reyting (0.00 - 5.00)
  streak_days integer not null default 0,
  onboarded   boolean not null default false,
  certificate_url text,                                -- o'rgata oladigan fan bo'yicha sertifikat (rasm/PDF) URL
  is_verified boolean not null default false,          -- sertifikat admin tomonidan tasdiqlanganmi (ko'k belgi)
  verification_status text not null default 'none'     -- tasdiqlash holati: none/pending/approved/rejected
    check (verification_status in ('none', 'pending', 'approved', 'rejected')),
  last_active timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- --- skills ---
create table if not exists public.skills (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  category   text,
  created_at timestamptz not null default now()
);

-- --- user_skills ---
create type public.skill_type as enum ('teach', 'learn');

create table if not exists public.user_skills (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  type     public.skill_type not null,
  unique (user_id, skill_id, type)
);

-- --- matches ---
create table if not exists public.matches (
  id          uuid primary key default gen_random_uuid(),
  user1_id    uuid not null references public.profiles (id) on delete cascade,
  user2_id    uuid not null references public.profiles (id) on delete cascade,
  match_score integer not null default 0,            -- 0-100
  status      text not null default 'pending',        -- pending | active | closed
  created_at  timestamptz not null default now(),
  unique (user1_id, user2_id)
);

-- --- messages ---
-- conversation_id — ikki foydalanuvchi id'sidan tartiblanib hosil qilinadi: "<minId>_<maxId>"
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id text not null,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  receiver_id     uuid references public.profiles (id) on delete cascade,
  content         text not null,
  created_at      timestamptz not null default now()
);

-- --- lessons ---
create table if not exists public.lessons (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references public.profiles (id) on delete cascade,
  learner_id   uuid not null references public.profiles (id) on delete cascade,
  skill_id     uuid references public.skills (id) on delete set null,
  status       text not null default 'scheduled',     -- scheduled | completed | cancelled
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

-- --- ratings ---
-- Ikki tomonlama: baho is_visible=true bo'lganda profilga hisoblanadi.
create table if not exists public.ratings (
  id         uuid primary key default gen_random_uuid(),
  lesson_id  uuid not null references public.lessons (id) on delete cascade,
  rater_id   uuid not null references public.profiles (id) on delete cascade,
  rated_id   uuid not null references public.profiles (id) on delete cascade,
  score      integer not null check (score between 1 and 5),
  comment    text,
  is_visible boolean not null default false,
  created_at timestamptz not null default now(),
  unique (lesson_id, rater_id)
);

-- --- badges ---
create table if not exists public.badges (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,
  description     text,
  icon            text,                                -- emoji yoki ikona nomi
  condition_type  text not null,                       -- first_lesson | streak | five_star_count | top_teacher
  condition_value integer not null default 0
);

-- --- user_badges ---
create table if not exists public.user_badges (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles (id) on delete cascade,
  badge_id  uuid not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

-- --- videos ---
create table if not exists public.videos (
  id            uuid primary key default gen_random_uuid(),
  uploader_id   uuid not null references public.profiles (id) on delete cascade,
  title         text not null,
  skill_id      uuid references public.skills (id) on delete set null,
  cloudinary_url text not null,
  thumbnail_url text,
  duration      integer,                               -- soniyalarda
  status        text not null default 'published',     -- published | hidden
  created_at    timestamptz not null default now()
);

-- --- notifications ---
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null,                            -- message | rating | badge | streak | match
  message    text not null,
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2) INDEKSLAR
-- ============================================================
create index if not exists idx_user_skills_user on public.user_skills (user_id);
create index if not exists idx_user_skills_skill on public.user_skills (skill_id);
create index if not exists idx_messages_conversation on public.messages (conversation_id, created_at);
create index if not exists idx_ratings_rated on public.ratings (rated_id);
create index if not exists idx_videos_uploader on public.videos (uploader_id);
create index if not exists idx_notifications_user on public.notifications (user_id, is_read);
create index if not exists idx_lessons_teacher on public.lessons (teacher_id);
create index if not exists idx_lessons_learner on public.lessons (learner_id);

-- ============================================================
-- 3) FUNKSIYALAR VA TRIGGERLAR
-- ============================================================

-- --- 3.1 Yangi auth foydalanuvchisi uchun profil yaratish ---
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --- 3.2 XP -> daraja hisoblash ---
create or replace function public.compute_level(p_xp integer)
returns text
language sql
immutable
as $$
  select case
    when p_xp >= 2000 then 'Master'
    when p_xp >= 1000 then 'Ekspert'
    when p_xp >= 500  then 'Tajribali'
    when p_xp >= 200  then 'O''rta'
    else 'Yangi boshlovchi'
  end;
$$;

-- profiles.xp o'zgarganda level avtomatik yangilansin
create or replace function public.sync_level()
returns trigger
language plpgsql
as $$
begin
  new.level := public.compute_level(new.xp);
  return new;
end;
$$;

drop trigger if exists trg_sync_level on public.profiles;
create trigger trg_sync_level
  before insert or update of xp on public.profiles
  for each row execute function public.sync_level();

-- --- 3.3 XP qo'shish yordamchi funksiyasi ---
create or replace function public.add_xp(p_user_id uuid, p_amount integer)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
     set xp = greatest(0, xp + p_amount)
   where id = p_user_id;
end;
$$;

-- --- 3.4 Badge berish (avtomatik) ---
create or replace function public.grant_badge(p_user_id uuid, p_condition_type text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  b record;
begin
  for b in
    select id from public.badges where condition_type = p_condition_type
  loop
    insert into public.user_badges (user_id, badge_id)
    values (p_user_id, b.id)
    on conflict (user_id, badge_id) do nothing;

    -- agar yangi badge berilgan bo'lsa, bildirishnoma
    if found then
      insert into public.notifications (user_id, type, message, link)
      select p_user_id, 'badge', 'Tabriklaymiz! Yangi nishon: ' || bd.name, '/profile/' || p_user_id
      from public.badges bd where bd.id = b.id;
    end if;
  end loop;
end;
$$;

-- --- 3.5 Dars yakunlanganda XP va birinchi dars badge ---
create or replace function public.on_lesson_completed()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    -- o'qituvchiga dars o'tkazgani uchun +50 XP
    perform public.add_xp(new.teacher_id, 50);

    -- birinchi dars badge (ikki tomon uchun ham tekshiramiz)
    if (select count(*) from public.lessons
        where teacher_id = new.teacher_id and status = 'completed') = 1 then
      perform public.grant_badge(new.teacher_id, 'first_lesson');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lesson_completed on public.lessons;
create trigger trg_lesson_completed
  after update of status on public.lessons
  for each row execute function public.on_lesson_completed();

-- --- 3.6 Ikki tomonlama reyting mantiqi ---
-- Yangi baho qo'shilganda: agar ikkala tomon ham baholagan bo'lsa,
-- ikkalasini ko'rinadigan qilamiz, o'rtacha reytingni yangilaymiz,
-- 5 yulduz uchun +30 XP, 5-yulduzlilar soniga qarab badge beramiz.
create or replace function public.on_rating_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  counterpart public.ratings%rowtype;
  five_count integer;
begin
  select * into counterpart
  from public.ratings
  where lesson_id = new.lesson_id
    and rater_id = new.rated_id
    and rated_id = new.rater_id
  limit 1;

  if found then
    -- ikkala tomon ham baholadi -> ikkalasini ko'rinadigan qilamiz
    update public.ratings set is_visible = true
      where id in (new.id, counterpart.id);

    -- har bir baholangan foydalanuvchining o'rtacha reytingini yangilash
    perform public.refresh_trust_score(new.rated_id);
    perform public.refresh_trust_score(counterpart.rated_id);

    -- 5 yulduz uchun +30 XP
    if new.score = 5 then perform public.add_xp(new.rated_id, 30); end if;
    if counterpart.score = 5 then perform public.add_xp(counterpart.rated_id, 30); end if;

    -- 5-yulduzlilar soniga qarab badge (10 ta -> five_star_count)
    select count(*) into five_count from public.ratings
      where rated_id = new.rated_id and score = 5 and is_visible = true;
    if five_count >= 10 then perform public.grant_badge(new.rated_id, 'five_star_count'); end if;

    select count(*) into five_count from public.ratings
      where rated_id = counterpart.rated_id and score = 5 and is_visible = true;
    if five_count >= 10 then perform public.grant_badge(counterpart.rated_id, 'five_star_count'); end if;

    -- bildirishnoma (baho olgan tomonlarga)
    insert into public.notifications (user_id, type, message, link)
    values
      (new.rated_id, 'rating', 'Sizga yangi baho berildi!', '/profile/' || new.rated_id),
      (counterpart.rated_id, 'rating', 'Sizga yangi baho berildi!', '/profile/' || counterpart.rated_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_rating_insert on public.ratings;
create trigger trg_rating_insert
  after insert on public.ratings
  for each row execute function public.on_rating_insert();

-- --- 3.7 O'rtacha reytingni (trust_score) qayta hisoblash ---
create or replace function public.refresh_trust_score(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  avg_score numeric;
begin
  select coalesce(avg(score), 0) into avg_score
  from public.ratings
  where rated_id = p_user_id and is_visible = true;

  update public.profiles
    set trust_score = round(avg_score, 2)
  where id = p_user_id;
end;
$$;

-- --- 3.8 Yangi xabar kelganda bildirishnoma ---
create or replace function public.on_new_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.receiver_id is not null then
    insert into public.notifications (user_id, type, message, link)
    values (new.receiver_id, 'message', 'Sizga yangi xabar keldi', '/chat');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_new_message on public.messages;
create trigger trg_new_message
  after insert on public.messages
  for each row execute function public.on_new_message();

-- --- 3.9 Streak (kunlik ketma-ketlik) tizimi ---
-- Har faollikda chaqiriladi: bugun birinchi marta bo'lsa streak yangilanadi.
--   - kecha faol bo'lgan bo'lsa: streak +1, +20 XP
--   - tanaffus bo'lsa: streak = 1
-- So'ng streak badge'lari beriladi (7 va 30 kun).
create or replace function public.touch_streak(uid uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  last_day date;
  today date := (now() at time zone 'UTC')::date;
  new_streak integer;
begin
  select (last_active at time zone 'UTC')::date into last_day
  from public.profiles where id = uid;

  if last_day = today then
    return; -- bugun allaqachon hisoblangan
  end if;

  if last_day = today - 1 then
    update public.profiles
      set streak_days = streak_days + 1, last_active = now()
    where id = uid
    returning streak_days into new_streak;
    perform public.add_xp(uid, 20);
  else
    update public.profiles
      set streak_days = 1, last_active = now()
    where id = uid
    returning streak_days into new_streak;
  end if;

  -- streak badge'lari
  if new_streak >= 7 then perform public.grant_badge(uid, 'streak'); end if;
  if new_streak >= 30 then perform public.grant_badge(uid, 'top_teacher'); end if;
end;
$$;

-- ============================================================
-- 4) ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.skills         enable row level security;
alter table public.user_skills    enable row level security;
alter table public.matches        enable row level security;
alter table public.messages       enable row level security;
alter table public.lessons        enable row level security;
alter table public.ratings        enable row level security;
alter table public.badges         enable row level security;
alter table public.user_badges    enable row level security;
alter table public.videos         enable row level security;
alter table public.notifications  enable row level security;

-- --- profiles ---
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- --- skills (hamma o'qiy oladi, kirgan foydalanuvchi qo'sha oladi) ---
drop policy if exists "skills_select_all" on public.skills;
create policy "skills_select_all" on public.skills for select using (true);
drop policy if exists "skills_insert_auth" on public.skills;
create policy "skills_insert_auth" on public.skills
  for insert with check (auth.role() = 'authenticated');

-- --- user_skills ---
drop policy if exists "user_skills_select_all" on public.user_skills;
create policy "user_skills_select_all" on public.user_skills for select using (true);
drop policy if exists "user_skills_modify_own" on public.user_skills;
create policy "user_skills_modify_own" on public.user_skills
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- --- matches ---
drop policy if exists "matches_select_participant" on public.matches;
create policy "matches_select_participant" on public.matches
  for select using (auth.uid() = user1_id or auth.uid() = user2_id);
drop policy if exists "matches_insert_participant" on public.matches;
create policy "matches_insert_participant" on public.matches
  for insert with check (auth.uid() = user1_id or auth.uid() = user2_id);
drop policy if exists "matches_update_participant" on public.matches;
create policy "matches_update_participant" on public.matches
  for update using (auth.uid() = user1_id or auth.uid() = user2_id);

-- --- messages ---
drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
drop policy if exists "messages_insert_sender" on public.messages;
create policy "messages_insert_sender" on public.messages
  for insert with check (auth.uid() = sender_id);

-- --- lessons ---
drop policy if exists "lessons_select_participant" on public.lessons;
create policy "lessons_select_participant" on public.lessons
  for select using (auth.uid() = teacher_id or auth.uid() = learner_id);
drop policy if exists "lessons_insert_participant" on public.lessons;
create policy "lessons_insert_participant" on public.lessons
  for insert with check (auth.uid() = teacher_id or auth.uid() = learner_id);
drop policy if exists "lessons_update_participant" on public.lessons;
create policy "lessons_update_participant" on public.lessons
  for update using (auth.uid() = teacher_id or auth.uid() = learner_id);

-- --- ratings (ko'rinadigan baholarni hamma o'qiy oladi) ---
drop policy if exists "ratings_select_visible_or_own" on public.ratings;
create policy "ratings_select_visible_or_own" on public.ratings
  for select using (is_visible = true or auth.uid() = rater_id or auth.uid() = rated_id);
drop policy if exists "ratings_insert_rater" on public.ratings;
create policy "ratings_insert_rater" on public.ratings
  for insert with check (auth.uid() = rater_id);

-- --- badges (hamma o'qiy oladi) ---
drop policy if exists "badges_select_all" on public.badges;
create policy "badges_select_all" on public.badges for select using (true);

-- --- user_badges (hamma o'qiy oladi) ---
drop policy if exists "user_badges_select_all" on public.user_badges;
create policy "user_badges_select_all" on public.user_badges for select using (true);

-- --- videos ---
drop policy if exists "videos_select_published" on public.videos;
create policy "videos_select_published" on public.videos
  for select using (status = 'published' or auth.uid() = uploader_id);
drop policy if exists "videos_modify_own" on public.videos;
create policy "videos_modify_own" on public.videos
  for all using (auth.uid() = uploader_id) with check (auth.uid() = uploader_id);

-- --- notifications ---
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 5) REALTIME (chat uchun)
-- ============================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;

-- ============================================================
-- 6) SEED — KO'NIKMALAR VA NISHONLAR
-- ============================================================
insert into public.skills (name, category) values
  ('Python', 'Dasturlash'),
  ('JavaScript', 'Dasturlash'),
  ('Web dizayn', 'Dizayn'),
  ('Grafik dizayn', 'Dizayn'),
  ('Fotografiya', 'Ijod'),
  ('Video montaj', 'Ijod'),
  ('Ingliz tili', 'Tillar'),
  ('Arab tili', 'Tillar'),
  ('Rus tili', 'Tillar'),
  ('Marketing', 'Biznes'),
  ('SMM', 'Biznes'),
  ('Matematika', 'Fan'),
  ('Gitara', 'Musiqa'),
  ('Shaxmat', 'Hobbi'),
  ('Copywriting', 'Biznes')
on conflict (name) do nothing;

insert into public.badges (name, description, icon, condition_type, condition_value) values
  ('Birinchi qadam', 'Birinchi darsingizni o''tkazdingiz', '🎓', 'first_lesson', 1),
  ('Barqaror', '7 kunlik streak saqladingiz', '🔥', 'streak', 7),
  ('Sevimli o''qituvchi', '10 ta 5 yulduzli baho oldingiz', '⭐', 'five_star_count', 10),
  ('Top O''qituvchi', '30 kunlik streak — eng zo''r!', '🏆', 'top_teacher', 30)
on conflict (name) do nothing;

-- ============================================================
-- TUGADI
-- ============================================================
