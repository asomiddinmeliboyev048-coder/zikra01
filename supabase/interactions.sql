-- ============================================================
-- ZIKRA — Izohlar va reaksiyalar
--   1) video_comments  — video darslarga izoh + javob (reply)
--   2) comment_likes    — izohga yurakcha (like)
--   3) message_reactions — chat xabarlariga emoji reaksiya
-- ============================================================
-- schema.sql va social-features.sql dan keyin ishga tushiring.
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 1) VIDEO IZOHLARI
-- ============================================================
create table if not exists public.video_comments (
  id         uuid primary key default gen_random_uuid(),
  video_id   uuid not null references public.videos (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  parent_id  uuid references public.video_comments (id) on delete cascade, -- javob (reply)
  content    text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_video_comments_video on public.video_comments (video_id, created_at);

alter table public.video_comments enable row level security;

drop policy if exists "vc_select_all" on public.video_comments;
create policy "vc_select_all" on public.video_comments for select using (true);
drop policy if exists "vc_insert_own" on public.video_comments;
create policy "vc_insert_own" on public.video_comments
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "vc_delete_own" on public.video_comments;
create policy "vc_delete_own" on public.video_comments
  for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- 2) IZOH LIKE (yurakcha)
-- ============================================================
create table if not exists public.comment_likes (
  id         uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.video_comments (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);
create index if not exists idx_comment_likes_comment on public.comment_likes (comment_id);

alter table public.comment_likes enable row level security;

drop policy if exists "cl_select_all" on public.comment_likes;
create policy "cl_select_all" on public.comment_likes for select using (true);
drop policy if exists "cl_insert_own" on public.comment_likes;
create policy "cl_insert_own" on public.comment_likes
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "cl_delete_own" on public.comment_likes;
create policy "cl_delete_own" on public.comment_likes
  for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- 3) CHAT XABAR REAKSIYALARI (emoji)
-- ============================================================
create table if not exists public.message_reactions (
  id         uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id)   -- bir foydalanuvchi bitta reaksiya (emoji)
);
create index if not exists idx_message_reactions_msg on public.message_reactions (message_id);

alter table public.message_reactions enable row level security;

-- Reaksiyani faqat suhbat ishtirokchilari ko'radi/qo'yadi
drop policy if exists "mr_select_participant" on public.message_reactions;
create policy "mr_select_participant" on public.message_reactions
  for select using (
    exists (
      select 1 from public.messages m
      where m.id = message_id
        and (m.sender_id = auth.uid() or m.receiver_id = auth.uid())
    )
  );
drop policy if exists "mr_insert_own" on public.message_reactions;
create policy "mr_insert_own" on public.message_reactions
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "mr_update_own" on public.message_reactions;
create policy "mr_update_own" on public.message_reactions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "mr_delete_own" on public.message_reactions;
create policy "mr_delete_own" on public.message_reactions
  for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- 4) BILDIRISHNOMA TRIGGERLARI
-- ============================================================

-- Yangi izoh -> video egasiga (va javob bo'lsa, izoh egasiga)
create or replace function public.notify_new_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_uploader uuid;
  v_title text;
  commenter text;
  parent_author uuid;
begin
  select uploader_id, title into v_uploader, v_title from public.videos where id = new.video_id;
  select full_name into commenter from public.profiles where id = new.user_id;

  -- video egasiga
  if v_uploader is not null and v_uploader <> new.user_id then
    insert into public.notifications (user_id, type, message, link)
    values (
      v_uploader,
      'new_comment',
      coalesce(nullif(commenter, ''), 'Kimdir') || ' darsingizga izoh qoldirdi',
      '/videos/' || new.video_id
    );
  end if;

  -- javob bo'lsa, asl izoh egasiga
  if new.parent_id is not null then
    select user_id into parent_author from public.video_comments where id = new.parent_id;
    if parent_author is not null and parent_author <> new.user_id and parent_author <> v_uploader then
      insert into public.notifications (user_id, type, message, link)
      values (
        parent_author,
        'new_comment',
        coalesce(nullif(commenter, ''), 'Kimdir') || ' izohingizga javob berdi',
        '/videos/' || new.video_id
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_new_comment on public.video_comments;
create trigger trg_notify_new_comment
  after insert on public.video_comments
  for each row execute function public.notify_new_comment();

-- ============================================================
-- 5) REALTIME
-- ============================================================
do $$ begin alter publication supabase_realtime add table public.message_reactions; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.video_comments; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.comment_likes; exception when others then null; end $$;

-- ============================================================
-- TUGADI
-- ============================================================
