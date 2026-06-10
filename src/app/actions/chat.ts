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
  return {};
}
