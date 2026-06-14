# 🔔 Zikra — Firebase Push (FCM) sozlash qo'llanmasi

Bu qo'llanma ilova **butunlay yopiq** bo'lganda ham xabar va qo'ng'iroq
bildirishnomalari telefonga **tovush bilan** kelishini ta'minlaydi.

> Push (yopiq holatda) faqat shu sozlamalardan keyin ishlaydi. Ilova **ochiq**
> yoki **fon'da** bo'lганda esa Firebase'siz ham bildirishnoma/qo'ng'iroq ishlaydi.

---

## 1-qadam — Firebase loyiha yaratish (bepul)

1. https://console.firebase.google.com ga kiring → **Add project** → nom bering (masalan `zikra`).
2. Google Analytics — ixtiyoriy (o'chirsangiz ham bo'ladi).

## 2-qadam — Web App qo'shish va config olish

1. Loyiha sahifasida **</> (Web)** belgisini bosing → ilovaga nom bering → **Register app**.
2. Ko'rsatilgan `firebaseConfig` dan quyidagilarni `.env.local` ga ko'chiring:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=zikra-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=zikra-xxxxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

## 3-qadam — VAPID kalit (Web Push sertifikati)

1. **Project Settings (⚙️) → Cloud Messaging → Web configuration → Web Push certificates**.
2. **Generate key pair** → chiqqan kalitni ko'chiring:

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BPx...
```

> Shu 6 ta `NEXT_PUBLIC_FIREBASE_*` qiymatni **Vercel → Project → Settings → Environment Variables** ga ham qo'shing.

## 4-qadam — Service Account (server uchun)

1. **Project Settings → Service accounts → Generate new private key** → JSON yuklab oling.
2. JSON ichidan `project_id`, `client_email`, `private_key` ni oling.
3. Supabase'da secret sifatida o'rnating (terminalda):

```bash
supabase secrets set FIREBASE_PROJECT_ID="zikra-xxxxx"
supabase secrets set FIREBASE_CLIENT_EMAIL="firebase-adminsdk-...@zikra-xxxxx.iam.gserviceaccount.com"
supabase secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n....\n-----END PRIVATE KEY-----\n"
```

> `private_key` dagi `\n` belgilarini o'zgartirmang — Edge Function ularni avtomatik to'g'irlaydi.

## 5-qadam — `send-push` Edge Function'ni deploy qilish

```bash
# Supabase CLI o'rnatilgan bo'lsin: https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref <SIZNING_PROJECT_REF>
supabase functions deploy send-push --no-verify-jwt
```

> `--no-verify-jwt` — Webhook ichki chaqiruvi uchun. (Ixtiyoriy xavfsizlik: Webhook
> sarlavhasiga maxfiy kalit qo'shib, funksiyada tekshirishingiz mumkin.)

## 6-qadam — Migratsiyalarni ishga tushirish

`push_tokens` jadvali yaratilgan bo'lsin (agar hali bo'lmasa):

```bash
# Supabase SQL Editor'da quyidagi faylni ishga tushiring:
#   supabase/migrations/0002_realtime_features.sql
```

## 7-qadam — Database Webhook (eng muhim qadam)

Yangi `notifications` yozuvi paydo bo'lganda push yuborilishi uchun:

1. Supabase Dashboard → **Database → Webhooks → Create a new hook**.
2. Sozlamalar:
   - **Name:** `send-push-on-notification`
   - **Table:** `notifications`
   - **Events:** ✅ `Insert`
   - **Type:** `Supabase Edge Functions`
   - **Edge Function:** `send-push`
   - **Method:** `POST`
3. **Create**.

Endi har bir yangi bildirishnoma (xabar yoki qo'ng'iroq) avtomatik push'ga aylanadi.

> Webhook `{ "record": { ...notifications qatori... } }` yuboradi. `send-push`
> funksiyasi `record.user_id`, `record.message`, `record.link` ni o'qiydi.

## 8-qadam — Tekshirish

1. `npm install` (firebase paketi `package.json` da bor).
2. Ilovaga kiring → brauzer **bildirishnomaga ruxsat** so'raydi → **Allow**.
3. Telefoningizda ilovani **"Bosh ekranga qo'shing"** (PWA o'rnating).
4. Boshqa akkauntdan o'zingizga **xabar yozing** yoki **qo'ng'iroq qiling** →
   ilova yopiq bo'lsa ham telefonda push qalqib chiqishi kerak.

---

## 📱 Muhim eslatmalar

- **Android:** PWA o'rnatilgach push to'liq ishlaydi.
- **iPhone (iOS 16.4+):** push faqat ilova **"Bosh ekranga qo'shilgan"** bo'lsa
  ishlaydi (Safari'da oddiy ochilganda — yo'q).
- **Qo'ng'iroqlar:** push "X qo'ng'iroq qilmoqda" deb keladi (tovush bilan).
  Bosib ochasiz va javob berasiz. To'liq-ekran "lock-screen dialer" (haqiqiy
  telefon kabi) faqat **native ilova**da (Capacitor + CallKit / full-screen
  intent) mumkin — PWA chegarasi.
- Sozlanmagan bo'lsa: ilova baribir to'liq ishlaydi, faqat **yopiq holatdagi push**
  bo'lmaydi.

## 🔧 Kerakli env o'zgaruvchilar (xulosa)

| O'zgaruvchi | Qayerda | Manba |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `.env.local` + Vercel | Web app config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `.env.local` + Vercel | Web app config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `.env.local` + Vercel | Web app config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `.env.local` + Vercel | Web app config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `.env.local` + Vercel | Web app config |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | `.env.local` + Vercel | Cloud Messaging → Web Push |
| `FIREBASE_PROJECT_ID` | Supabase secrets | Service account JSON |
| `FIREBASE_CLIENT_EMAIL` | Supabase secrets | Service account JSON |
| `FIREBASE_PRIVATE_KEY` | Supabase secrets | Service account JSON |
