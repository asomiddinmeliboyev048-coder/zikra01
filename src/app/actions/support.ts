"use server";

import { createClient } from "@/lib/supabase/server";

export interface SupportResult {
  error?: string;
  success?: boolean;
}

/** Foydalanuvchi qo'llab-quvvatlashga xabar yuboradi */
export async function sendSupportMessageAction(
  message: string
): Promise<SupportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const text = message.trim();
  if (!text) return { error: "Xabar bo'sh bo'lmasligi kerak." };

  const { error } = await supabase.from("support_messages").insert({
    user_id: user.id,
    sender_role: "user",
    message: text,
  });
  if (error) return { error: error.message };
  return { success: true };
}
