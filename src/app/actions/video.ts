"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface VideoState {
  error?: string;
  success?: boolean;
}

/** Yuklangan video metama'lumotlarini saqlash */
export async function saveVideoAction(data: {
  title: string;
  skillId: string;
  cloudinaryUrl: string;
  thumbnailUrl?: string;
  duration?: number;
}): Promise<VideoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  if (!data.title.trim()) return { error: "Dars nomini kiriting." };
  if (!data.cloudinaryUrl) return { error: "Video yuklanmagan." };

  const { error } = await supabase.from("videos").insert({
    uploader_id: user.id,
    title: data.title.trim(),
    skill_id: data.skillId || null,
    cloudinary_url: data.cloudinaryUrl,
    thumbnail_url: data.thumbnailUrl || null,
    duration: data.duration ?? null,
    // Moderatsiya: video admin tasdig'idan keyin ('published') ko'rinadi
    status: "pending",
  });

  if (error) return { error: error.message };

  revalidatePath("/videos");
  revalidatePath(`/profile/${user.id}`);
  return { success: true };
}

/** Videoni o'chirish (faqat egasi) */
export async function deleteVideoAction(videoId: string): Promise<VideoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { error } = await supabase
    .from("videos")
    .delete()
    .eq("id", videoId)
    .eq("uploader_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/videos");
  return { success: true };
}
