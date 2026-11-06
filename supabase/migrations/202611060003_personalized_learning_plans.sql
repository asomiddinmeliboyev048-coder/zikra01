create table if not exists public.learning_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null check (track_id in ('english','russian','coding','cyber')),
  purpose text not null,
  current_level text not null,
  target_level text not null,
  daily_minutes integer not null check (daily_minutes in (15,30,45,60)),
  target_date date,
  learning_style text not null check (learning_style in ('video','practice','reading','mixed')),
  interests text[] not null default '{}',
  status text not null default 'active' check (status in ('active','paused','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, track_id)
);

alter table public.learning_plans enable row level security;

drop policy if exists "Users can read own learning plans" on public.learning_plans;
create policy "Users can read own learning plans" on public.learning_plans
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own learning plans" on public.learning_plans;
create policy "Users can insert own learning plans" on public.learning_plans
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own learning plans" on public.learning_plans;
create policy "Users can update own learning plans" on public.learning_plans
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists learning_plans_user_status_idx
  on public.learning_plans(user_id, status);
