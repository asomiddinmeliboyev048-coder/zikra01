import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const tracks = ["english", "russian", "coding", "cyber"];
const types = ["vocabulary", "listening", "speaking", "writing", "diagnostic", "game", "lesson"];

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Avtorizatsiya talab qilinadi." }, { status: 401 });
  const url = new URL(request.url);
  const track = url.searchParams.get("track");
  if (track && !tracks.includes(track)) return NextResponse.json({ error: "Yo‘nalish noto‘g‘ri." }, { status: 400 });
  let query = supabase.from("learning_activity_logs").select("id,track_id,skill_name,activity_type,item_key,score,duration_seconds,details,completed_at").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(100);
  if (track) query = query.eq("track_id", track);
  const { data, error } = await query;
  if (error) {
    console.error("[learning-activity GET]", error.message);
    return NextResponse.json({ error: "O‘rganish tarixi yuklanmadi. Supabase migratsiyasini tekshiring." }, { status: 503 });
  }
  return NextResponse.json({ activities: data || [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Avtorizatsiya talab qilinadi." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Noto‘g‘ri so‘rov." }, { status: 400 }); }
  const track = String(body.trackId || "");
  const type = String(body.activityType || "");
  const skillName = String(body.skillName || "").slice(0, 80);
  const itemKey = typeof body.itemKey === "string" ? body.itemKey.slice(0, 120) : null;
  const score = typeof body.score === "number" && Number.isFinite(body.score) ? Math.max(0, Math.min(100, body.score)) : null;
  const duration = typeof body.durationSeconds === "number" ? Math.max(0, Math.min(86400, Math.floor(body.durationSeconds))) : 0;
  const details = body.details && typeof body.details === "object" && !Array.isArray(body.details) ? body.details : {};\n  const completed = body.completed === true;
  if (!tracks.includes(track) || !types.includes(type) || !skillName) {
    return NextResponse.json({ error: "Faoliyat ma’lumotlari noto‘g‘ri." }, { status: 400 });
  }
  let reward: { awarded: boolean; xp: number; total_xp: number } | null = null;\n  if (completed) {\n    if (!["listening", "speaking", "writing", "game", "lesson"].includes(type) || !itemKey) {\n      return NextResponse.json({ error: "Bu faoliyat uchun XP berib bo‘lmaydi." }, { status: 400 });\n    }\n    const { data: rewardData, error: rewardError } = await supabase.rpc("learning_complete_practice", {\n      p_track_id: track, p_activity_type: type, p_item_key: itemKey, p_xp: 10,\n    });\n    if (rewardError) {\n      console.error("[learning-practice-xp]", rewardError.message);\n      return NextResponse.json({ error: "XP berilmadi. Supabase XP migratsiyasini bajaring." }, { status: 503 });\n    }\n    reward = rewardData as { awarded: boolean; xp: number; total_xp: number };\n  }\n  const { data, error } = await supabase.from("learning_activity_logs").insert({
    user_id: user.id, track_id: track, skill_name: skillName, activity_type: type,
    item_key: itemKey, score, duration_seconds: duration, details
  }).select("id,completed_at").single();
  if (error) {
    console.error("[learning-activity POST]", error.message);
    return NextResponse.json({ error: "Faoliyat saqlanmadi. Supabase migratsiyasini tekshiring." }, { status: 503 });
  }
  return NextResponse.json({ activity: data, reward });
}
