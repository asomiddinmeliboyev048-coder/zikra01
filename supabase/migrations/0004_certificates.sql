-- ============================================================
-- ZIKRA — Sertifikat (ishonch) tizimi
-- ============================================================
-- profiles jadvaliga sertifikat maydonlari + 'certificates' storage bucket.
-- Ushbu skriptni Supabase SQL Editor'da ishga tushiring.
-- ============================================================

-- 1) profiles ustunlari
alter table public.profiles
  add column if not exists certificate_url text;

alter table public.profiles
  add column if not exists is_verified boolean not null default false;

-- Tasdiqlash holati: none | pending | approved | rejected
alter table public.profiles
  add column if not exists verification_status text not null default 'none'
  check (verification_status in ('none', 'pending', 'approved', 'rejected'));

create index if not exists idx_profiles_verification_status
  on public.profiles (verification_status);

comment on column public.profiles.certificate_url is
  'O''rgata oladigan fan bo''yicha yuklangan sertifikat (rasm yoki PDF) URL manzili';
comment on column public.profiles.is_verified is
  'Sertifikat admin tomonidan tekshirilib tasdiqlanganmi (ko''k belgi)';
comment on column public.profiles.verification_status is
  'Sertifikat tasdiqlash holati: none/pending/approved/rejected';

-- 2) certificates storage bucket (ommaviy o'qish)
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', true)
on conflict (id) do nothing;

-- 3) Storage RLS qoidalari
-- Ommaviy o'qish (sertifikatni hamma ko'ra oladi)
drop policy if exists "zikra_public_read_certificates" on storage.objects;
create policy "zikra_public_read_certificates" on storage.objects
  for select using (bucket_id = 'certificates');

-- Kirgan foydalanuvchi faqat o'z papkasiga yuklaydi (path: <user_id>/fayl)
drop policy if exists "zikra_upload_certificates" on storage.objects;
create policy "zikra_upload_certificates" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- O'z sertifikatini yangilash/o'chirish
drop policy if exists "zikra_update_own_certificates" on storage.objects;
create policy "zikra_update_own_certificates" on storage.objects
  for update to authenticated
  using (bucket_id = 'certificates' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "zikra_delete_own_certificates" on storage.objects;
create policy "zikra_delete_own_certificates" on storage.objects
  for delete to authenticated
  using (bucket_id = 'certificates' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- TUGADI
-- ============================================================
