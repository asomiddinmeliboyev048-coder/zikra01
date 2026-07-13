import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  Skill,
  ProfileWithSkills,
  UserSkill,
  Reel,
} from "@/lib/types";

/**
 * Joriy kirgan foydalanuvchi (auth).
 * `cache()` — bitta so'rov (request) davomida faqat BIR MARTA chaqiriladi.
 * Navbar + sahifa ikkalasi ham chaqirsa, auth serveriga qayta murojaat
 * qilinmaydi — navigatsiya sezilarli tezlashadi.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Joriy foydalanuvchi profili (bitta so'rovda keshlanadi) */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
});

/** Barcha ko'nikmalar (kategoriya bo'yicha tartib) */
export async function getSkills(): Promise<Skill[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("skills")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  return (data as Skill[]) ?? [];
}

/** Foydalanuvchining teach/learn ko'nikmalari */
export async function getUserSkills(userId: string): Promise<{
  teach: Skill[];
  learn: Skill[];
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_skills")
    .select("type, skill:skills(*)")
    .eq("user_id", userId);

  const rows = (data as unknown as (UserSkill & { skill: Skill })[]) ?? [];
  return {
    teach: rows.filter((r) => r.type === "teach").map((r) => r.skill),
    learn: rows.filter((r) => r.type === "learn").map((r) => r.skill),
  };
}

/** Bitta foydalanuvchini ko'nikmalari bilan to'liq olish */
export async function getProfileWithSkills(
  userId: string
): Promise<ProfileWithSkills | null> {
  const profileRes = await (await createClient())
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profileRes.data) return null;

  const { teach, learn } = await getUserSkills(userId);
  return {
    ...(profileRes.data as Profile),
    teach_skills: teach,
    learn_skills: learn,
  };
}

/** O'qilmagan bildirishnomalar soni */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count ?? 0;
}


/** Bir nechta video uchun like/ko'rish soni va joriy foydalanuvchi like bosganmi */
export async function getVideoStats(
  videoIds: string[],
  userId?: string
): Promise<Map<string, { likes: number; views: number; liked: boolean }>> {
  const map = new Map<string, { likes: number; views: number; liked: boolean }>();
  videoIds.forEach((id) => map.set(id, { likes: 0, views: 0, liked: false }));
  if (videoIds.length === 0) return map;

  const supabase = await createClient();
  const [likesRes, viewsRes, mineRes] = await Promise.all([
    supabase.from("video_likes").select("video_id").in("video_id", videoIds),
    supabase.from("video_views").select("video_id").in("video_id", videoIds),
    userId
      ? supabase
          .from("video_likes")
          .select("video_id")
          .eq("user_id", userId)
          .in("video_id", videoIds)
      : Promise.resolve({ data: [] as { video_id: string }[] }),
  ]);

  for (const r of (likesRes.data as { video_id: string }[]) ?? []) {
    const s = map.get(r.video_id);
    if (s) s.likes += 1;
  }
  for (const r of (viewsRes.data as { video_id: string }[]) ?? []) {
    const s = map.get(r.video_id);
    if (s) s.views += 1;
  }
  for (const r of (mineRes.data as { video_id: string }[]) ?? []) {
    const s = map.get(r.video_id);
    if (s) s.liked = true;
  }
  return map;
}

/** Profil uchun obunachilar/obunalar soni va joriy foydalanuvchi obuna bo'lganmi */
export async function getFollowInfo(
  profileId: string,
  viewerId?: string
): Promise<{ followers: number; following: number; isFollowing: boolean }> {
  const supabase = await createClient();
  const [followers, following, mine] = await Promise.all([
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", profileId),
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", profileId),
    viewerId
      ? supabase
          .from("follows")
          .select("id", { count: "exact", head: true })
          .eq("follower_id", viewerId)
          .eq("following_id", profileId)
      : Promise.resolve({ count: 0 }),
  ]);

  return {
    followers: followers.count ?? 0,
    following: following.count ?? 0,
    isFollowing: (mine.count ?? 0) > 0,
  };
}


/** Stories feed — foydalanuvchilar bo'yicha guruhlangan faol hikoyalar */
export async function getStoriesFeed(meId: string): Promise<{
  groups: import("@/lib/types").StoryGroup[];
}> {
  const supabase = await createClient();

  const { data: storiesData } = await supabase
    .from("stories")
    .select(
      "*, user:profiles!stories_user_id_fkey(id, full_name, avatar_url)"
    )
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });

  type Row = import("@/lib/types").Story & {
    user: { id: string; full_name: string; avatar_url: string | null };
  };
  const rows = (storiesData as unknown as Row[]) ?? [];

  // Mening ko'rganlarim
  const { data: views } = await supabase
    .from("story_views")
    .select("story_id")
    .eq("viewer_id", meId);
  const viewedSet = new Set((views ?? []).map((v) => v.story_id));

  const map = new Map<string, import("@/lib/types").StoryGroup>();
  for (const r of rows) {
    if (!map.has(r.user_id)) {
      map.set(r.user_id, {
        user: r.user,
        stories: [],
        hasUnviewed: false,
        isMe: r.user_id === meId,
      });
    }
    const g = map.get(r.user_id)!;
    g.stories.push({
      id: r.id,
      user_id: r.user_id,
      media_url: r.media_url,
      media_type: r.media_type,
      caption: r.caption,
      created_at: r.created_at,
      expires_at: r.expires_at,
    });
    if (!viewedSet.has(r.id) && r.user_id !== meId) g.hasUnviewed = true;
  }

  return { groups: Array.from(map.values()) };
}

/**
 * Reel yozuvlariga muallif profilini qo'shadi (MANUAL JOIN).
 *
 * MUHIM: Ilgari bu yerda PostgREST embed (`profiles!reels_user_id_fkey`)
 * ishlatilardi. Ammo reels.user_id FK auth.users'ga bog'langani uchun
 * embed xato berardi va lenta BO'SH chiqardi. Endi profillarni alohida
 * so'rov bilan olib, JS'da bog'laymiz — bu FK sozlamasidan mustaqil ishlaydi.
 */
async function attachReelAuthors(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: { user_id: string }[]
): Promise<Map<string, Pick<Profile, "id" | "full_name" | "avatar_url" | "username">>> {
  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  const map = new Map<
    string,
    Pick<Profile, "id" | "full_name" | "avatar_url" | "username">
  >();
  if (ids.length === 0) return map;

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, username")
    .in("id", ids);

  for (const p of (data as Pick<
    Profile,
    "id" | "full_name" | "avatar_url" | "username"
  >[]) ?? []) {
    map.set(p.id, p);
  }
  return map;
}

/** Barcha reels'larni olish (eng yangi birinchi) — muallif profili bilan */
export async function getReels(): Promise<Reel[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reels")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getReels] xatolik:", error.message);
    return [];
  }

  const rows = (data as Reel[]) ?? [];
  const authors = await attachReelAuthors(supabase, rows);
  return rows.map((r) => ({ ...r, user: authors.get(r.user_id) }));
}

/** Muayyan foydalanuvchining reels'larini olish — muallif profili bilan */
export async function getUserReels(userId: string): Promise<Reel[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reels")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getUserReels] xatolik:", error.message);
    return [];
  }

  const rows = (data as Reel[]) ?? [];
  const authors = await attachReelAuthors(supabase, rows);
  return rows.map((r) => ({ ...r, user: authors.get(r.user_id) }));
}

export interface ReelStat {
  likes: number;
  liked: boolean;
  views: number;
  comments: number;
}

/**
 * Bir nechta reel uchun statistika: like soni, joriy foydalanuvchi like
 * bosganmi, ko'rishlar soni va izohlar soni.
 *
 * Eslatma: reel_views / reel_comments jadvallari hali yaratilmagan bo'lsa
 * (0007 migratsiyasi ishga tushmagan), so'rovlar jimgina 0 qaytaradi.
 */
export async function getReelStats(
  reelIds: string[],
  userId?: string
): Promise<Map<string, ReelStat>> {
  const map = new Map<string, ReelStat>();
  reelIds.forEach((id) => map.set(id, { likes: 0, liked: false, views: 0, comments: 0 }));
  if (reelIds.length === 0) return map;

  const supabase = await createClient();
  const [likesRes, mineRes, viewsRes, commentsRes] = await Promise.all([
    supabase.from("reel_likes").select("reel_id").in("reel_id", reelIds),
    userId
      ? supabase
          .from("reel_likes")
          .select("reel_id")
          .eq("user_id", userId)
          .in("reel_id", reelIds)
      : Promise.resolve({ data: [] as { reel_id: string }[] }),
    supabase.from("reel_views").select("reel_id").in("reel_id", reelIds),
    supabase.from("reel_comments").select("reel_id").in("reel_id", reelIds),
  ]);

  for (const r of (likesRes.data as { reel_id: string }[]) ?? []) {
    const s = map.get(r.reel_id);
    if (s) s.likes += 1;
  }
  for (const r of (mineRes.data as { reel_id: string }[]) ?? []) {
    const s = map.get(r.reel_id);
    if (s) s.liked = true;
  }
  for (const r of (viewsRes.data as { reel_id: string }[]) ?? []) {
    const s = map.get(r.reel_id);
    if (s) s.views += 1;
  }
  for (const r of (commentsRes.data as { reel_id: string }[]) ?? []) {
    const s = map.get(r.reel_id);
    if (s) s.comments += 1;
  }
  return map;
}

/**
 * Berilgan ko'ruvchi (viewer) qaysi mualliflarga obuna bo'lganini qaytaradi.
 * Reels lentasidagi "Obuna bo'lish" tugmasi holatini oldindan belgilash uchun.
 */
export async function getFollowingSet(
  viewerId: string,
  authorIds: string[]
): Promise<Set<string>> {
  const set = new Set<string>();
  const ids = Array.from(new Set(authorIds)).filter((id) => id !== viewerId);
  if (ids.length === 0) return set;

  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", viewerId)
    .in("following_id", ids);

  for (const r of (data as { following_id: string }[]) ?? []) {
    set.add(r.following_id);
  }
  return set;
}
