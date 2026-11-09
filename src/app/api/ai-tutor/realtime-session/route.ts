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

  let body: { track?: unknown; level?: unknown; avatarId?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "So‘rov noto‘g‘ri." }, { status: 400 }); }
  const track = String(body.track || "english") as Track;
  if (!(track in trackNames)) return NextResponse.json({ error: "Ko‘nikma turi noto‘g‘ri." }, { status: 400 });
  const level = String(body.level || "Boshlang‘ich").slice(0, 40);\n  const avatarId = body.avatarId === "student" ? "student" : "teacher";\n  const { data: profile, error: profileError } = await supabase\n    .from("ai_tutor_profiles")\n    .select("memory_summary, conversation_history, selected_track, level, avatar_id")\n    .eq("user_id", user.id)\n    .maybeSingle();\n  if (profileError) {\n    console.error("[ai-tutor-live-profile]", profileError.message);\n    return NextResponse.json({ error: "AI Ustoz xotirasi jadvali tayyor emas. Supabase migratsiyasini ishga tushiring." }, { status: 503 });\n  }\n  const history = Array.isArray(profile?.conversation_history) ? profile.conversation_history.slice(-12) : [];\n  const memory = typeof profile?.memory_summary === "string" ? profile.memory_summary.slice(0, 3000) : "";

  try {
    const now = Date.now();
    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/auth_tokens", {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        uses: 1,
        expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
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
    return NextResponse.json({\n      token,\n      model: "models/gemini-3.8-live",\n      voiceName: avatarId === "student" ? "Aoede" : "Puck",\n      context: {\n        memorySummary: memory,\n        conversationHistory: history,\n        selectedTrack: profile?.selected_track || track,\n        level: profile?.level || level,\n        avatarId: profile?.avatar_id || avatarId,\n      },\n    });
  } catch (error) {
    console.error("[zikra-gemini-live-token]", error);
    return NextResponse.json({ error: "Gemini xizmatiga ulanib bo‘lmadi." }, { status: 503 });
  }
}
