import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Avval tizimga kiring." }, { status: 401 });

  let body: { mentorId?: unknown; skillId?: unknown; message?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "So‘rov formati noto‘g‘ri." }, { status: 400 }); }

  const mentorId = typeof body.mentorId === "string" ? body.mentorId : "";
  const skillId = typeof body.skillId === "string" ? body.skillId : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 1000) : "";
  if (!mentorId || !skillId || mentorId === user.id) {
    return NextResponse.json({ error: "Mentor yoki ko‘nikma tanlovi noto‘g‘ri." }, { status: 400 });
  }

  const [{ data: mentor }, { data: teaches }] = await Promise.all([
    supabase.from("profiles").select("id").eq("id", mentorId).eq("onboarded", true).maybeSingle(),
    supabase.from("user_skills").select("id").eq("user_id", mentorId).eq("skill_id", skillId).eq("type", "teach").maybeSingle(),
  ]);
  if (!mentor || !teaches) return NextResponse.json({ error: "Bu foydalanuvchi tanlangan ko‘nikmani o‘rgatmaydi." }, { status: 404 });

  const { data: existing } = await supabase.from("zikra_mentor_requests")
    .select("id,status")
    .eq("requester_id", user.id)
    .eq("mentor_id", mentorId)
    .eq("skill_id", skillId)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) return NextResponse.json({ requestId: existing.id, status: "pending", alreadySent: true });

  const { data, error } = await supabase.from("zikra_mentor_requests").insert({
    requester_id: user.id,
    mentor_id: mentorId,
    skill_id: skillId,
    message: message || "Salom! Zikra orqali sizdan ushbu ko‘nikmani o‘rganmoqchiman.",
    source: "zikra_ai",
  }).select("id,status").single();

  if (error || !data) {
    console.error("[zikra-ai/mentor-request]", error?.message);
    return NextResponse.json({ error: "Mentor so‘rovini yuborib bo‘lmadi." }, { status: 503 });
  }
  return NextResponse.json({ requestId: data.id, status: data.status, sent: true });
}
