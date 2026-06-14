"use server";

import { createClient } from "@/lib/supabase/server";

export interface PushResult {
  error?: string;
  success?: boolean;
}

/** Foydalanuvchining FCM tokenini saqlash (push_tokens jadvali) */
export async function savePushTokenAction(token: string): Promise<PushResult> {
  if (!token) return { error: "Token bo'sh." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  // token unique — mavjud bo'lsa user_id'ni yangilaymiz
  const { error } = await supabase
    .from("push_tokens")
    .upsert(
      { user_id: user.id, token, platform: "web" },
      { onConflict: "token" }
    );

  if (error) return { error: error.message };
  return { success: true };
}
