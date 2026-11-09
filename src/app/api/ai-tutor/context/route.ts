import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const tracks = ["english", "russian", "coding", "cyber"] as const;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Avtorizatsiya talab qilinadi." }, { status: 401 });

  const [{ data: profile, error: profileError }, { data: rows, error: messagesError }] = await Promise.all([
    supabase.from("ai_tutor_profiles").select("selected_track,selected_avatar,level,learning_goal,focus_topic,memory_summary").eq("user_id", user.id).maybeSingle(),
    supabase.from("ai_tutor_messages").select("id,mode,track,role,content,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(40),
  ]);
  if (profileError || messagesError) {
    console.error("[ai-tutor/context GET]", profileError?.message || messagesError?.message);
    return NextResponse.json({ error: "AI Ustoz xotira jadvallari tayyor emas. Supabase migratsiyasini bajaring." }, { status: 503 });
  }
  // The active Rivojlanish roadmap is the source of truth for the tutor's subject.
  // This prevents an old AI-tutor preference from overriding the learner's latest roadmap.
  const { data: activePlan } = await supabase.from("learning_plans")
    .select("track_id,skill_name,purpose,current_level,target_level,daily_minutes,learning_style,interests,status,updated_at")
    .eq("user_id", user.id).eq("status", "active")
    .order("updated_at", { ascending: false }).limit(1).maybeSingle();
  const selectedTrack = activePlan?.track_id || profile?.selected_track || "english";
  const learningPlan = activePlan || (await supabase.from("learning_plans")
    .select("track_id,skill_name,purpose,current_level,target_level,daily_minutes,learning_style,interests,status,updated_at")
    .eq("user_id", user.id).eq("track_id", selectedTrack).maybeSingle()).data;
  return NextResponse.json({ profile, learningPlan: learningPlan || null, selectedTrack, messages: (rows || []).reverse() });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Avtorizatsiya talab qilinadi." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Noto‘g‘ri so‘rov." }, { status: 400 }); }

  const { data: existing } = await supabase.from("ai_tutor_profiles")
    .select("selected_track,selected_avatar,level,learning_goal,focus_topic")
    .eq("user_id", user.id).maybeSingle();
  const track = String(body.track || existing?.selected_track || "english");
  const level = String(body.level || existing?.level || "Boshlang‘ich").slice(0, 40);
  const selectedAvatar = body.selectedAvatar === "teacher" || body.selectedAvatar === "student"\n    ? body.selectedAvatar\n    : existing?.selected_avatar || "student";
  const learningGoal = typeof body.learningGoal === "string" ? body.learningGoal.slice(0, 240) : (existing?.learning_goal || null);
  const focusTopic = typeof body.focusTopic === "string" ? body.focusTopic.slice(0, 160) : (existing?.focus_topic || null);
  if (!tracks.includes(track as typeof tracks[number])) return NextResponse.json({ error: "Kurs noto‘g‘ri." }, { status: 400 });

  const { error } = await supabase.from("ai_tutor_profiles").upsert({
    user_id: user.id, selected_track: track, selected_avatar: selectedAvatar, level, learning_goal: learningGoal,
    focus_topic: focusTopic, updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) {
    console.error("[ai-tutor/context POST]", error.message);
    return NextResponse.json({ error: "O‘quv sozlamalarini saqlab bo‘lmadi. Supabase migratsiyasini tekshiring." }, { status: 503 });
  }
  return NextResponse.json({ saved: true });
}
