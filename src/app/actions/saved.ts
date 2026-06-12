"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { conversationId } from "@/lib/utils";

export interface SavedResult {
  error?: string;
  success?: boolean;
}

/** "Saqlangan xabarlar"ga matn/havola saqlash */
export async function saveItemAction(
  content: string,
  type: "text" | "image" | "video" | "link" = "text"
): Promise<SavedResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };
  if (!content.trim()) return { error: "Bo'sh saqlab bo'lmaydi." };

  const { error } = await supabase.from("saved_messages").insert({
    user_id: user.id,
    content: content.trim(),
    message_type: type,
  });
  if (error) return { error: error.message };

  revalidatePath("/saved");
  return { success: true };
}

/** Saqlangan elementni o'chirish */
export async function deleteSavedAction(id: string): Promise<SavedResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { error } = await supabase
    .from("saved_messages")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/saved");
  return { success: true };
}

/** Xabarni boshqa suhbatga forward qilish */
export async function forwardMessageAction(
  content: string,
  toUserId: string
): Promise<SavedResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };
  if (!toUserId) return { error: "Qabul qiluvchi tanlanmagan." };

  const convId = conversationId(user.id, toUserId);
  const { error } = await supabase.from("messages").insert({
    conversation_id: convId,
    sender_id: user.id,
    receiver_id: toUserId,
    content,
  });
  if (error) return { error: error.message };
  return { success: true };
}
