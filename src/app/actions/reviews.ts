"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ReviewResult {
  error?: string;
  success?: boolean;
}

/**
 * Profilga to'g'ridan-to'g'ri baho + izoh qoldirish (darsga bog'lanmagan).
 * Bunday sharh darhol ko'rinadi (is_visible = true) va o'rtacha reyting yangilanadi.
 * Har bir foydalanuvchi bitta kishiga bitta sharh qoldiradi (qayta yozsa — yangilanadi).
 */
export async function submitProfileReviewAction(data: {
  ratedId: string;
  score: number;
  comment: string;
}): Promise<ReviewResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  if (user.id === data.ratedId)
    return { error: "O'zingizni baholay olmaysiz." };
  if (data.score < 1 || data.score > 5)
    return { error: "Baho 1 dan 5 gacha bo'lishi kerak." };

  // Avval shu kishiga qoldirilgan profil sharhi bor-yo'qligini tekshiramiz
  const { data: existing } = await supabase
    .from("ratings")
    .select("id")
    .eq("rater_id", user.id)
    .eq("rated_id", data.ratedId)
    .is("lesson_id", null)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("ratings")
      .update({
        score: data.score,
        comment: data.comment.trim() || null,
        created_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("ratings").insert({
      lesson_id: null,
      rater_id: user.id,
      rated_id: data.ratedId,
      score: data.score,
      comment: data.comment.trim() || null,
      is_visible: true, // profil sharhi darhol ko'rinadi
    });
    if (error) return { error: error.message };
  }

  // O'rtacha reytingni yangilash
  await supabase.rpc("refresh_trust_score", { p_user_id: data.ratedId });

  // Baholangan kishiga bildirishnoma
  await supabase.from("notifications").insert({
    user_id: data.ratedId,
    type: "rating",
    message: "⭐ Sizga yangi baho va izoh qoldirildi!",
    link: `/profile/${data.ratedId}`,
  });

  revalidatePath(`/profile/${data.ratedId}`);
  return { success: true };
}
