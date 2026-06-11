import { createClient } from "@/lib/supabase/client";

/**
 * Supabase Storage — rasm va video yuklash (Cloudinary o'rniga).
 * O'zbekistonda ishlaydi, bepul, qo'shimcha ro'yxatdan o'tish shart emas.
 */

function fileExt(name: string): string {
  const m = name.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "bin";
}

/** Faylni berilgan bucket'ga yuklab, ommaviy URL qaytaradi */
async function uploadToBucket(bucket: string, file: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Avtorizatsiya talab qilinadi.");

  const path = `${user.id}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${fileExt(file.name)}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Avatar (rasm) yuklash */
export async function uploadAvatar(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Iltimos, rasm faylini tanlang.");
  }
  return uploadToBucket("avatars", file);
}

/** Video davomiyligini (soniyada) brauzerda aniqlash */
export function getVideoDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(Number.isFinite(video.duration) ? Math.round(video.duration) : undefined);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(undefined);
      };
      video.src = url;
    } catch {
      resolve(undefined);
    }
  });
}

/** Video yuklash — URL va davomiylik qaytaradi */
export async function uploadVideo(
  file: File
): Promise<{ url: string; duration?: number }> {
  if (!file.type.startsWith("video/")) {
    throw new Error("Iltimos, video faylini tanlang.");
  }
  const duration = await getVideoDuration(file);
  const url = await uploadToBucket("videos", file);
  return { url, duration };
}

/** Chat uchun rasm/video yuklash */
export async function uploadChatMedia(file: File): Promise<string> {
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    throw new Error("Faqat rasm yoki video yuborish mumkin.");
  }
  return uploadToBucket("chat", file);
}

/** Hikoya (story) uchun rasm/video yuklash */
export async function uploadStoryMedia(
  file: File
): Promise<{ url: string; type: "image" | "video" }> {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    throw new Error("Faqat rasm yoki video yuklash mumkin.");
  }
  const url = await uploadToBucket("stories", file);
  return { url, type: isVideo ? "video" : "image" };
}
