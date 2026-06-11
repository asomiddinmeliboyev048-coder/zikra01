"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface StoryResult {
  error?: string;
  success?: boolean;
  liked?: boolean;
}

/** Yangi hikoya qo'yish (kuniga 1 ta) */
export async function createStoryAction(data: {
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
}): Promise<StoryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };
  if (!data.mediaUrl) return { error: "Media tanlanmagan." };

  const { error } = await supabase.from("stories").insert({
    user_id: user.id,
    media_url: data.mediaUrl,
    media_type: data.mediaType,
    caption: data.caption?.trim() || null,
  });

  if (error) {
    if (error.message.includes("BIR_KUN_BIR_HIKOYA")) {
      return {
        error: "Bugun allaqachon hikoya qo'ydingiz, ertaga qayta urinib ko'ring.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/discovery");
  return { success: true };
}

/** Hikoyani ko'rilgan deb belgilash */
export async function recordStoryViewAction(storyId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("story_views")
    .upsert(
      { story_id: storyId, viewer_id: user.id },
      { onConflict: "story_id,viewer_id", ignoreDuplicates: true }
    );
}

/** Hikoyaga like (toggle) */
export async function toggleStoryLikeAction(
  storyId: string
): Promise<StoryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { data: existing } = await supabase
    .from("story_likes")
    .select("id")
    .eq("story_id", storyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("story_likes").delete().eq("id", existing.id);
    return { liked: false };
  }
  const { error } = await supabase
    .from("story_likes")
    .insert({ story_id: storyId, user_id: user.id });
  if (error) return { error: error.message };
  return { liked: true };
}

/** Hikoyani o'chirish (egasi) */
export async function deleteStoryAction(storyId: string): Promise<StoryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { error } = await supabase
    .from("stories")
    .delete()
    .eq("id", storyId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/discovery");
  return { success: true };
}

/** Hikoyani suhbatdoshga ulashish (forward) */
export async function forwardStoryAction(
  storyId: string,
  toUserId: string
): Promise<StoryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { data: story } = await supabase
    .from("stories")
    .select("media_url")
    .eq("id", storyId)
    .single();
  if (!story) return { error: "Hikoya topilmadi." };

  const convId = [user.id, toUserId].sort().join("_");
  const { error } = await supabase.from("messages").insert({
    conversation_id: convId,
    sender_id: user.id,
    receiver_id: toUserId,
    content: story.media_url,
  });
  if (error) return { error: error.message };
  return { success: true };
}
