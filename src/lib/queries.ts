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
