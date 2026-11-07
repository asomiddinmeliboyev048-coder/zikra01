-- Zikra Learning Experience: durable plans, assessments and activity history
create extension if not exists pgcrypto;

create table if not exists public.learning_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null check (track_id in ('english','russian','coding','cyber')),
  purpose text not null,
  skill_name text not null,
  current_level text not null,
  target_level text not null,
  daily_minutes integer not null check (daily_minutes in (15,30,45,60)),
  target_date date,
  learning_style text not null check (learning_style in ('video','practice','reading','mixed')),
  interests jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active','completed','paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, track_id)
);

create index if not exists learning_plans_user_updated_idx
  on public.learning_plans(user_id, updated_at desc);

alter table public.learning_plans enable row level security;
drop policy if exists "learning_plans_select_own" on public.learning_plans;
create policy "learning_plans_select_own" on public.learning_plans
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "learning_plans_insert_own" on public.learning_plans;
create policy "learning_plans_insert_own" on public.learning_plans
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "learning_plans_update_own" on public.learning_plans;
create policy "learning_plans_update_own" on public.learning_plans
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.skill_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null check (track_id in ('english','russian','coding','cyber')),
  score integer not null check (score between 0 and 10),
  total integer not null default 10 check (total = 10),
  level text not null,
  answers jsonb not null default '[]'::jsonb,
  practical_response text not null default '',
  practical_passed boolean not null default false,
  evidence_url text,
  evidence_provider text,
  evidence_status text not null default 'unverified',
  assessed_at timestamptz not null default now()
);

create index if not exists skill_assessments_user_track_date_idx
  on public.skill_assessments(user_id, track_id, assessed_at desc);

alter table public.skill_assessments enable row level security;
drop policy if exists "skill_assessments_select_own" on public.skill_assessments;
create policy "skill_assessments_select_own" on public.skill_assessments
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "skill_assessments_insert_own" on public.skill_assessments;
create policy "skill_assessments_insert_own" on public.skill_assessments
  for insert to authenticated with check (auth.uid() = user_id);

create table if not exists public.learning_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null check (track_id in ('english','russian','coding','cyber')),
  skill_name text not null,
  activity_type text not null check (activity_type in ('vocabulary','listening','speaking','writing','diagnostic','game','lesson')),
  item_key text,
  score numeric(6,2),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  details jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now()
);

create index if not exists learning_activity_logs_user_date_idx
  on public.learning_activity_logs(user_id, completed_at desc);
create index if not exists learning_activity_logs_user_track_idx
  on public.learning_activity_logs(user_id, track_id, activity_type);

alter table public.learning_activity_logs enable row level security;
drop policy if exists "learning_activity_logs_select_own" on public.learning_activity_logs;
create policy "learning_activity_logs_select_own" on public.learning_activity_logs
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "learning_activity_logs_insert_own" on public.learning_activity_logs;
create policy "learning_activity_logs_insert_own" on public.learning_activity_logs
  for insert to authenticated with check (auth.uid() = user_id);
