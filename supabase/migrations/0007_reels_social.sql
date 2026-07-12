-- ============================================================
-- ZIKRA — Reels ijtimoiy funksiyalari (izohlar, ko'rishlar, FK tuzatish)
-- ============================================================
-- Ushbu skriptni Supabase SQL Editor'da bir marta ishga tushiring.
-- Mavjud jadvallarni O'CHIRMAYDI — faqat yangilaydi/qo'shadi.
-- ============================================================

-- ------------------------------------------------------------
-- 1) FK TUZATISH — reels.user_id endi public.profiles'ga bog'lanadi
-- ------------------------------------------------------------
-- Sabab: PostgREST `profiles!reels_user_id_fkey` embed'i ishlashi uchun
-- FK aynan profiles jadvaliga ko'rsatishi kerak. Ilgari u auth.users'ga
-- bog'langan edi va bu Reels lentasi bo'sh chiqishiga sabab bo'lardi.
-- profiles.id = auth.users.id bo'lgani uchun bu o'zgarish xavfsiz.
do $$
begin
  -- Eski FK'ni (auth.users'ga) olib tashlaymiz, agar mavjud bo'lsa
  if exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'reels_user_id_fkey'
      and table_name = 'reels'
      and table_schema = 'public'
  ) then
    alter table public.reels drop constraint reels_user_id_fkey;
  end if;

  -- Yangi FK — public.profiles(id)'ga
  alter table public.reels
    add constraint reels_user_id_fkey
    foreign key (user_id) references public.profiles (id) on delete cascade;
exception
  when others then
    -- Agar biror sabab bilan qo'sha olmasa (masalan orphan yozuv),
    -- migratsiyani to'xtatmaymiz — ilova manual join'ga tayanadi.
    raise notice 'reels_user_id_fkey yangilanmadi: %', sqlerrm;
end $$;

-- ------------------------------------------------------------
-- 2) REEL KO'RISHLARI (reel_views)
--    Bir foydalanuvchi bitta reelni faqat BIR MARTA hisoblanadi.
-- ------------------------------------------------------------
create table if not exists public.reel_views (
  id         uuid primary key default gen_random_uuid(),
  reel_id    uuid not null references public.reels (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (reel_id, user_id)
);

create index if not exists idx_reel_views_reel on public.reel_views (reel_id);
create index if not exists idx_reel_views_user on public.reel_views (user_id);

comment on table public.reel_views is
  'Reels (qisqa videolar) uchun noyob ko''rishlar hisobi';

alter table public.reel_views enable row level security;

-- Hamma ko'rishlar sonini o'qiy oladi (statistika uchun)
drop policy if exists "zikra_read_reel_views" on public.reel_views;
create policy "zikra_read_reel_views" on public.reel_views
  for select using (true);

-- Foydalanuvchi faqat O'ZI nomidan ko'rish qo'sha oladi
drop policy if exists "zikra_insert_own_reel_views" on public.reel_views;
create policy "zikra_insert_own_reel_views" on public.reel_views
  for insert to authenticated
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3) REEL IZOHLARI (reel_comments)
-- ------------------------------------------------------------
create table if not exists public.reel_comments (
  id           uuid primary key default gen_random_uuid(),
  reel_id      uuid not null references public.reels (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  comment_text text not null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_reel_comments_reel on public.reel_comments (reel_id, created_at desc);
create index if not exists idx_reel_comments_user on public.reel_comments (user_id);

comment on table public.reel_comments is
  'Reels (qisqa videolar) uchun izohlar. Har bir izoh bitta reelga tegishli.';

alter table public.reel_comments enable row level security;

-- Hamma izohlarni o'qiy oladi
drop policy if exists "zikra_read_reel_comments" on public.reel_comments;
create policy "zikra_read_reel_comments" on public.reel_comments
  for select using (true);

-- Foydalanuvchi faqat O'ZI nomidan izoh qo'sha oladi
drop policy if exists "zikra_insert_own_reel_comments" on public.reel_comments;
create policy "zikra_insert_own_reel_comments" on public.reel_comments
  for insert to authenticated
  with check (auth.uid() = user_id);

-- Foydalanuvchi faqat O'ZINING izohini o'chira oladi
drop policy if exists "zikra_delete_own_reel_comments" on public.reel_comments;
create policy "zikra_delete_own_reel_comments" on public.reel_comments
  for delete to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4) REALTIME — like va izohlar sonini real vaqtda yangilash uchun
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reel_likes'
  ) then
    alter publication supabase_realtime add table public.reel_likes;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reel_comments'
  ) then
    alter publication supabase_realtime add table public.reel_comments;
  end if;
end $$;

-- ============================================================
-- TUGADI
-- ============================================================
