-- Daily tasks persistence (reward/XP intentionally disabled in this version).
-- Run manually in Supabase SQL Editor after 202611040001_learning_path.sql.
create table if not exists public.daily_task_completions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  task_date date not null,
  task_index smallint not null check (task_index between 0 and 4),
  correct smallint not null check (correct between 0 and 10),
  total smallint not null check (total between 1 and 10),
  xp_awarded integer not null default 0 check (xp_awarded = 0),
  created_at timestamptz not null default now(),
  constraint daily_task_completions_unique unique(user_id, task_date, task_index),
  constraint daily_task_completions_score check (correct <= total)
);

alter table public.daily_task_completions enable row level security;
drop policy if exists "read own daily task completions" on public.daily_task_completions;
create policy "read own daily task completions"
  on public.daily_task_completions for select to authenticated
  using (auth.uid() = user_id);

-- No client INSERT/UPDATE/DELETE policies. Writes only through the validated RPC.
create or replace function public.complete_daily_task(p_index int, p_correct int, p_total int)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  uid uuid := auth.uid();
  today_ date := (now() at time zone 'Asia/Tashkent')::date;
  previous_count integer;
  inserted_id bigint;
  done_count integer;
begin
  if uid is null then raise exception 'auth required'; end if;
  if p_index is null or p_index not between 0 and 4
     or p_total is null or p_total not between 1 and 10
     or p_correct is null or p_correct < 0 or p_correct > p_total
     or p_correct * 100 < p_total * 60 then
    raise exception 'invalid task score';
  end if;

  -- Serialize this user's task completions to prevent simultaneous sequence skips.
  perform pg_advisory_xact_lock(hashtextextended(uid::text || ':' || today_::text, 0));

  select count(*) into previous_count
    from public.daily_task_completions
    where user_id=uid and task_date=today_;

  if exists(select 1 from public.daily_task_completions
            where user_id=uid and task_date=today_ and task_index=p_index) then
    return jsonb_build_object('xp',0,'already',true,'day_completed',previous_count=5);
  end if;

  if p_index <> previous_count then
    raise exception 'finish previous daily task first';
  end if;

  insert into public.daily_task_completions(user_id,task_date,task_index,correct,total,xp_awarded)
    values(uid,today_,p_index,p_correct,p_total,0)
    on conflict(user_id,task_date,task_index) do nothing
    returning id into inserted_id;

  if inserted_id is null then
    return jsonb_build_object('xp',0,'already',true,'day_completed',previous_count=5);
  end if;

  select count(*) into done_count
    from public.daily_task_completions where user_id=uid and task_date=today_;

  return jsonb_build_object('xp',0,'already',false,'day_completed',done_count=5);
end;
$$;

revoke all on function public.complete_daily_task(int,int,int) from public;
revoke all on function public.complete_daily_task(int,int,int) from anon;
grant execute on function public.complete_daily_task(int,int,int) to authenticated;
