"use server";

import { createClient } from "@/lib/supabase/server";
import { conversationId } from "@/lib/utils";

export interface SendResult {
  error?: string;
}

export interface ChatPartner {
  id: string;
  full_name: string;
  avatar_url: string | null;
  username: string | null;
}

/** Xabar yuborish (server action) */
export async function sendMessageAction(
  receiverId: string,
  content: string
): Promise<SendResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const text = content.trim();
  if (!text) return { error: "Bo'sh xabar yuborib bo'lmaydi." };
  if (!receiverId) return { error: "Qabul qiluvchi topilmadi." };

  const convId = conversationId(user.id, receiverId);

  const { error } = await supabase.from("messages").insert({
    conversation_id: convId,
    sender_id: user.id,
    receiver_id: receiverId,
    content: text,
  });

  if (error) return { error: error.message };

  // Qabul qiluvchiga real-time bildirishnoma (toast + OS notification + push).
  // Bu NotificationListener orqali, foydalanuvchi qaysi sahifada bo'lsa ham ishlaydi.
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const senderName =
    (senderProfile as { full_name: string } | null)?.full_name ?? "Yangi xabar";

  let preview = text;
  if (text.startsWith("voice:")) preview = "🎤 Ovozli xabar";
  else if (text.startsWith("circle:")) preview = "📹 Video xabar";
  else if (text.startsWith("reel:")) preview = "🎬 Reel";
  else if (/^https?:\/\/\S+$/.test(text)) preview = "📎 Media";
  else if (preview.length > 60) preview = preview.slice(0, 60) + "…";

  await supabase.from("notifications").insert({
    user_id: receiverId,
    type: "message",
    message: `💬 ${senderName}: ${preview}`,
    link: `/chat?with=${user.id}`,
  });

  // Suhbat o'rnatilganda (bir necha xabardan keyin) har ikki tomonga
  // "baholang" eslatmasini bir marta yuboramiz.
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", convId);

  if (count === 4) {
    await supabase.from("notifications").insert([
      {
        user_id: user.id,
        type: "rating",
        message:
          "💬 Suhbatdoshingiz bilan tanishdingiz! Profiliga kirib, uni baholang va izoh qoldiring.",
        link: `/profile/${receiverId}`,
      },
      {
        user_id: receiverId,
        type: "rating",
        message:
          "💬 Suhbatdoshingiz bilan tanishdingiz! Profiliga kirib, uni baholang va izoh qoldiring.",
        link: `/profile/${user.id}`,
      },
    ]);
  }

  return {};
}


// ============================================================
// XABARLARNI BOSHQARISH (Telegram uslubi): tahrirlash / o'chirish / tozalash
// ============================================================

/**
 * Xabar matnini tahrirlash (faqat matnli xabarlar va faqat jo'natuvchi).
 * Ovozli/media/reel xabarlarni tahrirlab bo'lmaydi.
 */
export async function editMessageAction(
  messageId: string,
  newContent: string
): Promise<SendResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const text = newContent.trim();
  if (!text) return { error: "Xabar bo'sh bo'la olmaydi." };

  // Faqat matnli, o'zining xabari ekanini tekshiramiz
  const { data: msg } = await supabase
    .from("messages")
    .select("id, sender_id, content")
    .eq("id", messageId)
    .maybeSingle();

  if (!msg) return { error: "Xabar topilmadi." };
  if ((msg as { sender_id: string }).sender_id !== user.id)
    return { error: "Faqat o'z xabaringizni tahrirlay olasiz." };

  const existing = (msg as { content: string }).content;
  if (existing.startsWith("voice:") || existing.startsWith("reel:") || /^https?:\/\/\S+$/.test(existing.trim())) {
    return { error: "Faqat matnli xabarni tahrirlash mumkin." };
  }

  const { error } = await supabase
    .from("messages")
    .update({ content: text, edited_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("sender_id", user.id);

  if (error) return { error: error.message };
  return {};
}

/** Xabarni o'chirish (faqat o'z xabari — "hamma uchun o'chirish"). */
export async function deleteMessageAction(messageId: string): Promise<SendResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId)
    .eq("sender_id", user.id);

  if (error) return { error: error.message };
  return {};
}

/**
 * Suhbat tarixini to'liq o'chirish — ikkala tomonning barcha xabarlari.
 * RLS: messages_delete_participant siyosati ishtirokchiga barcha xabarlarni
 * o'chirishga ruxsat beradi.
 */
export async function clearConversationAction(
  partnerId: string
): Promise<SendResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };
  if (!partnerId) return { error: "Suhbatdosh topilmadi." };

  const convId = conversationId(user.id, partnerId);
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("conversation_id", convId);

  if (error) return { error: error.message };
  return {};
}

/**
 * Joriy foydalanuvchining suhbatdoshlari ro'yxati (reel yuborish/forward uchun).
 * Foydalanuvchi xabar almashgan barcha hamkorlarni qaytaradi.
 */
export async function getChatPartnersAction(): Promise<ChatPartner[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: msgs } = await supabase
    .from("messages")
    .select("sender_id, receiver_id, created_at")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const partnerIds: string[] = [];
  const seen = new Set<string>();
  for (const m of (msgs as { sender_id: string; receiver_id: string | null }[]) ?? []) {
    const pid = m.sender_id === user.id ? m.receiver_id : m.sender_id;
    if (pid && !seen.has(pid)) {
      seen.add(pid);
      partnerIds.push(pid);
    }
  }
  if (partnerIds.length === 0) return [];

  const { data: profs } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, username")
    .in("id", partnerIds);

  const byId = new Map<string, ChatPartner>();
  for (const p of (profs as ChatPartner[]) ?? []) byId.set(p.id, p);
  // Suhbat tartibini (eng so'nggi birinchi) saqlaymiz
  return partnerIds.map((id) => byId.get(id)).filter(Boolean) as ChatPartner[];
}

/**
 * Reelni chatdagi do'stga yuborish. Xabar "reel:<video_url>" konventsiyasi
 * bilan saqlanadi va chatda to'g'ridan-to'g'ri o'ynaydigan video sifatida
 * ko'rsatiladi.
 */
export async function sendReelToChatAction(
  receiverId: string,
  videoUrl: string
): Promise<SendResult> {
  if (!videoUrl || !/^https?:\/\/\S+$/.test(videoUrl)) {
    return { error: "Yaroqsiz video manzili." };
  }
  return sendMessageAction(receiverId, `reel:${videoUrl}`);
}
