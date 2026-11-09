# Zikra AI Ustoz — xotira va tabiiy ovoz sozlamalari

## 1. Supabase xotira migratsiyasi

Supabase Dashboard → SQL Editor → New query bo‘limida quyidagi faylning to‘liq SQL kodini ishga tushiring:

`supabase/migrations/202611090001_ai_tutor_memory.sql`

Ushbu migratsiya:
- har bir `auth.users.id` uchun alohida AI Ustoz profilini saqlaydi;
- tanlangan kurs, avatar va darajani saqlaydi;
- chat va Live transkriptlarini foydalanuvchi bo‘yicha ajratadi;
- RLS orqali foydalanuvchiga faqat o‘z ma’lumotlarini ko‘rish/yozish imkonini beradi.

Migratsiya bajarilmaguncha chatning asosiy Gemini funksiyasi ishlashi mumkin, lekin tarix va sozlamalar saqlanmaydi.

## 2. VoiceLab tabiiy ovozi (ixtiyoriy)

VoiceLab API key yarating. Kalit serverda qolishi kerak — uni frontend yoki GitHub kodiga yozmang.

Vercel → Project → Settings → Environment Variables bo‘limiga qo‘shing:

- `VOICELAB_API_KEY` — VoiceLab developer key (`tts:write`; ovozlar ro‘yxatini olish uchun `tts:read` ham kerak)
- `VOICELAB_UZ_VOICE_ID` — VoiceLab katalogidan tanlangan o‘zbekcha ovoz ID
- `VOICELAB_RU_VOICE_ID` — ixtiyoriy ruscha ovoz ID
- `VOICELAB_EN_VOICE_ID` — ixtiyoriy inglizcha ovoz ID
- `VOICELAB_TTS_MODEL` — ixtiyoriy; default `lison`

VoiceLab hujjatlarida ovozlar `GET /v1/voices?language=uz&model_id=lison` orqali olinadi. Ovoz generatsiyasi `POST /v1/tts` orqali WAV qaytaradi. Zikra server route API kalitini brauzerga chiqarmaydi; VoiceLab sozlanmagan bo‘lsa, interfeys brauzerning SpeechSynthesis fallbackidan foydalanadi.

## 3. Deploydan keyin tekshirish

1. Supabase migratsiyasini bajaring.
2. Vercel environment variables qo‘shilgan bo‘lsa, redeploy qiling.
3. Ikki xil user bilan kirib, biri tanlagan kurs va suhbat tarixi ikkinchisida ko‘rinmasligini tekshiring.
4. Chatda bir mavzuni muhokama qiling, sahifani yangilang, keyin Live suhbatni boshlang — ustoz avvalgi mavzuni kontekst sifatida bilishi kerak.
5. To‘liq ekran tugmasini AI Ustoz sahifasi va 3D Studio sahifasida sinang.

## Muhim cheklov

GLB modelida talk/speech animatsiyasi yoki facial morph targets bo‘lmasa, kod haqiqiy lab-sync yaratolmaydi. Bunday modelda hozircha gapirish indikatori va yengil sahna animatsiyasi ishlaydi. Haqiqiy lab harakati uchun viseme/morph-target yoki riglangan yuz animatsiyali GLB kerak.
