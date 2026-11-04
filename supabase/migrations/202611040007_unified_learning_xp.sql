-- Unified XP ledger: historical learning rewards are credited once to profiles.xp.
-- New lesson and daily-task rewards are added atomically by their SECURITY DEFINER RPCs.
-- Apply after migrations 001, 004, 005 and 006.

create table if not exists public.learning_xp_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('lesson','daily_task')),
  source_key text not null,
  amount integer not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique(user_id, source, source_key)
);
alter table public.learning_xp_events enable row level security;
drop policy if exists "read own learning xp events" on public.learning_xp_events;
create policy "read own learning xp events" on public.learning_xp_events
  for select to authenticated using (auth.uid() = user_id);

-- Record and credit old lesson XP exactly once. Existing profiles.xp is preserved.
with credited as (
  insert into public.learning_xp_events(user_id,source,source_key,amount)
  select user_id,'lesson',track_id || ':' || lesson_id::text,xp_earned
  from public.learning_completions
  on conflict(user_id,source,source_key) do nothing
  returning user_id,amount
), totals as (
  select user_id,sum(amount)::integer amount from credited group by user_id
)
update public.profiles p set xp=p.xp+t.amount
from totals t where p.id=t.user_id;

-- Lesson rewards now contribute to both the learning record and platform-wide XP.
create or replace function public.learning_complete_lesson(p_track_id text,p_lesson_id integer,p_accuracy integer)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 uid uuid := auth.uid();
 lp public.learning_profiles%rowtype;
 already boolean;
 prev_count integer;
 award integer;
 today_ date := (now() at time zone 'Asia/Tashkent')::date;
 completed_map jsonb;
 platform_xp integer;
begin
 if uid is null then raise exception 'auth required'; end if;
 if p_track_id not in ('english','coding','cyber') or p_lesson_id not between 1 and 5 or p_accuracy not between 0 and 100 then
   raise exception 'invalid input';
 end if;
 insert into public.learning_profiles(user_id) values(uid) on conflict(user_id) do nothing;
 insert into public.profiles(id) values(uid) on conflict(id) do nothing;
 select * into lp from public.learning_profiles where user_id=uid for update;
 select exists(select 1 from public.learning_completions where user_id=uid and track_id=p_track_id and lesson_id=p_lesson_id) into already;
 if not already then
   select count(*) into prev_count from public.learning_completions where user_id=uid and track_id=p_track_id;
   if p_lesson_id <> prev_count+1 then raise exception 'finish previous lesson first'; end if;
   award := greatest(5,round(greatest(0,least(100,p_accuracy))::numeric/100*20)::integer);
   insert into public.learning_completions(user_id,track_id,lesson_id,accuracy,xp_earned)
     values(uid,p_track_id,p_lesson_id,p_accuracy,award);
   insert into public.learning_xp_events(user_id,source,source_key,amount)
     values(uid,'lesson',p_track_id || ':' || p_lesson_id::text,award)
     on conflict(user_id,source,source_key) do nothing;
   if found then
     update public.profiles set xp=xp+award where id=uid;
   end if;
   update public.learning_profiles set xp=xp+award,
     streak=case when last_active_on=today_ then streak when last_active_on=today_-1 then streak+1 else 1 end,
     last_active_on=today_,updated_at=now()
   where user_id=uid returning * into lp;
 end if;
 select xp into platform_xp from public.profiles where id=uid;
 select coalesce(jsonb_object_agg(track_id,lessons),'{}'::jsonb) into completed_map from (
   select track_id,jsonb_agg(lesson_id order by lesson_id) lessons from public.learning_completions where user_id=uid group by track_id
 ) s;
 return jsonb_build_object('xp',coalesce(platform_xp,0),'learning_xp',lp.xp,'streak',lp.streak,'hearts',lp.hearts,'completed',completed_map);
end $$;

create or replace function public.learning_get_progress()
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid := auth.uid(); p public.learning_profiles%rowtype; done jsonb; platform_xp integer;
begin
 if uid is null then raise exception 'auth required'; end if;
 insert into public.learning_profiles(user_id) values(uid) on conflict(user_id) do nothing;
 insert into public.profiles(id) values(uid) on conflict(id) do nothing;
 select * into p from public.learning_profiles where user_id=uid;
 select xp into platform_xp from public.profiles where id=uid;
 select coalesce(jsonb_object_agg(track_id,lessons),'{}'::jsonb) into done from (
   select track_id,jsonb_agg(lesson_id order by lesson_id) lessons from public.learning_completions where user_id=uid group by track_id
 ) s;
 return jsonb_build_object('xp',coalesce(platform_xp,0),'learning_xp',p.xp,'streak',p.streak,'hearts',p.hearts,'completed',done);
end $$;

-- Daily tasks award 10 XP; perfect score adds 5; the fifth completion adds a one-time +20.
alter table public.daily_task_completions
  drop constraint if exists daily_task_completions_xp_awarded_check;
alter table public.daily_task_completions
  add constraint daily_task_completions_xp_awarded_check check (xp_awarded >= 0);

create or replace function public.complete_daily_task(p_index int, p_correct int, p_total int)
returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare
 uid uuid := auth.uid();
 today_ date := (now() at time zone 'Asia/Tashkent')::date;
 previous_count integer;
 inserted_id bigint;
 done_count integer;
 award integer;
 lp public.learning_profiles%rowtype;
 platform_xp integer;
begin
 if uid is null then raise exception 'auth required'; end if;
 if p_index is null or p_index not between 0 and 4
    or p_total is null or p_total not between 1 and 10
    or p_correct is null or p_correct < 0 or p_correct > p_total
    or p_correct * 100 < p_total * 60 then
   raise exception 'invalid task score';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text || ':' || today_::text,0));
 insert into public.learning_profiles(user_id) values(uid) on conflict(user_id) do nothing;
 insert into public.profiles(id) values(uid) on conflict(id) do nothing;
 select * into lp from public.learning_profiles where user_id=uid for update;
 select count(*) into previous_count from public.daily_task_completions where user_id=uid and task_date=today_;
 if exists(select 1 from public.daily_task_completions where user_id=uid and task_date=today_ and task_index=p_index) then
   select xp into platform_xp from public.profiles where id=uid;
   return jsonb_build_object('xp',0,'total_xp',coalesce(platform_xp,0),'already',true,'day_completed',previous_count=5);
 end if;
 if p_index <> previous_count then raise exception 'finish previous daily task first'; end if;

 award := 10 + case when p_correct=p_total then 5 else 0 end;
 if p_index=4 then award := award+20; end if;
 insert into public.daily_task_completions(user_id,task_date,task_index,correct,total,xp_awarded)
 values(uid,today_,p_index,p_correct,p_total,award)
 on conflict(user_id,task_date,task_index) do nothing returning id into inserted_id;
 if inserted_id is null then
   select xp into platform_xp from public.profiles where id=uid;
   return jsonb_build_object('xp',0,'total_xp',coalesce(platform_xp,0),'already',true,'day_completed',previous_count=5);
 end if;
 insert into public.learning_xp_events(user_id,source,source_key,amount)
 values(uid,'daily_task',today_::text || ':' || p_index::text,award)
 on conflict(user_id,source,source_key) do nothing;
 if found then update public.profiles set xp=xp+award where id=uid; end if;
 update public.learning_profiles set xp=xp+award,
   streak=case when last_active_on=today_ then streak when last_active_on=today_-1 then streak+1 else 1 end,
   last_active_on=today_,updated_at=now()
 where user_id=uid returning * into lp;
 select count(*) into done_count from public.daily_task_completions where user_id=uid and task_date=today_;
 select xp into platform_xp from public.profiles where id=uid;
 return jsonb_build_object('xp',award,'total_xp',coalesce(platform_xp,0),'already',false,'day_completed',done_count=5);
end $$;

revoke all on function public.learning_get_progress() from public,anon;
revoke all on function public.learning_complete_lesson(text,integer,integer) from public,anon;
revoke all on function public.complete_daily_task(int,int,int) from public,anon;
grant execute on function public.learning_get_progress() to authenticated;
grant execute on function public.learning_complete_lesson(text,integer,integer) to authenticated;
grant execute on function public.complete_daily_task(int,int,int) to authenticated;
