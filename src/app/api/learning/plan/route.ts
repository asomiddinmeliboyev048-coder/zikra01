import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const tracks = ["english", "russian", "coding", "cyber"];
const levels: Record<string, string[]> = {
  english: ["A1","A2","B1","B2","C1","C2"],
  russian: ["A1","A2","B1","B2","C1","C2"],
  coding: ["Boshlang‘ich","Asosiy","O‘rta","Yaxshi","Ilg‘or","Ekspert"],
  cyber: ["Boshlang‘ich","Asosiy","O‘rta","Yaxshi","Ilg‘or","Ekspert"],
};

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Avtorizatsiya talab qilinadi." }, { status: 401 });
  const track = new URL(request.url).searchParams.get("track");
  if (!track || !tracks.includes(track)) return NextResponse.json({ error: "Yo‘nalish noto‘g‘ri." }, { status: 400 });
  const { data, error } = await supabase.from("learning_plans").select("*").eq("user_id", user.id).eq("track_id", track).maybeSingle();
  if (error) return NextResponse.json({ error: "O‘quv xaritasini yuklab bo‘lmadi." }, { status: 503 });
  return NextResponse.json({ plan: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Avtorizatsiya talab qilinadi." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Noto‘g‘ri so‘rov." }, { status: 400 }); }
  const track = String(body.trackId || "");
  const purpose = String(body.purpose || "");
  const currentLevel = String(body.currentLevel || "");
  const targetLevel = String(body.targetLevel || "");
  const dailyMinutes = Number(body.dailyMinutes);
  const targetDate = body.targetDate ? String(body.targetDate) : null;
  const learningStyle = String(body.learningStyle || "");
  const interests = Array.isArray(body.interests) ? body.interests.filter((v): v is string => typeof v === "string").slice(0, 8) : [];
  if (!tracks.includes(track) || !purpose || purpose.length > 100 || !levels[track].includes(currentLevel) || !levels[track].includes(targetLevel) || levels[track].indexOf(targetLevel) < levels[track].indexOf(currentLevel) || ![15,30,45,60].includes(dailyMinutes) || !["video","practice","reading","mixed"].includes(learningStyle)) {
    return NextResponse.json({ error: "Tanlangan maqsad yoki o‘quv sozlamalari noto‘g‘ri." }, { status: 400 });
  }
  if (targetDate && (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate) || Number.isNaN(Date.parse(targetDate)))) return NextResponse.json({ error: "Maqsad sanasi noto‘g‘ri." }, { status: 400 });
  const { data, error } = await supabase.from("learning_plans").upsert({
    user_id: user.id, track_id: track, purpose, current_level: currentLevel,
    target_level: targetLevel, daily_minutes: dailyMinutes, target_date: targetDate,
    learning_style: learningStyle, interests, status: "active", updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,track_id" }).select("*").single();
  if (error) {
    console.error("[learning-plan]", error.message);
    return NextResponse.json({ error: "Xaritani saqlab bo‘lmadi. Supabase migratsiyasini tekshiring." }, { status: 503 });
  }
  return NextResponse.json({ plan: data });
}
