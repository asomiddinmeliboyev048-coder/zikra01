-- ============================================================
-- ZIKRA — 0008: Reels (fix + views + reply), Chat (edit/delete),
--                Smart Matching (bildirishnomalar + cron)
-- ============================================================
-- Ushbu skriptni Supabase SQL Editor'da TO'LIQ nusxalab ishga tushiring.
-- Idempotent: bir necha marta ishga tushirsa ham xavfsiz.
-- Talab: avval schema.sql, 0005_reels.sql (va imkon bo'lsa 0006/0007) ishga
-- tushirilgan bo'lishi kerak. Baribir quyida hamma narsa "if not exists" bilan
-- himoyalangan.
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 1) REELS: FK'ni profiles'ga to'g'rilash ("reels yo'qolishi" bug)
-- ------------------------------------------------------------
-- Muammo: reels.user_id FK'si auth.users'ga ishora qilgan, lekin frontend
-- so'rovi `profiles!reels_user_id_fkey` embed qiladi. FK profiles'ga ishora
-- qilmagani uchun join ishlamay, reels ro'yxati bo'sh qaytardi.
-- Yechim: FK'ni profiles(id) ga o'zgartiramiz (profiles.id = auth.users.id).
-- ============================================================
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'reels') then
    alter table public.reels drop constraint if exists reels_user_id_fkey;
    alter table public.reels
      add constraint reels_user_id_fkey
      foreign key (user_id) references public.profiles (id) on delete cascade;
  end if;
end $$;

-- ============================================================
-- 2) REEL LIKES — jadval, RLS va "like" bildirishnomasi
-- ============================================================
create table if not exists public.reel_likes (
  id         uuid primary key default gen_random_uuid(),
  reel_id    uuid not null references public.reels (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (reel_id, user_id)
);
create index if not exists idx_reel_likes_reel on public.reel_likes (reel_id);
create index if not exists idx_reel_likes_user on public.reel_likes (user_id);

alter table public.reel_likes enable row level security;

drop policy if exists "zikra_read_reel_likes" on public.reel_likes;
create policy "zikra_read_reel_likes" on public.reel_likes for select using (true);

drop policy if exists "zikra_insert_own_reel_likes" on public.reel_likes;
create policy "zikra_insert_own_reel_likes" on public.reel_likes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "zikra_delete_own_reel_likes" on public.reel_likes;
create policy "zikra_delete_own_reel_likes" on public.reel_likes
  for delete to authenticated using (auth.uid() = user_id);

-- Like -> reel egasiga bildirishnoma (o'ziga emas)
create or replace function public.notify_new_reel_like()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid;
  liker text;
begin
  select user_id into v_owner from public.reels where id = new.reel_id;
  select full_name into liker from public.profiles where id = new.user_id;
  if v_owner is not null and v_owner <> new.user_id then
    insert into public.notifications (user_id, type, message, link)
    values (
      v_owner, 'new_like',
      coalesce(nullif(liker, ''), 'Kimdir') || ' reelingizni yoqtirdi',
      '/reels?start=' || new.reel_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_new_reel_like on public.reel_likes;
create trigger trg_notify_new_reel_like
  after insert on public.reel_likes
  for each row execute function public.notify_new_reel_like();

-- ============================================================
-- 3) REEL COMMENTS — jadval + parent_id (reply) + RLS + bildirishnoma
-- ============================================================
create table if not exists public.reel_comments (
  id         uuid primary key default gen_random_uuid(),
  reel_id    uuid not null references public.reels (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  parent_id  uuid references public.reel_comments (id) on delete cascade,
  content    text not null check (char_length(trim(content)) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- Mavjud o'rnatishlar uchun: ustun bo'lmasa qo'shamiz (reply tizimi)
alter table public.reel_comments
  add column if not exists parent_id uuid references public.reel_comments (id) on delete cascade;

create index if not exists idx_reel_comments_reel on public.reel_comments (reel_id, created_at);
create index if not exists idx_reel_comments_user on public.reel_comments (user_id);
create index if not exists idx_reel_comments_parent on public.reel_comments (parent_id);

alter table public.reel_comments enable row level security;

drop policy if exists "zikra_read_reel_comments" on public.reel_comments;
create policy "zikra_read_reel_comments" on public.reel_comments for select using (true);

drop policy if exists "zikra_insert_own_reel_comments" on public.reel_comments;
create policy "zikra_insert_own_reel_comments" on public.reel_comments
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "zikra_delete_own_reel_comments" on public.reel_comments;
create policy "zikra_delete_own_reel_comments" on public.reel_comments
  for delete to authenticated using (auth.uid() = user_id);

-- Izoh/Javob -> bildirishnoma:
--   * top-level izoh  -> reel egasiga ("izoh qoldirdi")
--   * javob (reply)   -> ota izoh muallifiga ("izohingizga javob berdi")
create or replace function public.notify_new_reel_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_target uuid;
  v_msg text;
  actor text;
begin
  select full_name into actor from public.profiles where id = new.user_id;

  if new.parent_id is null then
    -- top-level: reel egasi
    select user_id into v_target from public.reels where id = new.reel_id;
    v_msg := coalesce(nullif(actor, ''), 'Kimdir') || ' reelingizga izoh qoldirdi';
  else
    -- reply: ota izoh muallifi
    select user_id into v_target from public.reel_comments where id = new.parent_id;
    v_msg := coalesce(nullif(actor, ''), 'Kimdir') || ' izohingizga javob berdi';
  end if;

  if v_target is not null and v_target <> new.user_id then
    insert into public.notifications (user_id, type, message, link)
    values (v_target, 'new_comment', v_msg, '/reels?start=' || new.reel_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_new_reel_comment on public.reel_comments;
create trigger trg_notify_new_reel_comment
  after insert on public.reel_comments
  for each row execute function public.notify_new_reel_comment();

-- ============================================================
-- 4) REEL VIEWS — ko'rishlar (bir odam = 1 marta)
-- ============================================================
create table if not exists public.reel_views (
  id         uuid primary key default gen_random_uuid(),
  reel_id    uuid not null references public.reels (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (reel_id, user_id)
);
create index if not exists idx_reel_views_reel on public.reel_views (reel_id);

alter table public.reel_views enable row level security;

drop policy if exists "zikra_read_reel_views" on public.reel_views;
create policy "zikra_read_reel_views" on public.reel_views for select using (true);

drop policy if exists "zikra_insert_own_reel_views" on public.reel_views;
create policy "zikra_insert_own_reel_views" on public.reel_views
  for insert to authenticated with check (auth.uid() = user_id);

-- ============================================================
-- 5) CHAT — xabarni tahrirlash / o'chirish / tarixni tozalash
-- ============================================================
-- Tahrirlangan vaqt ustuni
alter table public.messages add column if not exists edited_at timestamptz;

-- DELETE realtime hodisasida conversation_id kelishi uchun (filtr ishlashi uchun)
alter table public.messages replica identity full;

-- Jo'natuvchi o'z xabarini tahrirlay oladi
drop policy if exists "messages_update_sender" on public.messages;
create policy "messages_update_sender" on public.messages
  for update using (auth.uid() = sender_id) with check (auth.uid() = sender_id);

-- Ishtirokchi (jo'natuvchi yoki qabul qiluvchi) xabarni o'chira oladi.
-- Bu "suhbat tarixini to'liq o'chirish" imkonini ham beradi.
drop policy if exists "messages_delete_participant" on public.messages;
create policy "messages_delete_participant" on public.messages
  for delete using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- ============================================================
-- 6) SMART MATCHING — moslashtirish bildirishnomalari
-- ============================================================

-- Dedup jadvali: bir (foydalanuvchi, ko'nikma, rol) uchun 3 kunda 1 marta xabar
create table if not exists public.match_notifications (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  skill_id     uuid not null references public.skills (id) on delete cascade,
  role         text not null check (role in ('teach', 'learn')),
  last_sent_at timestamptz not null default now(),
  primary key (user_id, skill_id, role)
);

alter table public.match_notifications enable row level security;
drop policy if exists "match_notifications_own" on public.match_notifications;
create policy "match_notifications_own" on public.match_notifications
  for select using (auth.uid() = user_id);

/*
  notify_skill_matches — ko'nikma bo'yicha o'rgatuvchi va o'rganuvchilarni
  bir-biriga bog'lab bildirishnoma yuboradi.

  Argumentlar (ikkalasi ham ixtiyoriy):
    p_user_id  — faqat shu foydalanuvchi ko'nikmalari bo'yicha (masalan yangi
                 ro'yxatdan o'tganda). null bo'lsa — hamma foydalanuvchilar.
    p_skill_id — faqat shu ko'nikma bo'yicha (masalan yangi ko'nikma qo'shilganda
                 shu ko'nikma egalari yangilansin). null bo'lsa — hamma ko'nikma.

  Chaqirilishi:
    * user_skills INSERT triggeri  -> notify_skill_matches(null, new.skill_id)
      (yangi o'rganuvchi qo'shilsa — shu ko'nikma bo'yicha o'rgatuvchilar VA
       yangi o'rganuvchining o'zi darhol xabar oladi).
    * Vercel Cron (har 3 kun)       -> notify_skill_matches(null, null).

  Dedup: har (user, skill, role) uchun 3 kunda faqat 1 marta.
*/
create or replace function public.notify_skill_matches(
  p_user_id uuid default null,
  p_skill_id uuid default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  rec        record;
  cnt        integer;
  skill_name text;
  last_at    timestamptz;
begin
  for rec in
    select us.user_id, us.skill_id, us.type
    from public.user_skills us
    where (p_user_id is null or us.user_id = p_user_id)
      and (p_skill_id is null or us.skill_id = p_skill_id)
  loop
    -- Qarama-qarshi tomon sonini hisoblaymiz
    if rec.type = 'teach' then
      select count(distinct us2.user_id) into cnt
      from public.user_skills us2
      where us2.skill_id = rec.skill_id and us2.type = 'learn'
        and us2.user_id <> rec.user_id;
    else
      select count(distinct us2.user_id) into cnt
      from public.user_skills us2
      where us2.skill_id = rec.skill_id and us2.type = 'teach'
        and us2.user_id <> rec.user_id;
    end if;

    if cnt = 0 then
      continue;
    end if;

    -- Dedup — oxirgi 3 kun ichida yuborilgan bo'lsa o'tkazamiz
    select mn.last_sent_at into last_at
    from public.match_notifications mn
    where mn.user_id = rec.user_id
      and mn.skill_id = rec.skill_id
      and mn.role = rec.type;

    if last_at is not null and last_at > now() - interval '3 days' then
      continue;
    end if;

    select name into skill_name from public.skills where id = rec.skill_id;

    if rec.type = 'teach' then
      insert into public.notifications (user_id, type, message, link)
      values (
        rec.user_id, 'match',
        'Siz "' || coalesce(skill_name, 'ko''nikma') ||
          '" bilishingizni ko''rdik. ' || cnt ||
          ' ta foydalanuvchi sizdan shu ko''nikmani o''rganmoqchi va sizni kutishmoqda.',
        '/matches/' || rec.skill_id || '?role=teacher'
      );
    else
      insert into public.notifications (user_id, type, message, link)
      values (
        rec.user_id, 'match',
        'Siz o''rganmoqchi bo''lgan "' || coalesce(skill_name, 'ko''nikma') ||
          '" ko''nikmasini ' || cnt || ' ta inson o''rgata oladi.',
        '/matches/' || rec.skill_id || '?role=learner'
      );
    end if;

    insert into public.match_notifications (user_id, skill_id, role, last_sent_at)
    values (rec.user_id, rec.skill_id, rec.type, now())
    on conflict (user_id, skill_id, role)
    do update set last_sent_at = excluded.last_sent_at;
  end loop;
end;
$$;

-- Cron (service role) va server action'lar chaqira olishi uchun
grant execute on function public.notify_skill_matches(uuid, uuid)
  to anon, authenticated, service_role;

-- Yangi ko'nikma qo'shilganda — darhol shu ko'nikma bo'yicha moslikni tekshiramiz
create or replace function public.on_user_skill_added()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.notify_skill_matches(null, new.skill_id);
  return new;
end;
$$;

drop trigger if exists trg_user_skill_added on public.user_skills;
create trigger trg_user_skill_added
  after insert on public.user_skills
  for each row execute function public.on_user_skill_added();

-- ============================================================
-- 7) REALTIME publication'ga qo'shish (ixtiyoriy — jonli yangilanish)
-- ============================================================
do $$ begin
  alter publication supabase_realtime add table public.reel_comments;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.reel_likes;
exception when others then null; end $$;

-- ============================================================
-- (IXTIYORIY) Vercel Cron o'rniga Supabase ichida pg_cron bilan jadval
-- ------------------------------------------------------------
-- Agar Vercel Cron ishlatmasangiz, pg_cron extension'ini yoqib, quyidagini
-- ishga tushiring (har 3 kunda soat 09:00 UTC):
--
--   create extension if not exists pg_cron;
--   select cron.schedule(
--     'zikra-skill-matches',
--     '0 9 */3 * *',
--     $$ select public.notify_skill_matches(null, null); $$
--   );
-- ============================================================

-- ============================================================
-- TUGADI
-- ============================================================
