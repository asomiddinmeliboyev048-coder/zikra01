-- Prevent client sessions from directly changing protected profile progression fields.
-- Privileged SECURITY DEFINER routines continue to update these fields.
create or replace function public.guard_profile_progress()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('anon','authenticated') then
    if new.xp is distinct from old.xp
       or new.level is distinct from old.level
       or new.streak_days is distinct from old.streak_days
       or new.trust_score is distinct from old.trust_score then
      raise exception 'xp, level, streak va trust_score ni faqat tizim o''zgartira oladi';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_progress on public.profiles;
create trigger trg_guard_profile_progress
  before update on public.profiles
  for each row execute function public.guard_profile_progress();
