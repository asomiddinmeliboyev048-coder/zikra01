import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const tracks = ["english", "russian", "coding", "cyber"] as const;
const avatars = ["teacher", "student"] as const;

type Track = (typeof tracks)[number];
type AvatarId = (typeof avatars)[number];
type HistoryItem = { role: "user" | "assistant"; content: string };

function validHistory(value: unknown): HistoryItem[] | null {
  if (!Array.isArray(value)) return null;
  return value.slice(-24).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { role?: unknown; content?: unknown };
    if ((row.role !== "user" && row.role !== "assistant") || typeof row.content !== "string") return [];
    return [{ role: row.role, content: row.content.slice(0, 1200) }];
  });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "AI Ustoz sozlamalari uchun tizimga kiring." }, { status: 401 });

  const { data, error } = await supabase
    .from("ai_tutor_profiles")
    .select("selected_track, level, avatar_id, memory_summary, conversation_history, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[ai-tutor-profile-read]", error.message);
    return NextResponse.json({ error: "AI Ustoz xotirasi jadvali tayyor emas. Supabase migratsiyasini ishga tushiring." }, { status: 503 });
  }

  return NextResponse.json({
    profile: data || {
      selected_track: "english",
      level: "Boshlang‘ich",
      avatar_id: "teacher",
      memory_summary: "",
      conversation_history: [],
      updated_at: null,
    },
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "AI Ustoz xotirasini saqlash uchun tizimga kiring." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "So‘rov formati noto‘g‘ri." }, { status: 400 });
  }

  const update: Record<string, unknown> = { user_id: user.id, updated_at: new Date().toISOString() };
  if (body.selectedTrack !== undefined) {
    if (!tracks.includes(body.selectedTrack as Track)) return NextResponse.json({ error: "Ko‘nikma turi noto‘g‘ri." }, { status: 400 });
    update.selected_track = body.selectedTrack;
  }
  if (body.level !== undefined) update.level = String(body.level).slice(0, 40);
  if (body.avatarId !== undefined) {
    if (!avatars.includes(body.avatarId as AvatarId)) return NextResponse.json({ error: "Avatar turi noto‘g‘ri." }, { status: 400 });
    update.avatar_id = body.avatarId;
  }
  if (body.memorySummary !== undefined) update.memory_summary = String(body.memorySummary).slice(0, 4000);
  if (body.conversationHistory !== undefined) {
    const history = validHistory(body.conversationHistory);
    if (!history) return NextResponse.json({ error: "Suhbat xotirasi formati noto‘g‘ri." }, { status: 400 });
    update.conversation_history = history;
  }

  const { data: existing, error: readError } = await supabase
    .from("ai_tutor_profiles")
    .select("selected_track, level, avatar_id, memory_summary, conversation_history")
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError) {
    console.error("[ai-tutor-profile-read-before-write]", readError.message);
    return NextResponse.json({ error: "AI Ustoz xotirasini o‘qib bo‘lmadi. Supabase migratsiyasini tekshiring." }, { status: 503 });
  }
  const completeUpdate = {
    user_id: user.id,
    selected_track: (update.selected_track as string) || existing?.selected_track || "english",
    level: (update.level as string) || existing?.level || "Boshlang‘ich",
    avatar_id: (update.avatar_id as string) || existing?.avatar_id || "teacher",
    memory_summary: (update.memory_summary as string) ?? existing?.memory_summary ?? "",
    conversation_history: (update.conversation_history as HistoryItem[]) ?? existing?.conversation_history ?? [],
    updated_at: update.updated_at,
  };
  const { data, error } = await supabase
    .from("ai_tutor_profiles")
    .upsert(completeUpdate, { onConflict: "user_id" })
    .select("selected_track, level, avatar_id, memory_summary, conversation_history, updated_at")
    .single();

  if (error) {
    console.error("[ai-tutor-profile-write]", error.message);
    return NextResponse.json({ error: "AI Ustoz xotirasini saqlab bo‘lmadi. Supabase migratsiyasini tekshiring." }, { status: 503 });
  }
  return NextResponse.json({ profile: data });
}
