import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const tracks = ["english", "russian", "coding", "cyber"] as const;
type Track = (typeof tracks)[number];
const trackNames: Record<Track, string> = {
  english: "ingliz tili",
  russian: "rus tili",
  coding: "dasturlash",
  cyber: "kiberxavfsizlik",
};

type GeminiPart = { text?: string };
type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  error?: { message?: string; status?: string };
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Suhbat uchun tizimga kiring." }, { status: 401 });
  }

  // Text chat and Gemini Live now use the same provider and server-side key.
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini AI xizmati ulanmagan. Vercel Environment Variables bo‘limida GEMINI_API_KEY ni sozlang." },
      { status: 503 },
    );
  }

  let body: { track?: unknown; level?: unknown; messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "So‘rov formati noto‘g‘ri." }, { status: 400 });
  }

  const track = String(body.track || "english") as Track;
  const level = String(body.level || "Boshlang‘ich").slice(0, 40);
  const messages = Array.isArray(body.messages) ? body.messages.slice(-14) : [];
  if (!tracks.includes(track)) {
    return NextResponse.json({ error: "Ko‘nikma turi noto‘g‘ri." }, { status: 400 });
  }

  const safeMessages = messages
    .filter((item): item is { role: string; content: string } =>
      Boolean(item) &&
      typeof item === "object" &&
      ["user", "assistant"].includes(String((item as { role?: unknown }).role)) &&
      typeof (item as { content?: unknown }).content === "string",
    )
    .map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content.slice(0, 1800) }],
    }));

  // The UI may prepend a welcome bubble; Gemini conversation history must begin with a user turn.
  const firstUserIndex = safeMessages.findIndex((message) => message.role === "user");
  const conversation = firstUserIndex >= 0 ? safeMessages.slice(firstUserIndex) : [];
  if (!conversation.length || conversation[conversation.length - 1].role !== "user") {
    return NextResponse.json({ error: "Xabar topilmadi." }, { status: 400 });
  }

  const { data: tutorProfile, error: memoryError } = await supabase
    .from("ai_tutor_profiles")
    .select("learning_goal,focus_topic,memory_summary")
    .eq("user_id", user.id)
    .maybeSingle();
  if (memoryError) console.warn("[zikra-ai-memory-read]", memoryError.message);
  const memoryContext = tutorProfile
    ? `\\nFoydalanuvchining saqlangan o‘quv maqsadi: ${tutorProfile.learning_goal || "ko‘rsatilmagan"}.\\nOxirgi mavzu: ${tutorProfile.focus_topic || "hali belgilanmagan"}.\\nOldingi mashg‘ulotlardan xulosa: ${tutorProfile.memory_summary || "hali yo‘q"}. Ushbu ma’lumotlardan davomiylik uchun foydalan, lekin foydalanuvchi yangi kurs tanlasa uni ustun qo‘y.`
    : "";
  const systemInstruction = `Sen Zikra AI Ustozsan: aqlli, samimiy, hazilkash, sabrli va rag‘batlantiruvchi shaxsiy murabbiy.
Foydalanuvchi bilan ASOSIY TIL sifatida o‘zbek tilida gaplash. Tanlangan yo‘nalish: ${trackNames[track]}. Foydalanuvchi darajasi: ${level}.
Maqsad: foydalanuvchiga aynan shu ko‘nikmani mashq qildirish. Ingliz yoki rus tili tanlansa, qisqa savol va topshiriqlarni o‘rganilayotgan tilda ber, ammo izoh, xatolar tahlili va rag‘batni o‘zbekcha tushuntir. Dasturlash/kiberxavfsizlikda xavfsiz, amaliy va darajaga mos topshiriqlar ber.
Xatolarni muloyim tuzat: avval nimasi yaxshi chiqqanini ayt, keyin to‘g‘ri variantni va qisqa sababini ko‘rsat, so‘ng foydalanuvchiga yana urinib ko‘rish uchun savol ber. Tabiiy, qisqa va jonli yoz. Vaqti-vaqti bilan yengil, hurmatli hazil qil; kamsitma, ortiqcha hazil bilan darsni chalg‘itma. O‘zingni AI ekaningni yashirma. Javoblar odatda 2-6 gapdan oshmasin. Foydalanuvchi faqat o‘zbekcha izoh so‘rasa, mashq tiliga majburlama.${memoryContext}`;

  const model = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: conversation,
        generationConfig: {
          maxOutputTokens: 420,
          temperature: 0.75,
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    const payload = await upstream.json() as GeminiResponse;
    if (!upstream.ok) {
      const providerMessage = payload.error?.message || `Gemini HTTP ${upstream.status}`;
      console.error(`[zikra-gemini-chat] HTTP ${upstream.status}: ${providerMessage.slice(0, 700)}`);
      return NextResponse.json(
        { error: `Gemini API (${upstream.status}): ${providerMessage.slice(0, 300)}` },
        { status: 502 },
      );
    }

    const candidate = payload.candidates?.[0];
    const reply = candidate?.content?.parts
      ?.map((part) => typeof part.text === "string" ? part.text : "")
      .join("")
      .trim();

    if (!reply) {
      console.error("[zikra-gemini-chat] Empty response; finishReason:", candidate?.finishReason || "unknown");
      return NextResponse.json(
        { error: "Gemini javob qaytarmadi. Xabarni boshqacha yozib, yana urinib ko‘ring." },
        { status: 502 },
      );
    }

    const latestUserMessage = [...conversation].reverse().find((message) => message.role === "user");
    const userText = latestUserMessage?.parts?.map((part) => part.text || "").join("").trim();
    if (userText) {
      const { error: saveError } = await supabase.from("ai_tutor_messages").insert([
        { user_id: user.id, mode: "chat", track, role: "user", content: userText.slice(0, 8000) },
        { user_id: user.id, mode: "chat", track, role: "assistant", content: reply.slice(0, 8000) },
      ]);
      if (saveError) console.warn("[zikra-ai-memory-write]", saveError.message);
    }
    return NextResponse.json({ reply, provider: "gemini", model });
  } catch (error) {
    console.error("[zikra-gemini-chat]", error);
    return NextResponse.json(
      { error: "Gemini bilan aloqa uzildi. Birozdan keyin qayta urinib ko‘ring." },
      { status: 503 },
    );
  }
}
