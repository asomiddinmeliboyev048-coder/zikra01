-- ============================================================
-- ZIKRA — Xabarlarni o'chirish uchun RLS siyosati
-- ============================================================
-- Bu skriptni Supabase SQL Editor'da ishga tushiring. IDEMPOTENT.
--
-- MUAMMO: messages jadvalida DELETE siyosati yo'q edi -> xabarni yoki chat
-- tarixini o'chirib bo'lmasdi. Bu siyosat suhbat ishtirokchisiga (sender YOKI
-- receiver) o'z suhbatidagi xabarlarni o'chirishga ruxsat beradi:
--   - bitta xabarni o'chirish (action ichida faqat o'z xabari bilan cheklangan)
--   - butun chat tarixini tozalash (ikkala tomon uchun)
-- ============================================================

drop policy if exists "messages_delete_participant" on public.messages;
create policy "messages_delete_participant" on public.messages
  for delete
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Realtime DELETE hodisalari to'liq ma'lumot bilan kelishi uchun
-- (mijozda o'chirilgan xabar darrov yo'qolishi uchun) — ixtiyoriy, lekin foydali:
alter table public.messages replica identity full;
