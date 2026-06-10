"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  error?: string;
  success?: boolean;
}

/**
 * Dars yaratish. role — joriy foydalanuvchining roli ('teacher' yoki 'learner').
 */
export async function createLessonAction(data: {
  partnerId: string;
  role: "teacher" | "learner";
  skillId?: string;
  scheduledAt?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };
  if (!data.partnerId) return { error: "Hamkor tanlanmagan." };

  const teacherId = data.role === "teacher" ? user.id : data.partnerId;
  const learnerId = data.role === "learner" ? user.id : data.partnerId;

  const { error } = await supabase.from("lessons").insert({
    teacher_id: teacherId,
    learner_id: learnerId,
    skill_id: data.skillId || null,
    status: "scheduled",
    scheduled_at: data.scheduledAt || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/lessons");
  return { success: true };
}

/** Darsni yakunlangan deb belgilash (XP DB trigger orqali beriladi) */
export async function completeLessonAction(
  lessonId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { error } = await supabase
    .from("lessons")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", lessonId)
    .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`);

  if (error) return { error: error.message };
  revalidatePath("/lessons");
  return { success: true };
}

/** Darsni bekor qilish */
export async function cancelLessonAction(
  lessonId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { error } = await supabase
    .from("lessons")
    .update({ status: "cancelled" })
    .eq("id", lessonId)
    .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`);

  if (error) return { error: error.message };
  revalidatePath("/lessons");
  return { success: true };
}

/**
 * Baho berish (ikki tomonlama). Baho DB'da is_visible=false bilan saqlanadi;
 * ikkala tomon ham baholaganda trigger orqali ko'rinadigan bo'ladi,
 * XP va badge'lar beriladi, o'rtacha reyting yangilanadi.
 */
export async function submitRatingAction(data: {
  lessonId: string;
  ratedId: string;
  score: number;
  comment?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  if (data.score < 1 || data.score > 5)
    return { error: "Baho 1 dan 5 gacha bo'lishi kerak." };

  const { error } = await supabase.from("ratings").insert({
    lesson_id: data.lessonId,
    rater_id: user.id,
    rated_id: data.ratedId,
    score: data.score,
    comment: data.comment?.trim() || null,
  });

  if (error) {
    if (error.code === "23505")
      return { error: "Siz bu dars uchun allaqachon baho bergansiz." };
    return { error: error.message };
  }

  revalidatePath("/lessons");
  revalidatePath(`/profile/${data.ratedId}`);
  return { success: true };
}
