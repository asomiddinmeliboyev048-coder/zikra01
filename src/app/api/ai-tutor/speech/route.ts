import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ovoz yaratish uchun tizimga kiring." }, { status: 401 });

  const apiKey = process.env.VOICELAB_API_KEY;
  const uzVoice = process.env.VOICELAB_UZ_VOICE_ID;
  const ruVoice = process.env.VOICELAB_RU_VOICE_ID;
  const enVoice = process.env.VOICELAB_EN_VOICE_ID;
  if (!apiKey || !uzVoice) {
    return NextResponse.json({ error: "Tabiiy ovoz xizmati hali sozlanmagan." }, { status: 503 });
  }

  let body: { text?: unknown; track?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Noto‘g‘ri so‘rov." }, { status: 400 }); }
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 5000) : "";
  const track = String(body.track || "english");
  if (!text) return NextResponse.json({ error: "Ovozga aylantirish uchun matn kiriting." }, { status: 400 });
  const language = track === "russian" && ruVoice ? "ru" : track === "english" && enVoice ? "en" : "uz";
  const voiceId = language === "ru" ? ruVoice : language === "en" ? enVoice : uzVoice;

  try {
    const upstream = await fetch("https://api.voicelab.uz/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        text,
        language,
        voice_id: voiceId,
        model_id: process.env.VOICELAB_TTS_MODEL || "lison",
        speed: 0.98,
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!upstream.ok) {
      const detail = (await upstream.text()).slice(0, 400);
      console.error("[ai-tutor/voice]", upstream.status, detail);
      return NextResponse.json({ error: "Tabiiy ovoz yaratilmadi. VoiceLab sozlamalarini tekshiring." }, { status: 502 });
    }
    if (upstream.status === 202) {
      return NextResponse.json({ error: "Ovoz tayyorlanmoqda. Birozdan keyin qayta urinib ko‘ring." }, { status: 202 });
    }
    const audio = await upstream.arrayBuffer();
    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
        "Content-Length": String(audio.byteLength),
      },
    });
  } catch (error) {
    console.error("[ai-tutor/voice]", error);
    return NextResponse.json({ error: "Ovoz xizmatiga ulanib bo‘lmadi." }, { status: 503 });
  }
}
