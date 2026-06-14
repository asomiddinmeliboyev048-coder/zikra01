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

/**
 * Kiruvchi qo'ng'iroq haqida qabul qiluvchiga bildirishnoma yozadi.
 * Bu `notifications` INSERT'i Database Webhook orqali `send-push` Edge
 * Function'ni ishga tushiradi → callee'ga FCM push keladi (ilova yopiq bo'lsa ham).
 *
 * Eslatma: type "message" ishlatiladi (DB cheklovi bilan mos), lekin link ichida
 * "call=1" sentineli bor — ilova OCHIQ bo'lganda NotificationListener/PushManager
 * buni o'tkazib yuboradi (CallProvider o'zi to'liq ekran ko'rsatadi), takror chiqmasligi uchun.
 */
export async function notifyIncomingCallAction(
  calleeId: string,
  callType: "video" | "audio"
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !calleeId) return;

  const { data: me } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const name = (me as { full_name: string } | null)?.full_name ?? "Foydalanuvchi";

  await supabase.from("notifications").insert({
    user_id: calleeId,
    type: "message",
    message: `${callType === "video" ? "📹" : "📞"} ${name} qo'ng'iroq qilmoqda`,
    link: "/chat?call=1", // sentinel — in-app takror bildirishnomani oldini oladi
  });
}
