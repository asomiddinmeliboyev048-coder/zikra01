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


-- Publish a small, code-verified starter knowledge base.
-- Older installations may already have this table without the newer knowledge columns.
-- CREATE TABLE IF NOT EXISTS does not add columns to an existing table.
alter table public.zikra_project_knowledge
  add column if not exists slug text,
  add column if not exists category text not null default 'platform',
  add column if not exists source_path text,
  add column if not exists status text not null default 'draft',
  add column if not exists version integer not null default 1,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- ON CONFLICT (slug) requires a non-partial unique index/constraint.
drop index if exists public.zikra_project_knowledge_slug_uidx;
create unique index zikra_project_knowledge_slug_uidx
  on public.zikra_project_knowledge(slug);

insert into public.zikra_project_knowledge(slug,title,content,category,source_path,status)
values
('platform-overview','Zikra platformasi','Zikra — foydalanuvchilar o‘zaro ko‘nikma o‘rgatishi va o‘rganishi uchun mo‘ljallangan P2P ta’lim platformasi. Foydalanuvchilar profil yaratadi, o‘rgata oladigan va o‘rganmoqchi bo‘lgan ko‘nikmalarini belgilaydi, mos hamkorlarni topadi.','platform','README.md','published'),
('discovery','Kashf etish va mentor topish','/discovery sahifasida foydalanuvchilar o‘zaro teach/learn ko‘nikmalari asosida mos hamkorlarni topishi mumkin. Profillar, ko‘nikmalar va moslik ko‘rsatkichi ko‘rsatiladi.','feature','src/app/discovery/page.tsx','published'),
('direct-chat','Suhbatlar','/chat sahifasi foydalanuvchilar o‘rtasidagi shaxsiy xabar almashish uchun ishlatiladi.','feature','src/app/chat/page.tsx','published'),
('video-lessons','Video darslar','/videos sahifasida platformaga yuklangan va published holatidagi video darslar ko‘rsatiladi. Video darslar ko‘nikmalar bilan bog‘langan.','feature','src/app/videos/page.tsx','published'),
('reels','Reels','/reels bo‘limi qisqa videolarni ko‘rish va ular bilan o‘zaro aloqa qilish uchun mo‘ljallangan.','feature','src/app/reels','published'),
('learning-path','Rivojlanish','Rivojlanish yo‘li foydalanuvchining ko‘nikmalar bo‘yicha bosqichma-bosqich o‘rganishini qo‘llab-quvvatlaydi. Asosiy sahifaga navigatsiyada /learn orqali kiriladi; darslar tajribasi /lessons sahifasida mavjud.','feature','src/app/lessons/page.tsx','published'),
('ziyo-ai','Ziyo AI Ustoz','Ziyo AI Ustoz — Zikra AI platforma yordamchisidan alohida shaxsiy ta’lim murabbiyi. U /ai-ustoz bo‘limida ishlaydi; foydalanuvchiga ko‘nikma mashqlari va o‘quv suhbatlarida yordam beradi.','feature','src/app/ai-ustoz','published')
on conflict (slug) do update set
  title = excluded.title,
  content = excluded.content,
  category = excluded.category,
  source_path = excluded.source_path,
  status = excluded.status,
  version = public.zikra_project_knowledge.version + 1,
  updated_at = now();

-- Allow a mentor to accept or reject only requests addressed to them.
create or replace function public.zikra_ai_respond_mentor_request(
  p_request_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'authentication required'; end if;
  if p_status not in ('accepted', 'rejected') then raise exception 'invalid status'; end if;

  update public.zikra_mentor_requests
  set status = p_status, updated_at = now()
  where id = p_request_id
    and mentor_id = uid
    and status = 'pending';

  if not found then raise exception 'request not found or already handled'; end if;
end;
$$;

revoke all on function public.zikra_ai_respond_mentor_request(uuid, text) from public;
grant execute on function public.zikra_ai_respond_mentor_request(uuid, text) to authenticated;
