import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assessmentBank, getAssessmentLevel, type AssessmentTrack } from "@/app/lessons/experience-lab/assessment-bank";

export const dynamic = "force-dynamic";
const validTracks: AssessmentTrack[] = ["english", "coding", "cyber"];

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Avtorizatsiya talab qilinadi." }, { status: 401 });
  const track = new URL(request.url).searchParams.get("track") as AssessmentTrack | null;
  if (!track || !validTracks.includes(track)) return NextResponse.json({ error: "Yo‘nalish noto‘g‘ri." }, { status: 400 });
  const { data, error } = await supabase.from("skill_assessments")
    .select("id, track_id, score, total, level, assessed_at")
    .eq("user_id", user.id).eq("track_id", track)
    .order("assessed_at", { ascending: false }).limit(1).maybeSingle();
  if (error) {
    console.error("[skill-assessment GET]", error.message);
    return NextResponse.json({ error: "Diagnostika jadvali tayyor emas. Supabase migratsiyasini tekshiring." }, { status: 503 });
  }
  return NextResponse.json({ assessment: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Avtorizatsiya talab qilinadi." }, { status: 401 });
  let body: { trackId?: unknown; answers?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON so‘rov talab qilinadi." }, { status: 400 }); }
  const track = body.trackId as AssessmentTrack;
  if (!validTracks.includes(track) || !Array.isArray(body.answers) || body.answers.length !== 10) {
    return NextResponse.json({ error: "Diagnostika javoblari noto‘g‘ri." }, { status: 400 });
  }
  const questions = assessmentBank[track];
  const answers = body.answers as unknown[];
  if (!answers.every((answer, index) => Number.isInteger(answer) && Number(answer) >= 0 && Number(answer) < questions[index].choices.length)) {
    return NextResponse.json({ error: "Javob variantlari noto‘g‘ri." }, { status: 400 });
  }
  const detail = questions.map((question, index) => ({
    question_id: question.id,
    selected: Number(answers[index]),
    correct: question.answer,
    is_correct: Number(answers[index]) === question.answer,
  }));
  const score = detail.filter((item) => item.is_correct).length;
  const level = getAssessmentLevel(track, score);
  const { data, error } = await supabase.from("skill_assessments").insert({
    user_id: user.id, track_id: track, score, total: 10, level, answers: detail,
  }).select("id, track_id, score, total, level, assessed_at").single();
  if (error) {
    console.error("[skill-assessment POST]", error.message);
    return NextResponse.json({ error: "Natijani saqlab bo‘lmadi. Supabase migratsiyasini tekshiring." }, { status: 503 });
  }
  return NextResponse.json({ assessment: data });
}
