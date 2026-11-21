-- Repair legacy Zikra AI message tables that predate the user_id column.
-- Existing rows are backfilled from their owning conversation; no messages are deleted.

alter table public.zikra_ai_messages
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

update public.zikra_ai_messages as m
set user_id = c.user_id
from public.zikra_ai_conversations as c
where c.id = m.conversation_id
  and m.user_id is null;

-- Fail clearly rather than silently allowing messages without an owner.
do $$
begin
  if exists (
    select 1
    from public.zikra_ai_messages
    where user_id is null
  ) then
    raise exception 'Cannot backfill user_id for every zikra_ai_messages row. Check conversation_id ownership first.';
  end if;
end
$$;

alter table public.zikra_ai_messages
  alter column user_id set not null;

alter table public.zikra_ai_messages enable row level security;

-- Remove the legacy broad policy and recreate narrowly scoped owner policies.
drop policy if exists "Users access messages in own Zikra AI conversations"
  on public.zikra_ai_messages;
drop policy if exists "Zikra AI users read own messages"
  on public.zikra_ai_messages;
drop policy if exists "Zikra AI users insert own messages"
  on public.zikra_ai_messages;

create policy "Zikra AI users read own messages"
  on public.zikra_ai_messages
  for select to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.zikra_ai_conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy "Zikra AI users insert own messages"
  on public.zikra_ai_messages
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and role = 'user'
    and exists (
      select 1
      from public.zikra_ai_conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );
