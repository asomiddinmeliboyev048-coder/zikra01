-- ============================================================
-- ZIKRA — Reel izohlari (comments) jadvali
-- ============================================================
-- ReelsPlayer'dagi "Izohlar" (Bottom Sheet) funksiyasi shu jadvalga tayanadi.
--
-- ESLATMA: Like (yoqtirish) tizimi allaqachon `public.reel_likes`
-- jadvalida mavjud (0006_reel_likes.sql). Shu sababli bu migratsiya
-- faqat IZOHLAR jadvalini qo'shadi.
--
-- Ushbu skriptni Supabase SQL Editor'da ishga tushiring.
-- (0005_reels.sql va 0006_reel_likes.sql dan keyin.)
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1) JADVAL: reel_comments
-- ------------------------------------------------------------
create table if not exists public.reel_comments (
  id         uuid primary key default gen_random_uuid(),
  reel_id    uuid not null references public.reels (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  content    text not null check (char_length(trim(content)) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- Bir reel bo'yicha izohlarni vaqt bo'yicha tez olish uchun indeks
create index if not exists idx_reel_comments_reel
  on public.reel_comments (reel_id, created_at);
create index if not exists idx_reel_comments_user
  on public.reel_comments (user_id);

comment on table public.reel_comments is
  'Reels (qisqa videolar) uchun izohlar tizimi';

-- ------------------------------------------------------------
-- 2) Row Level Security (RLS)
-- ------------------------------------------------------------
alter table public.reel_comments enable row level security;

-- O'qish: hamma izohlarni o'qiy oladi (ro'yxatni ko'rsatish uchun)
drop policy if exists "zikra_read_reel_comments" on public.reel_comments;
create policy "zikra_read_reel_comments" on public.reel_comments
  for select using (true);

-- Yozish: faqat avtorizatsiyadan o'tgan foydalanuvchi VA faqat o'zi nomidan
drop policy if exists "zikra_insert_own_reel_comments" on public.reel_comments;
create policy "zikra_insert_own_reel_comments" on public.reel_comments
  for insert to authenticated
  with check (auth.uid() = user_id);

-- O'chirish: foydalanuvchi faqat O'ZINING izohini o'chira oladi
drop policy if exists "zikra_delete_own_reel_comments" on public.reel_comments;
create policy "zikra_delete_own_reel_comments" on public.reel_comments
  for delete to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3) BILDIRISHNOMA TRIGGERI
--    Yangi izoh -> reel egasiga xabar (o'ziga emas)
-- ------------------------------------------------------------
create or replace function public.notify_new_reel_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid;
  commenter text;
begin
  select user_id into v_owner from public.reels where id = new.reel_id;
  select full_name into commenter from public.profiles where id = new.user_id;

  if v_owner is not null and v_owner <> new.user_id then
    insert into public.notifications (user_id, type, message, link)
    values (
      v_owner,
      'new_comment',
      coalesce(nullif(commenter, ''), 'Kimdir') || ' reelingizga izoh qoldirdi',
      '/reels?start=' || new.reel_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_new_reel_comment on public.reel_comments;
create trigger trg_notify_new_reel_comment
  after insert on public.reel_comments
  for each row execute function public.notify_new_reel_comment();

-- ------------------------------------------------------------
-- 4) REALTIME (ixtiyoriy — jonli yangilanish uchun)
-- ------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.reel_comments;
exception when others then null; end $$;

-- ============================================================
-- TUGADI
-- ============================================================
