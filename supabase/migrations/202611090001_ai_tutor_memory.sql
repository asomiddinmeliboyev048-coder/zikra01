-- Zikra AI Ustoz: per-user learning context and conversation history.
-- Run this migration in Supabase SQL Editor before deploying the matching app code.

create table if not exists public.ai_tutor_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_track text not null default 'english'
    check (selected_track in ('english','russian','coding','cyber')),
  level text not null default 'Boshlang‘ich',
  learning_goal text,
  focus_topic text,
  memory_summary text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_tutor_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('chat','live')),
  track text not null check (track in ('english','russian','coding','cyber')),
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) between 1 and 8000),
  created_at timestamptz not null default now()
);

create index if not exists ai_tutor_messages_user_created_idx
  on public.ai_tutor_messages(user_id, created_at desc);

alter table public.ai_tutor_profiles enable row level security;
alter table public.ai_tutor_messages enable row level security;

drop policy if exists "ai tutor profile own read" on public.ai_tutor_profiles;
create policy "ai tutor profile own read" on public.ai_tutor_profiles
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "ai tutor profile own insert" on public.ai_tutor_profiles;
create policy "ai tutor profile own insert" on public.ai_tutor_profiles
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "ai tutor profile own update" on public.ai_tutor_profiles;
create policy "ai tutor profile own update" on public.ai_tutor_profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ai tutor messages own read" on public.ai_tutor_messages;
create policy "ai tutor messages own read" on public.ai_tutor_messages
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "ai tutor messages own insert" on public.ai_tutor_messages;
create policy "ai tutor messages own insert" on public.ai_tutor_messages
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "ai tutor messages own delete" on public.ai_tutor_messages;
create policy "ai tutor messages own delete" on public.ai_tutor_messages
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update on public.ai_tutor_profiles to authenticated;
grant select, insert, delete on public.ai_tutor_messages to authenticated;
