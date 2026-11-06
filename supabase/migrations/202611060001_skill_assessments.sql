-- Skill diagnostics: persist assessment history without changing XP or lesson progress.
create table if not exists public.skill_assessments (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null check (track_id in ('english','coding','cyber')),
  score integer not null check (score between 0 and 10),
  total integer not null default 10 check (total = 10),
  level text not null,
  answers jsonb not null default '[]'::jsonb,
  assessed_at timestamptz not null default now()
);
create index if not exists skill_assessments_user_track_date_idx
  on public.skill_assessments(user_id, track_id, assessed_at desc);
alter table public.skill_assessments enable row level security;
drop policy if exists "read own skill assessments" on public.skill_assessments;
create policy "read own skill assessments" on public.skill_assessments
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "insert own skill assessments" on public.skill_assessments;
create policy "insert own skill assessments" on public.skill_assessments
  for insert to authenticated with check (auth.uid() = user_id);
grant select, insert on public.skill_assessments to authenticated;
grant usage, select on sequence public.skill_assessments_id_seq to authenticated;
