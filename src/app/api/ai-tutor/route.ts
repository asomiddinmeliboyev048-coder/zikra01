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

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Suhbat uchun tizimga kiring." }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI xizmati hali ulanmagan. OPENAI_API_KEY server muhitiga qo‘shilishi kerak." }, { status: 503 });

  let body: { track?: unknown; level?: unknown; messages?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "So‘rov formati noto‘g‘ri." }, { status: 400 }); }

  const track = String(body.track || "english") as Track;
  const level = String(body.level || "beginner").slice(0, 40);
  const messages = Array.isArray(body.messages) ? body.messages.slice(-14) : [];
  if (!tracks.includes(track)) return NextResponse.json({ error: "Ko‘nikma turi noto‘g‘ri." }, { status: 400 });

  const safeMessages = messages
    .filter((item): item is { role: string; content: string } => Boolean(item) && typeof item === "object" && ["user", "assistant"].includes(String((item as { role?: unknown }).role)) && typeof (item as { content?: unknown }).content === "string")
    .map((item) => ({ role: item.role, content: item.content.slice(0, 1800) }));
  if (!safeMessages.length || safeMessages[safeMessages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Xabar topilmadi." }, { status: 400 });
  }

  const instructions = `Sen Zikra AI Ustozsan: aqlli, samimiy, hazilkash, sabrli va rag‘batlantiruvchi shaxsiy murabbiy.
Foydalanuvchi bilan ASOSIY TIL sifatida o‘zbek tilida gaplash. Tanlangan yo‘nalish: ${trackNames[track]}. Foydalanuvchi darajasi: ${level}.
Maqsad: foydalanuvchiga aynan shu ko‘nikmani mashq qildirish. Ingliz yoki rus tili tanlansa, qisqa savol va topshiriqlarni o‘rganilayotgan tilda ber, ammo izoh, xatolar tahlili va rag‘batni o‘zbekcha tushuntir. Dasturlash/kiberxavfsizlikda xavfsiz, amaliy va darajaga mos topshiriqlar ber.
Xatolarni muloyim tuzat: avval nimasi yaxshi chiqqanini ayt, keyin to‘g‘ri variantni va qisqa sababini ko‘rsat, so‘ng foydalanuvchiga yana urinib ko‘rish uchun savol ber. Tabiiy, qisqa va jonli yoz. Vaqti-vaqti bilan yengil, hurmatli hazil qil; kamsitma, ortiqcha hazil bilan darsni chalg‘itma. O‘zingni AI ekaningni yashirma. Javoblar odatda 2-6 gapdan oshmasin. Foydalanuvchi faqat o‘zbekcha izoh so‘rasa, mashq tiliga majburlama.`;

  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.ZIKRA_AI_MODEL || "gpt-6-sol",
        instructions,
        input: safeMessages.map((item) => ({ role: item.role, content: item.content })),
        max_output_tokens: 420,
        store: false,
      }),
      signal: AbortSignal.timeout(30000),
    });
    const payload = await upstream.json();
    if (!upstream.ok) {
      console.error("[zikra-ai-tutor]", payload?.error?.message || upstream.status);
      return NextResponse.json({ error: "AI hozir javob bera olmadi. Birozdan keyin yana urinib ko‘ring." }, { status: 502 });
    }
    const reply = typeof payload.output_text === "string"
      ? payload.output_text
      : (payload.output || []).flatMap((item: { content?: { type?: string; text?: string }[] }) => item.content || []).filter((item: { type?: string }) => item.type === "output_text").map((item: { text?: string }) => item.text || "").join("\n").trim();
    if (!reply) return NextResponse.json({ error: "AI javobi bo‘sh qaytdi. Yana bir marta urinib ko‘ring." }, { status: 502 });
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[zikra-ai-tutor]", error);
    return NextResponse.json({ error: "AI bilan aloqa uzildi. Internetni tekshirib qayta urinib ko‘ring." }, { status: 503 });
  }
}
