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
  const selectedTrack = profile?.selected_track || "english";
  const { data: learningPlan } = await supabase.from("learning_plans")
    .select("skill_name,purpose,current_level,target_level,daily_minutes,learning_style,interests")
    .eq("user_id", user.id).eq("track_id", selectedTrack).maybeSingle();
  return NextResponse.json({ profile, learningPlan: learningPlan || null, messages: (rows || []).reverse() });
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
  const avatar = body.avatar === "student" || body.avatar === "teacher" ? body.avatar : (existing?.selected_avatar || "teacher");
  const learningGoal = typeof body.learningGoal === "string" ? body.learningGoal.slice(0, 240) : (existing?.learning_goal || null);
  const focusTopic = typeof body.focusTopic === "string" ? body.focusTopic.slice(0, 160) : (existing?.focus_topic || null);
  if (!tracks.includes(track as typeof tracks[number])) return NextResponse.json({ error: "Kurs noto‘g‘ri." }, { status: 400 });

  const { error } = await supabase.from("ai_tutor_profiles").upsert({
    user_id: user.id, selected_track: track, selected_avatar: avatar, level, learning_goal: learningGoal,
    focus_topic: focusTopic, updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) {
    console.error("[ai-tutor/context POST]", error.message);
    return NextResponse.json({ error: "O‘quv sozlamalarini saqlab bo‘lmadi. Supabase migratsiyasini tekshiring." }, { status: 503 });
  }
  return NextResponse.json({ saved: true });
}
