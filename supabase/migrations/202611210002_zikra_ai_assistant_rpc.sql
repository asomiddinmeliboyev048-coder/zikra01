-- Allow the authenticated owner to persist assistant replies only through a scoped RPC.
-- The function checks conversation ownership and cannot write into another user's thread.
create or replace function public.zikra_ai_save_assistant_message(
  p_conversation_id uuid,
  p_content text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'authentication required';
  end if;
  if p_content is null or char_length(trim(p_content)) = 0 or char_length(p_content) > 12000 then
    raise exception 'invalid assistant message';
  end if;
  if not exists (
    select 1 from public.zikra_ai_conversations
    where id = p_conversation_id and user_id = uid
  ) then
    raise exception 'conversation not found';
  end if;

  insert into public.zikra_ai_messages(conversation_id, user_id, role, content)
  values (p_conversation_id, uid, 'assistant', p_content);
end;
$$;

revoke all on function public.zikra_ai_save_assistant_message(uuid, text) from public;
grant execute on function public.zikra_ai_save_assistant_message(uuid, text) to authenticated;
