-- Zikra AI Ustoz: per-user learning preferences and recent conversation memory.
create table if not exists public.ai_tutor_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_track text not null default 'english'
    check (selected_track in ('english','russian','coding','cyber')),
  level text not null default 'Boshlang‘ich',
  avatar_id text not null default 'teacher'
    check (avatar_id in ('teacher','student')),
  memory_summary text not null default '',
  conversation_history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.ai_tutor_profiles enable row level security;

drop policy if exists "Users can read own AI tutor profile" on public.ai_tutor_profiles;
create policy "Users can read own AI tutor profile"
  on public.ai_tutor_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own AI tutor profile" on public.ai_tutor_profiles;
create policy "Users can insert own AI tutor profile"
  on public.ai_tutor_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own AI tutor profile" on public.ai_tutor_profiles;
create policy "Users can update own AI tutor profile"
  on public.ai_tutor_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists ai_tutor_profiles_updated_at_idx
  on public.ai_tutor_profiles (updated_at desc);

grant select, insert, update on public.ai_tutor_profiles to authenticated;
