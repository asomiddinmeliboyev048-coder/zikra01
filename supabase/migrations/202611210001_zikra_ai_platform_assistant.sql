-- Zikra AI platform assistant: isolated data model.
-- This migration intentionally does not alter Ziyo AI, learning-path, or Duel XP tables.

create table if not exists public.zikra_ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Yangi suhbat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.zikra_ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.zikra_ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 12000),
  created_at timestamptz not null default now()
);

create table if not exists public.zikra_project_knowledge (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  content text not null,
  category text not null default 'platform',
  source_path text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.zikra_ai_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mentor_request_mode text not null default 'confirm'
    check (mentor_request_mode in ('confirm', 'automatic')),
  automatic_requests_enabled boolean not null default false,
  allowed_request_categories text[] not null default '{}',
  updated_at timestamptz not null default now(),
  constraint automatic_requires_opt_in
    check (mentor_request_mode <> 'automatic' or automatic_requests_enabled = true)
);

create table if not exists public.zikra_mentor_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  mentor_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null,
  message text not null default '',
  source text not null default 'zikra_ai'
    check (source in ('zikra_ai', 'user')),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mentor_request_not_self check (requester_id <> mentor_id)
);

create table if not exists public.zikra_project_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  source text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists zikra_ai_conversations_user_updated_idx
  on public.zikra_ai_conversations(user_id, updated_at desc);
create index if not exists zikra_ai_messages_conversation_created_idx
  on public.zikra_ai_messages(conversation_id, created_at);
create index if not exists zikra_ai_messages_user_created_idx
  on public.zikra_ai_messages(user_id, created_at desc);
create index if not exists zikra_project_knowledge_status_category_idx
  on public.zikra_project_knowledge(status, category);
create index if not exists zikra_mentor_requests_requester_created_idx
  on public.zikra_mentor_requests(requester_id, created_at desc);
create index if not exists zikra_mentor_requests_mentor_status_idx
  on public.zikra_mentor_requests(mentor_id, status, created_at desc);
create index if not exists zikra_project_events_unprocessed_idx
  on public.zikra_project_events(created_at)
  where processed_at is null;

alter table public.zikra_ai_conversations enable row level security;
alter table public.zikra_ai_messages enable row level security;
alter table public.zikra_project_knowledge enable row level security;
alter table public.zikra_ai_preferences enable row level security;
alter table public.zikra_mentor_requests enable row level security;
alter table public.zikra_project_events enable row level security;

drop policy if exists "Zikra AI users read own conversations" on public.zikra_ai_conversations;
create policy "Zikra AI users read own conversations"
  on public.zikra_ai_conversations for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Zikra AI users create own conversations" on public.zikra_ai_conversations;
create policy "Zikra AI users create own conversations"
  on public.zikra_ai_conversations for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Zikra AI users update own conversations" on public.zikra_ai_conversations;
create policy "Zikra AI users update own conversations"
  on public.zikra_ai_conversations for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Zikra AI users read own messages" on public.zikra_ai_messages;
create policy "Zikra AI users read own messages"
  on public.zikra_ai_messages for select to authenticated
  using (
    auth.uid() = user_id and exists (
      select 1 from public.zikra_ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Zikra AI users insert own messages" on public.zikra_ai_messages;
create policy "Zikra AI users insert own messages"
  on public.zikra_ai_messages for insert to authenticated
  with check (
    auth.uid() = user_id and exists (
      select 1 from public.zikra_ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users read published Zikra knowledge" on public.zikra_project_knowledge;
create policy "Users read published Zikra knowledge"
  on public.zikra_project_knowledge for select to authenticated
  using (status = 'published');

drop policy if exists "Users manage own Zikra AI preferences" on public.zikra_ai_preferences;
create policy "Users manage own Zikra AI preferences"
  on public.zikra_ai_preferences for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Mentor request participants read requests" on public.zikra_mentor_requests;
create policy "Mentor request participants read requests"
  on public.zikra_mentor_requests for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = mentor_id);

drop policy if exists "Users create mentor requests for themselves" on public.zikra_mentor_requests;
create policy "Users create mentor requests for themselves"
  on public.zikra_mentor_requests for insert to authenticated
  with check (auth.uid() = requester_id and requester_id <> mentor_id);

-- No authenticated-user policies are intentionally created for project events.
-- Knowledge publishing and event ingestion are server/admin-only operations.
