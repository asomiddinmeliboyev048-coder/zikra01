import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  Skill,
  ProfileWithSkills,
  UserSkill,
  Reel,
  ReelComment,
} from "@/lib/types";

/** Joriy kirgan foydalanuvchi (auth) */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Joriy foydalanuvchi profili */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
}

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

// Reels + muallif profilini birga olish uchun select ifodasi.
// DIQQAT: `profiles!reels_user_id_fkey` embed ishlashi uchun `reels.user_id`
// FK'si `public.profiles(id)` ga ishora qilishi SHART (auth.users emas).
// Buni 0008 migratsiyasi to'g'rilaydi. Aks holda join xato beradi va reels
// "yo'qoladi". Shuning uchun quyida embed muvaffaqiyatsiz bo'lsa, profilsiz
// oddiy select bilan fallback qilamiz.
const REEL_WITH_USER =
  "*, user:profiles!reels_user_id_fkey(id, full_name, avatar_url, username)";

/** Barcha reels'larni olish (eng yangi birinchi) */
export async function getReels(): Promise<Reel[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reels")
    .select(REEL_WITH_USER)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getReels] embed xatosi, profilsiz fallback:", error.message);
    const { data: plain, error: plainErr } = await supabase
      .from("reels")
      .select("*")
      .order("created_at", { ascending: false });
    if (plainErr) console.error("[getReels] fallback ham muvaffaqiyatsiz:", plainErr.message);
    return (plain as unknown as Reel[]) ?? [];
  }

  return (data as unknown as Reel[]) ?? [];
}

/** Muayyan foydalanuvchining reels'larini olish */
export async function getUserReels(userId: string): Promise<Reel[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reels")
    .select(REEL_WITH_USER)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getUserReels] embed xatosi, profilsiz fallback:", error.message);
    const { data: plain } = await supabase
      .from("reels")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (plain as unknown as Reel[]) ?? [];
  }

  return (data as unknown as Reel[]) ?? [];
}

/** Bir nechta reel uchun like soni va joriy foydalanuvchi like bosganmi */
export async function getReelStats(
  reelIds: string[],
  userId?: string
): Promise<Map<string, { likes: number; liked: boolean }>> {
  const map = new Map<string, { likes: number; liked: boolean }>();
  reelIds.forEach((id) => map.set(id, { likes: 0, liked: false }));
  if (reelIds.length === 0) return map;

  const supabase = await createClient();
  const [likesRes, mineRes] = await Promise.all([
    supabase.from("reel_likes").select("reel_id").in("reel_id", reelIds),
    userId
      ? supabase
          .from("reel_likes")
          .select("reel_id")
          .eq("user_id", userId)
          .in("reel_id", reelIds)
      : Promise.resolve({ data: [] as { reel_id: string }[] }),
  ]);

  for (const r of (likesRes.data as { reel_id: string }[]) ?? []) {
    const s = map.get(r.reel_id);
    if (s) s.likes += 1;
  }
  for (const r of (mineRes.data as { reel_id: string }[]) ?? []) {
    const s = map.get(r.reel_id);
    if (s) s.liked = true;
  }
  return map;
}


/** Muayyan reelning barcha izohlarini muallif ma'lumoti bilan olish (eng eski birinchi) */
export async function getReelComments(reelId: string): Promise<ReelComment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reel_comments")
    .select(
      "*, author:profiles!reel_comments_user_id_fkey(id, full_name, avatar_url, username)"
    )
    .eq("reel_id", reelId)
    .order("created_at", { ascending: true });

  return (data as unknown as ReelComment[]) ?? [];
}

/** Bir nechta reel uchun ko'rishlar (views) sonini olish */
export async function getReelViewCounts(
  reelIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  reelIds.forEach((id) => map.set(id, 0));
  if (reelIds.length === 0) return map;

  const supabase = await createClient();
  const { data } = await supabase
    .from("reel_views")
    .select("reel_id")
    .in("reel_id", reelIds);

  for (const r of (data as { reel_id: string }[]) ?? []) {
    map.set(r.reel_id, (map.get(r.reel_id) ?? 0) + 1);
  }
  return map;
}

/** Bir nechta reel uchun izohlar sonini olish */
export async function getReelCommentCounts(
  reelIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  reelIds.forEach((id) => map.set(id, 0));
  if (reelIds.length === 0) return map;

  const supabase = await createClient();
  const { data } = await supabase
    .from("reel_comments")
    .select("reel_id")
    .in("reel_id", reelIds);

  for (const r of (data as { reel_id: string }[]) ?? []) {
    map.set(r.reel_id, (map.get(r.reel_id) ?? 0) + 1);
  }
  return map;
}


// ============================================================
// SMART MATCHING (aqlli moslashtirish)
// ============================================================

/** Bitta ko'nikmani id bo'yicha olish */
export async function getSkillById(skillId: string): Promise<Skill | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("skills")
    .select("*")
    .eq("id", skillId)
    .maybeSingle();
  return (data as Skill | null) ?? null;
}

/**
 * Ko'nikma bo'yicha moslashuvchi profillarni olish.
 *   - role="teacher": men o'rgataman -> menga O'RGANMOQCHILAR ro'yxati (learn)
 *   - role="learner": men o'rganaman -> menga O'RGATA OLADIGANLAR ro'yxati (teach)
 *
 * Tartib: tasdiqlangan (is_verified) foydalanuvchilar DOIM birinchi qatorda,
 * so'ng o'rtacha reyting (trust_score) bo'yicha kamayish tartibida.
 */
export async function getSkillMatchProfiles(
  skillId: string,
  role: "teacher" | "learner",
  excludeUserId?: string
): Promise<Profile[]> {
  const supabase = await createClient();
  // teacher ko'radi -> learnerlarni; learner ko'radi -> teacherlarni
  const wantedType = role === "teacher" ? "learn" : "teach";

  const { data } = await supabase
    .from("user_skills")
    .select("profile:profiles!user_skills_user_id_fkey(*)")
    .eq("skill_id", skillId)
    .eq("type", wantedType);

  const rows =
    (data as unknown as { profile: Profile | null }[]) ?? [];
  const profiles: Profile[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const p = r.profile;
    if (!p) continue;
    if (excludeUserId && p.id === excludeUserId) continue;
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    profiles.push(p);
  }

  // Tasdiqlanganlar birinchi, keyin reyting bo'yicha
  profiles.sort((a, b) => {
    const av = a.is_verified ? 1 : 0;
    const bv = b.is_verified ? 1 : 0;
    if (av !== bv) return bv - av;
    return (b.trust_score ?? 0) - (a.trust_score ?? 0);
  });

  return profiles;
}
