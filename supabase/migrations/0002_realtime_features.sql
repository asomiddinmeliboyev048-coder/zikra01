-- ============================================================
-- Zikra — Real-time funksiyalar migratsiyasi
-- Video qo'ng'iroq (WebRTC), ovozli xabarlar va push bildirishnomalar
-- ============================================================
-- Ushbu faylni Supabase SQL Editor'da yoki `supabase db push` orqali ishga tushiring.

-- ------------------------------------------------------------
-- 1) VIDEO QO'NG'IROQLAR (calls)
--    Native WebRTC ishlatiladi; signaling Supabase Realtime broadcast orqali.
--    Bu jadval faqat "ringing/accepted/..." holatini saqlaydi va qabul
--    qiluvchiga real-time INSERT hodisasi orqali kiruvchi qo'ng'iroqni bildiradi.
-- ------------------------------------------------------------
create table if not exists public.calls (
  id          uuid primary key default gen_random_uuid(),
  channel     text not null,            -- conversationId(caller_id, callee_id)
  caller_id   uuid not null references public.profiles(id) on delete cascade,
  callee_id   uuid not null references public.profiles(id) on delete cascade,
  call_type   text not null default 'video' check (call_type in ('video', 'audio')),
  status      text not null default 'ringing'
              check (status in ('ringing', 'accepted', 'rejected', 'ended', 'missed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists calls_callee_idx  on public.calls (callee_id, status);
create index if not exists calls_caller_idx  on public.calls (caller_id, status);
create index if not exists calls_channel_idx on public.calls (channel);

alter table public.calls enable row level security;

-- Ishtirokchilar (qo'ng'iroq qiluvchi yoki qabul qiluvchi) o'z qo'ng'iroqlarini ko'radi
drop policy if exists "calls_select_participants" on public.calls;
create policy "calls_select_participants" on public.calls
  for select using (auth.uid() = caller_id or auth.uid() = callee_id);

-- Faqat qo'ng'iroq qiluvchining o'zi qo'ng'iroq yarata oladi
drop policy if exists "calls_insert_caller" on public.calls;
create policy "calls_insert_caller" on public.calls
  for insert with check (auth.uid() = caller_id);

-- Ishtirokchilar holatni yangilay oladi (accept / reject / end)
drop policy if exists "calls_update_participants" on public.calls;
create policy "calls_update_participants" on public.calls
  for update using (auth.uid() = caller_id or auth.uid() = callee_id);

-- Realtime publication'ga qo'shish (INSERT/UPDATE hodisalarini olish uchun)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'calls'
  ) then
    alter publication supabase_realtime add table public.calls;
  end if;
end $$;

-- ------------------------------------------------------------
-- 2) PUSH TOKENLAR (push_tokens) — FCM
--    Foydalanuvchining qurilma/brauzer FCM tokeni saqlanadi.
--    Server (Edge Function) shu tokenlarga push yuboradi.
-- ------------------------------------------------------------
create table if not exists public.push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  token       text not null unique,
  platform    text default 'web',
  created_at  timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

drop policy if exists "push_tokens_own" on public.push_tokens;
create policy "push_tokens_own" on public.push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3) OVOZLI XABARLAR
--    Alohida jadval/ustun shart emas: ovozli xabar `messages.content`
--    ichida "voice:<public_url>" konventsiyasi bilan saqlanadi.
--    Audio fayl 'chat' storage bucket'iga yuklanadi.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('chat', 'chat', true)
on conflict (id) do nothing;

-- 'chat' bucket uchun yuklash siyosati (avtorizatsiyalangan foydalanuvchilar)
drop policy if exists "chat_upload_authenticated" on storage.objects;
create policy "chat_upload_authenticated" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat');

drop policy if exists "chat_read_public" on storage.objects;
create policy "chat_read_public" on storage.objects
  for select using (bucket_id = 'chat');
