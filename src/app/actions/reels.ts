"use server";

import { revalidatePath } from "next/cache";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@/lib/supabase/server";
import { s3, S3_BUCKET, S3_PUBLIC_BASE_URL } from "@/lib/s3/client";
import {
  getUserReels as getUserReelsQuery,
  getReelComments as getReelCommentsQuery,
} from "@/lib/queries";
import type { Reel, ReelComment } from "@/lib/types";

export interface ReelState {
  error?: string;
  success?: boolean;
  reels?: Reel[];
}

export interface ReelCommentState {
  error?: string;
  success?: boolean;
  comments?: ReelComment[];
  comment?: ReelComment;
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

/**
 * video_url manzilidan S3 obyekt kalitini (key) ajratib oladi.
 * Masalan: https://bucket.s3.region.amazonaws.com/reels/<uid>/<uuid>.mp4
 *   -> reels/<uid>/<uuid>.mp4
 * Base URL mos kelmasa null qaytaradi (noto'g'ri obyektni o'chirmaslik uchun).
 */
function extractS3Key(videoUrl: string): string | null {
  const prefix = `${S3_PUBLIC_BASE_URL}/`;
  if (!videoUrl.startsWith(prefix)) return null;
  const key = videoUrl.slice(prefix.length).split("?")[0];
  return key || null;
}

/**
 * Reelni o'chirish (faqat egasi) — HAM Supabase bazasidan, HAM AWS S3'dan.
 *
 * Oqim:
 *   1) Reel egasiga tegishli ekanini tekshiramiz va video_url'ni olamiz.
 *   2) Bazadan o'chiramiz (RLS ham egalikni majburlaydi).
 *      reel_likes / reel_comments / reel_views ON DELETE CASCADE bilan o'chadi.
 *   3) S3'dagi video faylini o'chiramiz (best-effort — S3 xatosi butun
 *      amalni buzmaydi, chunki baza yozuvi allaqachon o'chirilgan).
 */
export async function deleteReelAction(reelId: string): Promise<ReelState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  // 1) Egalikni tekshirish + video_url olish
  const { data: reel } = await supabase
    .from("reels")
    .select("id, user_id, video_url")
    .eq("id", reelId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!reel) {
    return { error: "Reel topilmadi yoki uni o'chirishga ruxsatingiz yo'q." };
  }

  // 2) Bazadan o'chirish
  const { error } = await supabase
    .from("reels")
    .delete()
    .eq("id", reelId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  // 3) S3'dan o'chirish (best-effort)
  const key = extractS3Key((reel as { video_url: string }).video_url);
  if (key) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    } catch (e) {
      // Baza yozuvi o'chirilgan; S3 fayli "orphan" bo'lib qolishi mumkin.
      // Buni log qilamiz, lekin foydalanuvchiga xato qaytarmaymiz.
      console.error("[deleteReelAction] S3 o'chirish xatosi:", e);
    }
  }

  revalidatePath("/videos");
  revalidatePath("/reels");
  revalidatePath(`/profile/${user.id}`);
  return { success: true };
}

/**
 * Reel ko'rilganini yozib qo'yadi — bir foydalanuvchi FAQAT 1 marta hisoblanadi
 * (unique (reel_id, user_id) + ignoreDuplicates). O'z videosini ko'rish
 * hisoblanmaydi.
 */
export async function recordReelViewAction(reelId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("reel_views")
    .upsert(
      { reel_id: reelId, user_id: user.id },
      { onConflict: "reel_id,user_id", ignoreDuplicates: true }
    );
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
    .maybeSingle();

  if (existing) return { success: true };

  const { error } = await supabase
    .from("reel_likes")
    .insert({ reel_id: reelId, user_id: user.id });

  if (error) return { error: error.message };

  // MUHIM: bu yerda revalidatePath("/reels") ATAYIN chaqirilmaydi.
  // Like optimistik ravishda client'da ko'rsatiladi; feed'ni qayta yuklash
  // ReelLikeButton props'ini yangilab, foydalanuvchi tasdiqlagan holatni
  // "qaytarib" yuborardi (ko'rinib turgan like revert bug'i). Client o'zi
  // yakuniy holatni ushlab turadi.
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

  // revalidatePath("/reels") ATAYIN yo'q — yuqoridagi likeReelAction izohiga qarang.
  return { success: true };
}


// ============================================================
// IZOHLAR (COMMENTS)
// ============================================================

/** Reelning barcha izohlarini olish (Bottom Sheet ochilganda). */
export async function getReelCommentsAction(
  reelId: string
): Promise<ReelCommentState> {
  try {
    const comments = await getReelCommentsQuery(reelId);
    return { success: true, comments };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Izohlarni yuklab bo'lmadi.",
    };
  }
}

/**
 * Reelga yangi izoh qo'shish.
 *
 * Joriy foydalanuvchi session'dan olinadi (client yuborgan user_id'ga
 * ishonmaymiz). Muvaffaqiyatli bo'lsa, yaratilgan izohni muallif ma'lumoti
 * bilan qaytaramiz — client uni ro'yxatga darhol qo'shishi mumkin.
 */
export async function addReelCommentAction(
  reelId: string,
  content: string,
  parentId?: string | null
): Promise<ReelCommentState> {
  const trimmed = content.trim();
  if (!trimmed) return { error: "Izoh bo'sh bo'lishi mumkin emas." };
  if (trimmed.length > 1000) return { error: "Izoh juda uzun (maks. 1000 belgi)." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { data, error } = await supabase
    .from("reel_comments")
    .insert({
      reel_id: reelId,
      user_id: user.id,
      parent_id: parentId ?? null,
      content: trimmed,
    })
    .select(
      "*, author:profiles!reel_comments_user_id_fkey(id, full_name, avatar_url, username)"
    )
    .single();

  if (error) return { error: error.message };

  // Bildirishnoma (like/comment/reply) DB triggeri orqali yuboriladi (0008 SQL).
  return { success: true, comment: data as unknown as ReelComment };
}

/** Izohni o'chirish (faqat egasi). */
export async function deleteReelCommentAction(
  commentId: string
): Promise<ReelCommentState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { error } = await supabase
    .from("reel_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/reels");
  return { success: true };
}
