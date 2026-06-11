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


/** Videoga izoh yoki javob qo'shish */
export async function addCommentAction(data: {
  videoId: string;
  content: string;
  parentId?: string | null;
}): Promise<{ error?: string; id?: string; created_at?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const content = data.content.trim();
  if (!content) return { error: "Izoh bo'sh bo'lmasligi kerak." };

  const { data: row, error } = await supabase
    .from("video_comments")
    .insert({
      video_id: data.videoId,
      user_id: user.id,
      parent_id: data.parentId ?? null,
      content,
    })
    .select("id, created_at")
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/videos/${data.videoId}`);
  return { id: row.id as string, created_at: row.created_at as string };
}

/** Izohni o'chirish (faqat egasi) */
export async function deleteCommentAction(
  commentId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { error } = await supabase
    .from("video_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  return {};
}

/** Izohga yurakcha (like) toggle */
export async function toggleCommentLikeAction(
  commentId: string
): Promise<{ error?: string; liked?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { data: existing } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("comment_likes").delete().eq("id", existing.id);
    return { liked: false };
  }
  const { error } = await supabase
    .from("comment_likes")
    .insert({ comment_id: commentId, user_id: user.id });
  if (error) return { error: error.message };
  return { liked: true };
}

/** Chat xabariga emoji reaksiya qo'yish/olib tashlash (toggle) */
export async function setReactionAction(
  messageId: string,
  emoji: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { data: existing } = await supabase
    .from("message_reactions")
    .select("id, emoji")
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    if (existing.emoji === emoji) {
      // xuddi shu emoji — olib tashlaymiz
      await supabase.from("message_reactions").delete().eq("id", existing.id);
    } else {
      // boshqa emoji — yangilaymiz
      await supabase
        .from("message_reactions")
        .update({ emoji })
        .eq("id", existing.id);
    }
    return {};
  }

  const { error } = await supabase
    .from("message_reactions")
    .insert({ message_id: messageId, user_id: user.id, emoji });
  if (error) return { error: error.message };
  return {};
}
