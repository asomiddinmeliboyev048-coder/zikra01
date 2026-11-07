import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Avtorizatsiya talab qilinadi." }, { status: 401 });

  let body: { expected?: unknown; transcript?: unknown; trackId?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Noto‘g‘ri so‘rov." }, { status: 400 }); }
  const expected = typeof body.expected === "string" ? body.expected.trim().slice(0, 500) : "";
  const transcript = typeof body.transcript === "string" ? body.transcript.trim().slice(0, 500) : "";
  const trackId = String(body.trackId || "");
  if (!expected || !transcript || !["english", "russian", "coding", "cyber"].includes(trackId)) {
    return NextResponse.json({ error: "Tekshirish uchun namuna va aytilgan matn kerak." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI tekshiruvi yoqilmagan. Vercel Environment Variables bo‘limiga GEMINI_API_KEY qo‘shing." }, { status: 503 });
  }

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text:
            "You are a supportive language practice coach. Compare the expected phrase with the browser speech-recognition transcript. This is transcript matching, not acoustic phonetic analysis. Return ONLY valid JSON with keys score (integer 0-100), passed (boolean; true at 65+), feedback (one short sentence in the learner language), praise (short congratulation in the learner language), praiseUz (Uzbek translation). Learner language: " + (trackId === "russian" ? "Russian" : "English") + ". Expected: " + JSON.stringify(expected) + ". Recognized: " + JSON.stringify(transcript)
          }] }],
          generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
        }),
      }
    );
    if (!response.ok) {
      const detail = await response.text();
      console.error("[speech-check Gemini]", response.status, detail.slice(0, 500));
      return NextResponse.json({ error: "AI tekshiruv xizmati hozir javob bermayapti." }, { status: 502 });
    }
    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";
    const result = JSON.parse(text);
    const score = Math.max(0, Math.min(100, Math.round(Number(result.score) || 0)));
    return NextResponse.json({
      score,
      passed: Boolean(result.passed) && score >= 65,
      feedback: String(result.feedback || "Yaxshi urinish. Yana bir bor takrorlang.").slice(0, 220),
      praise: String(result.praise || "Well done!").slice(0, 120),
      praiseUz: String(result.praiseUz || "Ajoyib ish!").slice(0, 160),
      evaluator: "gemini",
    });
  } catch (error) {
    console.error("[speech-check]", error);
    return NextResponse.json({ error: "AI tekshiruvini bajarib bo‘lmadi. Qayta urinib ko‘ring." }, { status: 502 });
  }
}
