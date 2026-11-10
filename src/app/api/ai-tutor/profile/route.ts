import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const tracks = ["english", "russian", "uzbek", "coding", "cyber"] as const;
type Track = (typeof tracks)[number];

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Avtorizatsiya talab qilinadi." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  }

  const selectedTrack = typeof body.selectedTrack === "string" && tracks.includes(body.selectedTrack as Track)
    ? body.selectedTrack as Track
    : undefined;
  const selectedAvatar = body.avatarId === "teacher" || body.avatarId === "student"
    ? body.avatarId
    : undefined;
  const level = typeof body.level === "string" ? body.level.slice(0, 40) : undefined;

  // Conversation turns are persisted by /api/ai-tutor/transcript.
  // This endpoint only updates the user's tutor preferences, avoiding duplicate history rows.
  const { data: existing, error: readError } = await supabase
    .from("ai_tutor_profiles")
    .select("selected_track,selected_avatar,level,learning_goal,focus_topic,memory_summary")
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError) {
    console.error("[ai-tutor/profile PATCH read]", readError.message);
    return NextResponse.json({ error: "AI Ustoz profilini yuklab bo‘lmadi." }, { status: 503 });
  }

  const { error } = await supabase.from("ai_tutor_profiles").upsert({
    user_id: user.id,
    selected_track: selectedTrack || existing?.selected_track || "english",
    selected_avatar: selectedAvatar || existing?.selected_avatar || "teacher",
    level: level || existing?.level || "Boshlang‘ich",
    learning_goal: existing?.learning_goal || null,
    focus_topic: existing?.focus_topic || null,
    memory_summary: existing?.memory_summary || "",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) {
    console.error("[ai-tutor/profile PATCH]", error.message);
    return NextResponse.json({ error: "AI Ustoz profilini saqlab bo‘lmadi." }, { status: 503 });
  }

  return NextResponse.json({ saved: true });
}
