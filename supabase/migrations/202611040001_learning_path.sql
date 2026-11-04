-- Zikra Learning Path: minimal persistence schema
-- Run in Supabase SQL Editor. Does not alter existing platform tables.
create table if not exists public.learning_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  streak integer not null default 0 check (streak >= 0),
  hearts integer not null default 5 check (hearts between 0 and 5),
  last_active_on date,
  updated_at timestamptz not null default now()
);
create table if not exists public.learning_completions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null check (track_id in ('english','coding','cyber')),
  lesson_id integer not null check (lesson_id between 1 and 5),
  accuracy integer not null check (accuracy between 0 and 100),
  xp_earned integer not null check (xp_earned >= 0),
  completed_at timestamptz not null default now(),
  unique(user_id, track_id, lesson_id)
);
alter table public.learning_profiles enable row level security;
alter table public.learning_completions enable row level security;
drop policy if exists "read own learning profile" on public.learning_profiles;
create policy "read own learning profile" on public.learning_profiles for select to authenticated using (auth.uid() = user_id);
drop policy if exists "read own learning completions" on public.learning_completions;
create policy "read own learning completions" on public.learning_completions for select to authenticated using (auth.uid() = user_id);
-- Writes are intentionally through a SECURITY DEFINER RPC; client direct writes remain denied.
create or replace function public.learning_get_progress()
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid := auth.uid(); p public.learning_profiles%rowtype; done jsonb;
begin
 if uid is null then raise exception 'auth required'; end if;
 insert into public.learning_profiles(user_id) values(uid) on conflict(user_id) do nothing;
 select * into p from public.learning_profiles where user_id=uid;
 select coalesce(jsonb_object_agg(track_id, lessons),'{}'::jsonb) into done from (
   select track_id,jsonb_agg(lesson_id order by lesson_id) lessons from public.learning_completions where user_id=uid group by track_id
 ) s;
 return jsonb_build_object('xp',p.xp,'streak',p.streak,'hearts',p.hearts,'completed',done);
end $$;
create or replace function public.learning_complete_lesson(p_track_id text,p_lesson_id integer,p_accuracy integer)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid := auth.uid(); p public.learning_profiles%rowtype; already boolean; prev_count integer; award integer; today_ date := (now() at time zone 'Asia/Tashkent')::date; completed_map jsonb;
begin
 if uid is null then raise exception 'auth required'; end if;
 if p_track_id not in ('english','coding','cyber') or p_lesson_id not between 1 and 5 or p_accuracy not between 0 and 100 then raise exception 'invalid input'; end if;
 insert into public.learning_profiles(user_id) values(uid) on conflict(user_id) do nothing;
 select * into p from public.learning_profiles where user_id=uid for update;
 select exists(select 1 from public.learning_completions where user_id=uid and track_id=p_track_id and lesson_id=p_lesson_id) into already;
 if not already then
   select count(*) into prev_count from public.learning_completions where user_id=uid and track_id=p_track_id;
   if p_lesson_id <> prev_count + 1 then raise exception 'finish previous lesson first'; end if;
   award := greatest(5,round(greatest(0,least(100,p_accuracy))::numeric/100*20)::integer);
   insert into public.learning_completions(user_id,track_id,lesson_id,accuracy,xp_earned) values(uid,p_track_id,p_lesson_id,p_accuracy,award);
   update public.learning_profiles set xp=xp+award,
    streak=case when last_active_on=today_ then streak when last_active_on=today_-1 then streak+1 else 1 end,
    last_active_on=today_,updated_at=now()
    where user_id=uid returning * into p;
 end if;
 select coalesce(jsonb_object_agg(track_id,lessons),'{}'::jsonb) into completed_map from (
   select track_id,jsonb_agg(lesson_id order by lesson_id) lessons from public.learning_completions where user_id=uid group by track_id
 ) s;
 return jsonb_build_object('xp',p.xp,'streak',p.streak,'hearts',p.hearts,'completed',completed_map);
end $$;
revoke all on function public.learning_get_progress() from public;
revoke all on function public.learning_complete_lesson(text,integer,integer) from public;
grant execute on function public.learning_get_progress() to authenticated;
grant execute on function public.learning_complete_lesson(text,integer,integer) to authenticated;
