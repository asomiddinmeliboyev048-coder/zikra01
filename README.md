# Zikra — Learn. Teach. Be remembered.

O'zbekistondagi birinchi **bepul P2P (peer-to-peer) ko'nikma almashish platformasi**.
Foydalanuvchilar pul to'lamasdan bir-biridan o'rganadi:
_"Sen menga Python o'rgat, men senga Ingliz tili o'rgataman."_

Bu repozitoriya platformaning **foydalanuvchiga ko'rinadigan (frontend + backend)** qismidir.
Admin panel alohida repozitoriyada joylashadi.

---

## ✨ Imkoniyatlar

- **Landing sahifa** — hero, jonli statistika, "qanday ishlaydi" va foydalanuvchi kartochkalari
- **Auth** — Email/parol va Google orqali kirish (Supabase Auth)
- **Onboarding** — ism, shahar, bio, avatar, "o'rgata olaman" / "o'rganmoqchiman" taglari
- **Discovery** — moslik algoritmi (o'zaro almashinuv = 100%), qidiruv va filtrlar
- **Ommaviy profil** — ko'nikmalar, reyting, nishonlar, daraja/XP, video darslar, izohlar
- **Real-time chat** — Supabase Realtime orqali, video havola ulashish
- **Video darslar** — Supabase Storage'ga to'g'ridan-to'g'ri yuklash
- **Ikki tomonlama baholash** — 1–5 yulduz, ikkala tomon baholaganda ko'rinadi
- **Gamifikatsiya** — XP, 5 daraja, avtomatik nishonlar, streak (DB triggerlari orqali)
- **Bildirishnomalar** — real-time, sayt ichida

## 🛠 Texnologiyalar

| Qatlam | Texnologiya |
|---|---|
| Frontend + Backend | Next.js 15 (App Router, Server Actions) |
| Dizayn | Tailwind CSS |
| Ma'lumotlar bazasi / Auth / Realtime | Supabase (PostgreSQL) |
| Rasm / Video | Supabase Storage (bepul) |
| Deploy | Vercel |

Brend ranglari: `#534AB7` (binafsha), `#1D9E75` (yashil), `#D85A30` (to'q sariq).

---

## 🚀 Ishga tushirish

### 1. Bog'liqliklarni o'rnatish

```bash
npm install
```

### 2. Supabase'ni sozlash

1. [supabase.com](https://supabase.com) da yangi loyiha yarating.
2. **SQL Editor** ni oching va `supabase/schema.sql` faylining to'liq mazmunini ishga tushiring.
   Bu barcha jadvallar, RLS qoidalari, triggerlar (XP, daraja, nishon, reyting, streak)
   va boshlang'ich ma'lumotlarni (ko'nikmalar, nishonlar) yaratadi.
3. **Authentication → Providers** bo'limida Google provayderini yoqing (ixtiyoriy).
4. **Authentication → URL Configuration** da redirect URL sifatida
   `http://localhost:3000/auth/callback` (va prod manzilingizni) qo'shing.

### 3. Storage'ni sozlash (rasm + video uchun)

Cloudinary KERAK EMAS. Rasm va video **Supabase Storage**'ga yuklanadi.
**SQL Editor**'da `supabase/storage-setup.sql` faylini ishga tushiring —
u `avatars` va `videos` bucketlarini va kerakli qoidalarni yaratadi.

### 4. Muhit o'zgaruvchilari

`.env.example` ni `.env.local` ga nusxalang va to'ldiring:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Dasturni ishga tushirish

```bash
npm run dev
```

`http://localhost:3000` manzilini oching.

---

## ☁️ Vercel'ga deploy

1. Repozitoriyani Vercel'ga ulang.
2. Yuqoridagi muhit o'zgaruvchilarini Vercel **Environment Variables** ga qo'shing
   (`NEXT_PUBLIC_SITE_URL` ni prod domeningizga o'zgartiring).
3. Deploy. Next.js avtomatik aniqlanadi.

---

## 📁 Loyiha tuzilishi

```
src/
├── app/
│   ├── page.tsx              # Landing
│   ├── login, register       # Auth
│   ├── onboarding            # Profil sozlash
│   ├── discovery             # Hamkor topish + moslik
│   ├── profile/[id]          # Ommaviy profil
│   ├── chat                  # Real-time chat
│   ├── videos                # Video darslar + yuklash
│   ├── lessons               # Darslar + ikki tomonlama baholash
│   ├── notifications         # Bildirishnomalar
│   └── actions/              # Server actions
├── components/               # Qayta ishlatiluvchi UI
└── lib/                      # Supabase clientlar, tiplar, helperlar
supabase/schema.sql           # To'liq DB sxemasi (jadvallar, RLS, triggerlar)
```

---

© Zikra. Learn. Teach. Be remembered.
