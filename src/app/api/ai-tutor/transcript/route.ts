import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Avtorizatsiya talab qilinadi." }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Noto‘g‘ri so‘rov." }, { status: 400 }); }

  const mode = body.mode === "live" ? "live" : "chat";
  const track = String(body.track || "");
  const role = body.role === "assistant" ? "assistant" : "user";
  const content = typeof body.content === "string" ? body.content.trim().slice(0, 8000) : "";

  if (!["english", "russian", "uzbek", "coding", "cyber"].includes(track) || !content) {
    return NextResponse.json({ error: "Suhbat yozuvi noto‘g‘ri." }, { status: 400 });
  }

  const { error } = await supabase.from("ai_tutor_messages").insert({
    user_id: user.id, mode, track, role, content,
  });
  if (error) {
    console.error("[ai-tutor/transcript]", error.message);
    return NextResponse.json({ error: "Suhbat tarixini saqlab bo‘lmadi." }, { status: 503 });
  }
  return NextResponse.json({ saved: true });
}
