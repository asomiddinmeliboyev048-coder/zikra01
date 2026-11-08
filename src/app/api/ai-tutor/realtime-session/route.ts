import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const trackNames = {
  english: "ingliz tili",
  russian: "rus tili",
  coding: "dasturlash",
  cyber: "kiberxavfsizlik",
} as const;

type Track = keyof typeof trackNames;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Jonli suhbat uchun tizimga kiring." }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY serverda sozlanmagan." }, { status: 503 });

  let body: { track?: unknown; level?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "So‘rov noto‘g‘ri." }, { status: 400 }); }
  const track = String(body.track || "english") as Track;
  if (!(track in trackNames)) return NextResponse.json({ error: "Ko‘nikma turi noto‘g‘ri." }, { status: 400 });
  const level = String(body.level || "Boshlang‘ich").slice(0, 40);

  const instructions = `Sen Zikra AI Ustoz — Ziyo ismli, tabiiy, hazilkash, mehribon va sabrli jonli ovozli murabbiysan.
Asosiy tushuntirish tili doimo o‘zbek tili. Tanlangan ko‘nikma: ${trackNames[track]}. O‘quvchi darajasi: ${level}.
Suhbatni jonli olib bor: bir vaqtning o‘zida faqat bitta qisqa savol ber, javobni kut, gapini bo‘lma. Ingliz/rus tilini o‘rgatishda savol va mashqlarni o‘rganilayotgan tilda ayt, keyin xatolarni sodda o‘zbekcha tushuntir. Dasturlash va kiberxavfsizlikda amaliy, xavfsiz, darajaga mos misollar ber.
Suhbat tabiiy bo‘lsin, robotdek ro‘yxat o‘qima. O‘rinli yengil hazil qil, lekin darsni chalg‘itma. O‘quvchi gapirayotganida tingla; u tugatgach javob ber. Odatda 1-3 jumla bilan gapir. O‘zingni AI ekaningni yashirma.`;

  try {
    const upstream = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1",
          instructions,
          audio: {
            input: { turn_detection: { type: "server_vad", create_response: true, interrupt_response: true } },
            output: { voice: "marin" },
          },
        },
      }),
      signal: AbortSignal.timeout(20000),
    });
    const payload = await upstream.json();
    if (!upstream.ok) {
      console.error("[zikra-realtime-session]", payload?.error?.message || upstream.status);
      return NextResponse.json({ error: "Jonli ovozli sessiya ochilmadi. API kalit va Realtime API ruxsatini tekshiring." }, { status: 502 });
    }
    const secret = payload?.value || payload?.client_secret?.value;
    if (!secret) return NextResponse.json({ error: "Realtime sessiya kaliti qaytmadi." }, { status: 502 });
    return NextResponse.json({ clientSecret: secret });
  } catch (error) {
    console.error("[zikra-realtime-session]", error);
    return NextResponse.json({ error: "Realtime xizmatiga ulanib bo‘lmadi." }, { status: 503 });
  }
}
