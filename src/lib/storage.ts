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

/** Ruxsat etilgan sertifikat fayl turlari (rasm + PDF) */
export const CERTIFICATE_ACCEPT = "image/jpeg,image/png,image/jpg,application/pdf";

/** Sertifikat fayli to'g'ri turdami (jpg, png yoki PDF) tekshirish */
export function isValidCertificate(file: File): boolean {
  const ok = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
  return ok.includes(file.type);
}

/** Sertifikat (rasm yoki PDF) yuklash — public URL qaytaradi */
export async function uploadCertificate(file: File): Promise<string> {
  if (!isValidCertificate(file)) {
    throw new Error("Faqat JPG, PNG yoki PDF fayl yuklash mumkin.");
  }
  return uploadToBucket("certificates", file);
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

/**
 * Video faylidan avtomatik muqova (thumbnail) yasaydi.
 * Videoni brauzerda ochib, ~1-soniyadagi kadrni <canvas> ga chizadi va
 * JPEG Blob qaytaradi. Mahalliy fayldan (blob: URL) olingani uchun canvas
 * "taint" bo'lmaydi — CORS muammosi yo'q.
 *
 * @param file    tanlangan video fayl
 * @param seekTo  qaysi soniyadagi kadrni olish (default 1s)
 * @returns JPEG Blob yoki xato bo'lsa null
 */
export function captureVideoThumbnail(
  file: File,
  seekTo = 1
): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      const cleanup = () => URL.revokeObjectURL(url);

      video.onloadedmetadata = () => {
        // Boshidagi qora kadrni oldini olish uchun ozgina ichkariga suramiz,
        // lekin video juda qisqa bo'lsa yarmiga o'tamiz.
        const dur = Number.isFinite(video.duration) ? video.duration : 2;
        video.currentTime = Math.min(seekTo, dur / 2);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            cleanup();
            return resolve(null);
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              cleanup();
              resolve(blob);
            },
            "image/jpeg",
            0.8
          );
        } catch {
          cleanup();
          resolve(null);
        }
      };

      video.onerror = () => {
        cleanup();
        resolve(null);
      };

      video.src = url;
    } catch {
      resolve(null);
    }
  });
}

/** Video muqovasini (JPEG Blob) 'videos' bucket'iga yuklab, public URL qaytaradi */
export async function uploadVideoThumbnail(blob: Blob): Promise<string> {
  const file = new File([blob], `thumb-${Date.now()}.jpg`, {
    type: blob.type || "image/jpeg",
  });
  return uploadToBucket("videos", file);
}

/** Chat uchun rasm/video yuklash */
export async function uploadChatMedia(file: File): Promise<string> {
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    throw new Error("Faqat rasm yoki video yuborish mumkin.");
  }
  return uploadToBucket("chat", file);
}

/** Ovozli xabar (audio Blob) yuklash — public URL qaytaradi */
export async function uploadVoiceMessage(
  blob: Blob,
  ext = "webm"
): Promise<string> {
  // MediaRecorder Blob'ini File'ga o'rab 'chat' bucket'iga yuklaymiz
  const file = new File([blob], `voice-${Date.now()}.${ext}`, {
    type: blob.type || "audio/webm",
  });
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
