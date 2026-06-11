import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  Skill,
  ProfileWithSkills,
  UserSkill,
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
