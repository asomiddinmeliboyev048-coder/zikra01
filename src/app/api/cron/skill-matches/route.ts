import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/cron/skill-matches
 *
 * Har 3 kunda Vercel Cron tomonidan chaqiriladi (vercel.json'ga qarang).
 * Barcha foydalanuvchilar uchun ko'nikma mosliklarini hisoblab, o'rgatuvchi
 * va o'rganuvchilarga bildirishnoma yuboradi (DB funksiyasi orqali).
 *
 * XAVFSIZLIK:
 *  - Vercel Cron so'rovga `Authorization: Bearer <CRON_SECRET>` sarlavhasini
 *    qo'shadi. Biz uni tekshiramiz, aks holda 401 qaytaramiz.
 *  - Bildirishnomalarni yozish uchun SERVICE ROLE kaliti ishlatiladi
 *    (RLS'ni chetlab o'tadi). Bu kalit faqat serverda.
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");

  // CRON_SECRET o'rnatilgan bo'lsa — majburiy tekshiramiz
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Ruxsat berilmadi." }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Server sozlanmagan (Supabase kalitlari yo'q)." },
      { status: 500 }
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  // Barcha foydalanuvchilar va barcha ko'nikmalar bo'yicha
  const { error } = await supabase.rpc("notify_skill_matches", {
    p_user_id: null,
    p_skill_id: null,
  });

  if (error) {
    console.error("[cron/skill-matches] xatosi:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString() });
}
