"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { S3_PUBLIC_BASE_URL } from "@/lib/s3/client";

export interface ReelState {
  error?: string;
  success?: boolean;
}

/**
 * S3'ga yuklangan reel (qisqa video) URL manzilini bazaga saqlaydi.
 *
 * XAVFSIZLIK: Client yuborgan URL'ga ko'r-ko'rona ishonmaymiz — u bizning
 * bucket'imizga VA aynan shu foydalanuvchi papkasiga tegishli ekanini
 * tekshiramiz. Aks holda kimdir istalgan URL'ni bazaga tiqib qo'yishi mumkin.
 */
export async function saveReelAction(data: {
  videoUrl: string;
  description?: string;
}): Promise<ReelState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const expectedPrefix = `${S3_PUBLIC_BASE_URL}/reels/${user.id}/`;
  if (!data.videoUrl || !data.videoUrl.startsWith(expectedPrefix)) {
    return { error: "Yaroqsiz video manzili." };
  }

  const { error } = await supabase.from("reels").insert({
    user_id: user.id,
    video_url: data.videoUrl,
    description: data.description?.trim() || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/videos");
  revalidatePath(`/profile/${user.id}`);
  return { success: true };
}

/** Reelni o'chirish (faqat egasi). */
export async function deleteReelAction(reelId: string): Promise<ReelState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { error } = await supabase
    .from("reels")
    .delete()
    .eq("id", reelId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/videos");
  return { success: true };
}
