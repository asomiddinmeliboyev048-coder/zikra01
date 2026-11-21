import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };
type GeminiPayload = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
  error?: { message?: string };
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getRecommendations(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, message: string) {
  const { data: ownSkills } = await supabase
    .from("user_skills")
    .select("skill_id,type,skill:skills(id,name,category)")
    .eq("user_id", userId);

  const rows = (ownSkills || []) as unknown as Array<{
    skill_id: string; type: string; skill: { id: string; name: string; category: string | null } | null;
  }>;
  const wanted = rows.filter((r) => r.type === "learn" && r.skill).map((r) => r.skill!);
  const messageLower = message.toLocaleLowerCase();
  const relevant = wanted.filter((s) => messageLower.includes(s.name.toLocaleLowerCase()));
  const selectedSkills = relevant.length ? relevant : wanted.slice(0, 3);
  const skillIds = selectedSkills.map((s) => s.id);

  let mentors: Array<{ id: string; full_name: string; username: string | null; avatar_url: string | null; bio: string | null; skills: string[]; skillIds: string[] }> = [];
  let videos: Array<{ id: string; title: string; thumbnail_url: string | null; skill_id: string | null }> = [];

  if (skillIds.length) {
    const { data: teaching } = await supabase
      .from("user_skills")
      .select("user_id,skill_id,skill:skills(name)")
      .eq("type", "teach")
      .in("skill_id", skillIds)
      .neq("user_id", userId)
      .limit(30);

    const teachingRows = (teaching || []) as unknown as Array<{ user_id: string; skill_id: string; skill: { name: string } | null }>;
    const mentorIds = Array.from(new Set(teachingRows.map((r) => r.user_id)));
    if (mentorIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,full_name,username,avatar_url,bio")
        .in("id", mentorIds)
        .eq("onboarded", true)
        .limit(6);
      mentors = (profiles || []).map((p) => ({
        ...p,
        skills: teachingRows.filter((r) => r.user_id === p.id).map((r) => r.skill?.name).filter(Boolean) as string[],
        skillIds: Array.from(new Set(teachingRows.filter((r) => r.user_id === p.id).map((r) => r.skill_id))),
      }));
    }

    const { data: videoRows } = await supabase
      .from("videos")
      .select("id,title,thumbnail_url,skill_id")
      .eq("status", "published")
      .in("skill_id", skillIds)
      .order("created_at", { ascending: false })
      .limit(5);
    videos = videoRows || [];
  }

  return { mentors, videos, learningSkills: selectedSkills.map((s) => s.name) };
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Zikra AI bilan suhbatlashish uchun tizimga kiring.", 401);

  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");
  const { data: conversations, error } = await supabase
    .from("zikra_ai_conversations")
    .select("id,title,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(30);
  if (error) return jsonError("Suhbatlar tarixini yuklab bo‘lmadi.", 503);

  let messages: ChatMessage[] = [];
  if (conversationId) {
    const { data: conversation } = await supabase
      .from("zikra_ai_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!conversation) return jsonError("Suhbat topilmadi.", 404);

    const { data, error: messageError } = await supabase
      .from("zikra_ai_messages")
      .select("role,content")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(60);
    if (messageError) return jsonError("Xabarlarni yuklab bo‘lmadi.", 503);
    messages = (data || []) as ChatMessage[];
  }

  return NextResponse.json({ conversations: conversations || [], messages });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Zikra AI bilan suhbatlashish uchun tizimga kiring.", 401);

  let body: { message?: unknown; conversationId?: unknown };
  try { body = await request.json(); }
  catch { return jsonError("So‘rov formati noto‘g‘ri.", 400); }

  const message = typeof body.message === "string" ? body.message.trim().slice(0, 5000) : "";
  if (!message) return jsonError("Xabar matnini kiriting.", 400);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return jsonError("Gemini AI xizmati ulanmagan. Serverda GEMINI_API_KEY sozlanishi kerak.", 503);

  let conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  if (conversationId) {
    const { data: owned } = await supabase.from("zikra_ai_conversations")
      .select("id").eq("id", conversationId).eq("user_id", user.id).maybeSingle();
    if (!owned) return jsonError("Suhbat topilmadi.", 404);
  } else {
    const title = message.length > 52 ? message.slice(0, 49) + "..." : message;
    const { data: created, error } = await supabase.from("zikra_ai_conversations")
      .insert({ user_id: user.id, title }).select("id").single();
    if (error || !created) return jsonError("Yangi suhbat yaratilmadi.", 503);
    conversationId = created.id;
  }

  const { error: userInsertError } = await supabase.from("zikra_ai_messages").insert({
    conversation_id: conversationId, user_id: user.id, role: "user", content: message,
  });
  if (userInsertError) {
    console.error("[zikra-ai] user message insert failed", {
      code: userInsertError.code,
      message: userInsertError.message,
      details: userInsertError.details,
      hint: userInsertError.hint,
    });
    return jsonError("Xabarni saqlab bo‘lmadi. Server loglarida xatoning kodi va sababi yozildi.", 503);
  }

  const [
    { data: history },
    { data: knowledge },
    { data: profile },
    recommendations,
  ] = await Promise.all([
    supabase.from("zikra_ai_messages").select("role,content")
      .eq("conversation_id", conversationId).eq("user_id", user.id)
      .order("created_at", { ascending: true }).limit(20),
    supabase.from("zikra_project_knowledge").select("title,content,category")
      .eq("status", "published").limit(20),
    supabase.from("profiles").select("full_name,username,bio,city").eq("id", user.id).maybeSingle(),
    /mentor|ustoz|o‘rgat|o'rgat|o‘rgan|o'rgan|dars|video|hamkor/i.test(message)
      ? getRecommendations(supabase, user.id, message)
      : Promise.resolve({ mentors: [], videos: [], learningSkills: [] }),
  ]);

  const knowledgeText = (knowledge || []).map((k) => `[${k.category}] ${k.title}: ${k.content}`).join("\n").slice(0, 14000);
  const recommendationText = [
    recommendations.learningSkills.length ? "Foydalanuvchi o‘rganmoqchi bo‘lgan ko‘nikmalar: " + recommendations.learningSkills.join(", ") : "",
    recommendations.mentors.length ? "Platformada topilgan mentorlar: " + recommendations.mentors.map((m) => `${m.full_name} (@${m.username || "username yo‘q"}) — o‘rgatadi: ${m.skills.join(", ")}; profil: /profile/${m.id}`).join("; ") : "",
    recommendations.videos.length ? "Mos video darslar: " + recommendations.videos.map((v) => `${v.title} (/videos)`).join("; ") : "",
  ].filter(Boolean).join("\n");

  const systemInstruction = `Sen ZIKRA AI — Zikra platformasining aqlli yordamchisisan. Sen Ziyo AI Ustoz emassan: dars o‘tish, bilimni baholash yoki foydalanuvchining o‘quv rejasini boshqarish sening vazifang emas. Buning uchun foydalanuvchini Ziyo AI Ustozga yo‘naltir.
Vazifalaring: Zikra funksiyalarini tushuntirish, foydalanuvchiga platformada yo‘l ko‘rsatish, mos mentorlar va video darslarni topish, platforma xizmatlari haqida savollarga javob berish. Har doim o‘zbek tilida, samimiy, sodda va aniq javob ber; foydalanuvchi boshqa tilda yozsa o‘sha tilda javob ber.
Faqat quyidagi platforma bilimlaridan kelib chiqib, aniq bilmagan narsangni uydirma. Bilim yetarli bo‘lmasa, buni ochiq ayt. Mentor topilgan bo‘lsa, uning ismi, o‘rgatadigan ko‘nikmasi va profil yo‘lini ko‘rsat. AI o‘zi mentor so‘rovini yubormaydi; foydalanuvchidan aniq tasdiq olmaguncha hech qanday so‘rov yaratildi deb aytma. Shaxsiy ma'lumotlarni boshqa foydalanuvchilarga oshkor qilma.
Foydalanuvchi: ${profile?.full_name || "Zikra foydalanuvchisi"}; username: ${profile?.username || "yo‘q"}; bio: ${profile?.bio || "yo‘q"}; shahar: ${profile?.city || "ko‘rsatilmagan"}.
ZIKRA PLATFORMASI HAQIDAGI TASDIQLANGAN BILIMLAR:
${knowledgeText || "Hozircha platforma bilimlar bazasi to‘ldirilmagan. Kodda tasdiqlanmagan funksiyalarni bor deb aytma."}
SO‘ROVGA MOS TOPILGAN MA'LUMOTLAR:
${recommendationText || "Hozircha mos mentor yoki video tavsiyasi topilmadi."}
Agar foydalanuvchi mentor bilan bog‘lanishni xohlasa, avval mos mentorni ko‘rsat va “So‘rov yuborish” tasdig‘ini so‘ra. Hozircha faqat tavsiya ber; so‘rov yuborish funksiyasi alohida tasdiqlash interfeysi orqali bajariladi.`;

  const contents = (history || []).map((row) => ({
    role: row.role === "assistant" ? "model" : "user",
    parts: [{ text: row.content }],
  }));
  const model = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { maxOutputTokens: 700, temperature: 0.55 },
      }),
      signal: AbortSignal.timeout(30000),
    });
    const payload = await upstream.json() as GeminiPayload;
    if (!upstream.ok) {
      console.error("[zikra-ai] Gemini error", upstream.status, payload.error?.message);
      return jsonError("AI javob yaratishda xatolik yuz berdi. Birozdan keyin qayta urinib ko‘ring.", 502);
    }
    const reply = payload.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
    if (!reply) return jsonError("AI hozir javob qaytara olmadi. Qayta urinib ko‘ring.", 502);

    const { error: saveError } = await supabase.rpc("zikra_ai_save_assistant_message", {
      p_conversation_id: conversationId,
      p_content: reply.slice(0, 12000),
    });
    if (saveError) {
      console.error("[zikra-ai] assistant message save failed", saveError.message);
      return jsonError("Javob yaratildi, lekin suhbat tarixiga saqlanmadi. Yangi migratsiyani tekshiring.", 503);
    }

    await supabase.from("zikra_ai_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId).eq("user_id", user.id);

    return NextResponse.json({
      conversationId,
      reply,
      recommendations: {
        mentors: recommendations.mentors,
        videos: recommendations.videos,
      },
      model,
    });
  } catch (error) {
    console.error("[zikra-ai]", error);
    return jsonError("Gemini bilan aloqa uzildi. Keyinroq qayta urinib ko‘ring.", 503);
  }
}
