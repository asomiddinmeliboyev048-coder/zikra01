-- Repair learning tables created by earlier migrations with older column definitions.
-- Safe to run after 202611070001_learning_experience.sql.

alter table public.learning_plans
  add column if not exists skill_name text;

update public.learning_plans
set skill_name = case track_id
  when 'english' then 'Speaking'
  when 'russian' then 'Разговорная речь'
  when 'coding' then 'JavaScript'
  when 'cyber' then 'Tarmoq xavfsizligi'
  else track_id
end
where skill_name is null or btrim(skill_name) = '';

alter table public.learning_plans
  alter column skill_name set not null;

-- Older migration 202611060003 created interests as text[]; the API now stores JSONB.
do $$
declare data_type text;
begin
  select udt_name into data_type
  from information_schema.columns
  where table_schema='public' and table_name='learning_plans' and column_name='interests';

  if data_type = '_text' then
    alter table public.learning_plans
      alter column interests type jsonb using to_jsonb(interests);
  elsif data_type is null then
    alter table public.learning_plans add column interests jsonb not null default '[]'::jsonb;
  end if;
end $$;

alter table public.learning_plans
  alter column interests set default '[]'::jsonb;

-- Older skill_assessments table predates the practical/evidence fields.
alter table public.skill_assessments
  add column if not exists practical_response text not null default '',
  add column if not exists practical_passed boolean not null default false,
  add column if not exists evidence_url text,
  add column if not exists evidence_provider text,
  add column if not exists evidence_status text not null default 'unverified';

-- Previous assessment migration allowed only English, coding and cyber.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid='public.skill_assessments'::regclass
      and contype='c' and pg_get_constraintdef(oid) ilike '%track_id%'
  loop
    execute format('alter table public.skill_assessments drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.skill_assessments
  add constraint skill_assessments_track_id_check
  check (track_id in ('english','russian','coding','cyber'));

create index if not exists learning_plans_user_updated_idx
  on public.learning_plans(user_id, updated_at desc);
create index if not exists skill_assessments_user_track_date_idx
  on public.skill_assessments(user_id, track_id, assessed_at desc);

-- Idempotent practice rewards: each completed exercise can award XP only once.
create table if not exists public.learning_practice_awards (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null check (track_id in ('english','russian','coding','cyber')),
  activity_type text not null check (activity_type in ('listening','speaking','writing','game','lesson')),
  item_key text not null,
  xp_awarded integer not null check (xp_awarded between 1 and 50),
  created_at timestamptz not null default now(),
  unique(user_id, track_id, activity_type, item_key)
);
alter table public.learning_practice_awards enable row level security;
drop policy if exists learning_practice_awards_select_own on public.learning_practice_awards;
create policy learning_practice_awards_select_own on public.learning_practice_awards
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.learning_complete_practice(
  p_track_id text,
  p_activity_type text,
  p_item_key text,
  p_xp integer default 10
) returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  uid uuid := auth.uid();
  award_id bigint;
  total_xp integer;
  safe_xp integer := greatest(1, least(50, coalesce(p_xp,10)));
begin
  if uid is null then raise exception 'auth required'; end if;
  if p_track_id not in ('english','russian','coding','cyber')
     or p_activity_type not in ('listening','speaking','writing','game','lesson')
     or p_item_key is null or length(btrim(p_item_key)) = 0
     or length(p_item_key) > 120 then
    raise exception 'invalid practice completion';
  end if;

  insert into public.learning_profiles(user_id)
  values(uid) on conflict(user_id) do nothing;
  insert into public.profiles(id)
  values(uid) on conflict(id) do nothing;

  insert into public.learning_practice_awards(user_id,track_id,activity_type,item_key,xp_awarded)
  values(uid,p_track_id,p_activity_type,btrim(p_item_key),safe_xp)
  on conflict(user_id,track_id,activity_type,item_key) do nothing
  returning id into award_id;

  if award_id is not null then
    update public.profiles set xp=coalesce(xp,0)+safe_xp where id=uid;
    update public.learning_profiles set xp=coalesce(xp,0)+safe_xp,
      last_active_on=(now() at time zone 'Asia/Tashkent')::date,
      updated_at=now()
    where user_id=uid;
  end if;

  select coalesce(xp,0) into total_xp from public.profiles where id=uid;
  return jsonb_build_object(
    'awarded', award_id is not null,
    'xp', case when award_id is null then 0 else safe_xp end,
    'total_xp', coalesce(total_xp,0)
  );
end $$;

revoke all on function public.learning_complete_practice(text,text,text,integer) from public,anon;
grant execute on function public.learning_complete_practice(text,text,text,integer) to authenticated;
