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
    .maybeSingle();

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


// ============================================================
// KO'RISHLAR (views)
// ============================================================

/**
 * Reel ko'rilganini qayd etadi. Bir foydalanuvchi bitta reelni faqat
 * BIR MARTA hisoblanadi (unique reel_id,user_id + ignoreDuplicates).
 * Kirmagan foydalanuvchilar uchun jimgina o'tkazib yuboriladi.
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

// ============================================================
// IZOHLAR (comments)
// ============================================================

export interface ReelCommentRow {
  id: string;
  reel_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    username: string | null;
  };
}

/** Reelning barcha izohlarini (muallif profili bilan) oladi. */
export async function getReelCommentsAction(
  reelId: string
): Promise<{ error?: string; comments?: ReelCommentRow[] }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reel_comments")
    .select("*")
    .eq("reel_id", reelId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };

  const rows = (data as ReelCommentRow[]) ?? [];
  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  if (ids.length === 0) return { comments: [] };

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, username")
    .in("id", ids);

  type Author = NonNullable<ReelCommentRow["author"]>;
  const map = new Map<string, Author>();
  for (const p of (profiles as Author[]) ?? []) {
    map.set(p.id, p);
  }

  return {
    comments: rows.map((r) => ({ ...r, author: map.get(r.user_id) })),
  };
}

/** Reelga izoh qo'shadi. */
export async function addReelCommentAction(
  reelId: string,
  text: string
): Promise<{ error?: string; comment?: ReelCommentRow }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const content = text.trim();
  if (!content) return { error: "Izoh bo'sh bo'lmasligi kerak." };
  if (content.length > 500) return { error: "Izoh 500 belgidan oshmasligi kerak." };

  const { data: row, error } = await supabase
    .from("reel_comments")
    .insert({ reel_id: reelId, user_id: user.id, comment_text: content })
    .select("*")
    .single();

  if (error) return { error: error.message };

  const { data: me } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, username")
    .eq("id", user.id)
    .single();

  // Reel egasiga bildirishnoma (o'ziga emas)
  const { data: reel } = await supabase
    .from("reels")
    .select("user_id")
    .eq("id", reelId)
    .single();
  if (reel && reel.user_id !== user.id) {
    const preview = content.length > 50 ? content.slice(0, 50) + "…" : content;
    await supabase.from("notifications").insert({
      user_id: reel.user_id,
      type: "new_comment",
      message: `💬 ${me?.full_name ?? "Kimdir"} reelingizga izoh qoldirdi: ${preview}`,
      link: `/reels?start=${reelId}`,
    });
  }

  revalidatePath("/reels");
  return {
    comment: { ...(row as ReelCommentRow), author: me as ReelCommentRow["author"] },
  };
}

/** Izohni o'chirish (faqat egasi). */
export async function deleteReelCommentAction(
  commentId: string
): Promise<{ error?: string }> {
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
  return {};
}

// ============================================================
// ULASHISH (share) — reelni suhbatdoshga yuborish uchun manzillar
// ============================================================

export interface ShareTarget {
  id: string;
  full_name: string;
  avatar_url: string | null;
  username: string | null;
}

/**
 * Reelni yuborish mumkin bo'lgan odamlar ro'yxati:
 *   - foydalanuvchi bilan yozishgan suhbatdoshlar,
 *   - hamda u obuna bo'lgan profillar.
 * Ikkalasi birlashtirilib, takrorlanmas ro'yxat qaytariladi.
 */
export async function getShareTargetsAction(): Promise<{
  error?: string;
  targets?: ShareTarget[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const [msgsRes, followRes] = await Promise.all([
    supabase
      .from("messages")
      .select("sender_id, receiver_id")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("follows").select("following_id").eq("follower_id", user.id),
  ]);

  const partnerIds = new Set<string>();
  for (const m of (msgsRes.data as { sender_id: string; receiver_id: string | null }[]) ?? []) {
    const other = m.sender_id === user.id ? m.receiver_id : m.sender_id;
    if (other && other !== user.id) partnerIds.add(other);
  }
  for (const f of (followRes.data as { following_id: string }[]) ?? []) {
    if (f.following_id !== user.id) partnerIds.add(f.following_id);
  }

  const ids = Array.from(partnerIds);
  if (ids.length === 0) return { targets: [] };

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, username")
    .in("id", ids)
    .order("full_name", { ascending: true });

  return { targets: (profiles as ShareTarget[]) ?? [] };
}


/**
 * Reelning video URL manzilini qaytaradi (chatga forward qilish uchun).
 * Chatga havola emas, aynan shu video URL yuboriladi -> chat uni video
 * pleyer sifatida ko'rsatadi.
 */
export async function getReelVideoUrlAction(
  reelId: string
): Promise<{ error?: string; videoUrl?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reels")
    .select("video_url")
    .eq("id", reelId)
    .single();
  if (error) return { error: error.message };
  return { videoUrl: (data as { video_url: string }).video_url };
}
