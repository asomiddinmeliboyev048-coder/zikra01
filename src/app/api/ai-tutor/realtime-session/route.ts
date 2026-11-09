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
  const level = String(body.level || "Boshlang‘ich").slice(0, 40);
  const avatarId = body.avatarId === "student" ? "student" : "teacher";
  const { data: profile, error: profileError } = await supabase
    .from("ai_tutor_profiles")
    .select("memory_summary, conversation_history, selected_track, level, avatar_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError) {
    // Keep live voice available even before the optional memory migration is applied.
    console.warn("[ai-tutor-live-profile-unavailable]", profileError.message);
  }
  const history = Array.isArray(profile?.conversation_history) ? profile.conversation_history.slice(-12) : [];
  const memory = typeof profile?.memory_summary === "string" ? profile.memory_summary.slice(0, 3000) : "";

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
    return NextResponse.json({
      token,
      model: "models/gemini-3.8-live",
      voiceName: avatarId === "student" ? "Aoede" : "Puck",
      context: {
        memorySummary: memory,
        conversationHistory: history,
        selectedTrack: track,
        level,
        avatarId,
      },
    });
  } catch (error) {
    console.error("[zikra-gemini-live-token]", error);
    return NextResponse.json({ error: "Gemini xizmatiga ulanib bo‘lmadi." }, { status: 503 });
  }
}
