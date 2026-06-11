"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SocialResult {
  error?: string;
  following?: boolean;
  liked?: boolean;
}

/** Obuna bo'lish / bekor qilish (toggle) */
export async function toggleFollowAction(
  followingId: string
): Promise<SocialResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };
  if (user.id === followingId)
    return { error: "O'zingizga obuna bo'la olmaysiz." };

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", followingId)
    .maybeSingle();

  if (existing) {
    await supabase.from("follows").delete().eq("id", existing.id);
    revalidatePath(`/profile/${followingId}`);
    return { following: false };
  }

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id: followingId });
  if (error) return { error: error.message };

  revalidatePath(`/profile/${followingId}`);
  return { following: true };
}

/** Videoga like bosish / olib tashlash (toggle) */
export async function toggleLikeAction(videoId: string): Promise<SocialResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { data: existing } = await supabase
    .from("video_likes")
    .select("id")
    .eq("video_id", videoId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("video_likes").delete().eq("id", existing.id);
    return { liked: false };
  }

  const { error } = await supabase
    .from("video_likes")
    .insert({ video_id: videoId, user_id: user.id });
  if (error) return { error: error.message };

  return { liked: true };
}

/** Video ko'rilganda +1 ko'rish (har foydalanuvchi har ochganda) */
export async function recordViewAction(videoId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("video_views")
    .insert({ video_id: videoId, user_id: user.id });
}
