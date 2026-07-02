"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { S3_PUBLIC_BASE_URL } from "@/lib/s3/client";
import { getUserReels as getUserReelsQuery } from "@/lib/queries";
import type { Reel } from "@/lib/types";

export interface ReelState {
  error?: string;
  success?: boolean;
  reels?: Reel[];
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
  revalidatePath("/reels");
  revalidatePath(`/profile/${user.id}`);
  return { success: true };
}

/** Foydalanuvchining barcha reels'larini olish (server action sifatida). */
export async function getUserReelsAction(userId: string): Promise<ReelState> {
  try {
    const reels = await getUserReelsQuery(userId);
    return { success: true, reels };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Xatolik yuz berdi." };
  }
}

/** Reelga like bosish. */
export async function likeReelAction(reelId: string): Promise<ReelState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  // Agar allaqachon like bo'lsa, qayta qo'shmaymiz
  const { data: existing } = await supabase
    .from("reel_likes")
    .select("id")
    .eq("reel_id", reelId)
    .eq("user_id", user.id)
    .single();

  if (existing) return { success: true };

  const { error } = await supabase
    .from("reel_likes")
    .insert({ reel_id: reelId, user_id: user.id });

  if (error) return { error: error.message };

  revalidatePath("/reels");
  revalidatePath("/profile");
  return { success: true };
}

/** Reeldan like ni olib tashlash. */
export async function unlikeReelAction(reelId: string): Promise<ReelState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { error } = await supabase
    .from("reel_likes")
    .delete()
    .eq("reel_id", reelId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/reels");
  revalidatePath("/profile");
  return { success: true };
}
