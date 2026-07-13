"use server";

import { createClient } from "@/lib/supabase/server";
import { conversationId } from "@/lib/utils";

export interface SendResult {
  error?: string;
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


/** Xabarni tahrirlash (faqat o'z xabari) */
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
  if (!text) return { error: "Bo'sh xabar bo'lmasligi kerak." };

  const { error } = await supabase
    .from("messages")
    .update({ content: text })
    .eq("id", messageId)
    .eq("sender_id", user.id); // faqat o'z xabarini tahrirlaydi
  if (error) return { error: error.message };
  return {};
}

/** Bitta xabarni o'chirish (faqat o'z xabari — ikkala tomondan yo'qoladi) */
export async function deleteMessageAction(
  messageId: string
): Promise<SendResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId)
    .eq("sender_id", user.id); // faqat o'z xabarini o'chiradi
  if (error) return { error: error.message };
  return {};
}

/** Butun suhbat tarixini o'chirish (ikkala tomon uchun) */
export async function clearChatAction(partnerId: string): Promise<SendResult> {
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
