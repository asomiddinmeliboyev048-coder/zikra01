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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY Vercel server muhitida sozlanmagan." }, { status: 503 });

  let body: { track?: unknown; level?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "So‘rov noto‘g‘ri." }, { status: 400 }); }
  const track = String(body.track || "english") as Track;
  if (!(track in trackNames)) return NextResponse.json({ error: "Ko‘nikma turi noto‘g‘ri." }, { status: 400 });
  const level = String(body.level || "Boshlang‘ich").slice(0, 40);

  const instructions = `Sen Zikra AI Ustoz — Ziyo ismli, tabiiy, hazilkash, mehribon va sabrli jonli ovozli murabbiysan.
MUHIM: foydalanuvchi bilan asosiy muloqot va tushuntirish tili doimo O‘ZBEK TILI bo‘lsin. Tanlangan ko‘nikma: ${trackNames[track]}. O‘quvchi darajasi: ${level}.
Ingliz yoki rus tili tanlansa, o‘sha tilda qisqa savollar va mashqlar ber, lekin xatolarni, grammatikani va yangi so‘zlarni o‘zbekcha tushuntir. Dasturlash va kiberxavfsizlikda amaliy, xavfsiz, darajaga mos misollar ber.
Suhbat jonli va tabiiy bo‘lsin: bir paytda bitta savol ber, javobni kut, foydalanuvchi gapirayotganda bo‘lma. O‘rinli, aqlli va muloyim hazillar qil; kulgili bo‘l, lekin darsni chalg‘itma. Xatolarni muloyim tuzat va foydalanuvchini rag‘batlantir. Javoblar qisqa, og‘zaki suhbatga mos bo‘lsin. O‘zingni AI ekaningni yashirma.`;

  try {
    const now = Date.now();
    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/auth_tokens", {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        uses: 1,
        expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model: "models/gemini-3.8-live",
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: { parts: [{ text: instructions }] },
          },
        },
      }),
      signal: AbortSignal.timeout(20000),
    });
    const payload = await upstream.json();
    if (!upstream.ok) {
      const upstreamMessage = typeof payload?.error?.message === "string"
        ? payload.error.message.slice(0, 500)
        : "Google Gemini API so‘rovni rad etdi.";
      console.error(`[zikra-gemini-live-token] HTTP ${upstream.status}: ${upstreamMessage}`);
      // The Google error message is safe to expose; never return request headers or the API key.
      return NextResponse.json(
        { error: `Gemini API (${upstream.status}): ${upstreamMessage}` },
        { status: 502 },
      );
    }
    const token = payload?.name;
    if (typeof token !== "string" || !token.startsWith("auth_tokens/")) {
      return NextResponse.json({ error: "Gemini Live vaqtinchalik tokeni qaytmadi." }, { status: 502 });
    }
    return NextResponse.json({ token, model: "models/gemini-3.8-live" });
  } catch (error) {
    console.error("[zikra-gemini-live-token]", error);
    return NextResponse.json({ error: "Gemini xizmatiga ulanib bo‘lmadi." }, { status: 503 });
  }
}
