-- ============================================================
-- ZIKRA — Supabase Storage sozlash (rasm + video yuklash)
-- ============================================================
-- Cloudinary o'rniga Supabase Storage ishlatiladi (O'zbekistonda ishlaydi, bepul).
-- Ushbu skriptni Supabase SQL Editor'da ishga tushiring.
-- ============================================================

-- 1) Bucketlar (ommaviy o'qish uchun)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

-- Chat media (rasm/video) uchun
insert into storage.buckets (id, name, public)
values ('chat', 'chat', true)
on conflict (id) do nothing;

-- 2) Qoidalar (RLS) — storage.objects
-- Ommaviy o'qish (hamma ko'ra oladi)
drop policy if exists "zikra_public_read_avatars" on storage.objects;
create policy "zikra_public_read_avatars" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "zikra_public_read_videos" on storage.objects;
create policy "zikra_public_read_videos" on storage.objects
  for select using (bucket_id = 'videos');

-- Kirgan foydalanuvchi faqat o'z papkasiga yuklaydi (path: <user_id>/fayl)
drop policy if exists "zikra_upload_avatars" on storage.objects;
create policy "zikra_upload_avatars" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "zikra_upload_videos" on storage.objects;
create policy "zikra_upload_videos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- O'z fayllarini yangilash/o'chirish
drop policy if exists "zikra_manage_own_avatars" on storage.objects;
create policy "zikra_manage_own_avatars" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "zikra_delete_own_avatars" on storage.objects;
create policy "zikra_delete_own_avatars" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "zikra_delete_own_videos" on storage.objects;
create policy "zikra_delete_own_videos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Chat media: ommaviy o'qish + kirgan foydalanuvchi o'z papkasiga yuklaydi
drop policy if exists "zikra_public_read_chat" on storage.objects;
create policy "zikra_public_read_chat" on storage.objects
  for select using (bucket_id = 'chat');

drop policy if exists "zikra_upload_chat" on storage.objects;
create policy "zikra_upload_chat" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'chat'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- TUGADI — endi .env'da Cloudinary kerak emas.
-- (Ixtiyoriy) Storage sozlamalarida fayl hajmi chegarasini oshiring:
--   Dashboard -> Storage -> Settings -> "Upload file size limit"
--   (bepul tierda odatda 50MB).
-- ============================================================
