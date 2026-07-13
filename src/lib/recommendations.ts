import { createClient } from "@/lib/supabase/server";
import { getUserSkills } from "@/lib/queries";
import { computeMatchScore } from "@/lib/matching";
import type { Profile, Skill, ProfileWithSkills, UserSkill } from "@/lib/types";

/** Tavsiya qilingan profil — mos kelgan ko'nikmalar bilan */
export interface RecoProfile extends ProfileWithSkills {
  /** Ular o'rgata oladigan, MEN o'rganmoqchi bo'lgan ko'nikmalar */
  matchedTeach: Skill[];
  /** Ular o'rganmoqchi bo'lgan, MEN o'rgata oladigan ko'nikmalar */
  matchedLearn: Skill[];
}

/**
 * Tasdiqlangan (is_verified) profillar doim tepada, so'ng moslik foizi
 * yuqori bo'lganlar.
 */
function sortVerifiedThenScore(a: RecoProfile, b: RecoProfile): number {
  const av = a.is_verified ? 1 : 0;
  const bv = b.is_verified ? 1 : 0;
  if (av !== bv) return bv - av;
  return (b.match_score ?? 0) - (a.match_score ?? 0);
}

/**
 * Joriy foydalanuvchi uchun ikki yo'nalishli tavsiyalar:
 *   - teachers: MENGA o'rgata oladiganlar (ularning teach ∩ mening learn)
 *   - learners: MENDAN o'rganmoqchi bo'lganlar (ularning learn ∩ mening teach)
 * Har biri tasdiq belgisi va moslik bo'yicha tartiblangan.
 */
export async function computeRecommendations(meId: string): Promise<{
  teachers: RecoProfile[];
  learners: RecoProfile[];
}> {
  const supabase = await createClient();
  const mine = await getUserSkills(meId);
  const myTeach = new Set(mine.teach.map((s) => s.id));
  const myLearn = new Set(mine.learn.map((s) => s.id));

  const { data: profilesData } = await supabase
    .from("profiles")
    .select("*")
    .eq("onboarded", true)
    .neq("id", meId);

  const profiles = (profilesData as Profile[]) ?? [];
  const ids = profiles.map((p) => p.id);

  const skillsByUser = new Map<string, { teach: Skill[]; learn: Skill[] }>();
  if (ids.length > 0) {
    const { data: us } = await supabase
      .from("user_skills")
      .select("user_id, type, skill:skills(*)")
      .in("user_id", ids);
    const rows = (us as unknown as (UserSkill & { skill: Skill })[]) ?? [];
    for (const r of rows) {
      if (!skillsByUser.has(r.user_id)) {
        skillsByUser.set(r.user_id, { teach: [], learn: [] });
      }
      if (r.skill) skillsByUser.get(r.user_id)![r.type].push(r.skill);
    }
  }

  const teachers: RecoProfile[] = [];
  const learners: RecoProfile[] = [];

  for (const p of profiles) {
    const s = skillsByUser.get(p.id) ?? { teach: [], learn: [] };
    const matchedTeach = s.teach.filter((sk) => myLearn.has(sk.id));
    const matchedLearn = s.learn.filter((sk) => myTeach.has(sk.id));
    const score = computeMatchScore(
      { teach: mine.teach, learn: mine.learn },
      { teach: s.teach, learn: s.learn }
    );
    const reco: RecoProfile = {
      ...p,
      teach_skills: s.teach,
      learn_skills: s.learn,
      match_score: score,
      matchedTeach,
      matchedLearn,
    };
    if (matchedTeach.length > 0) teachers.push(reco);
    if (matchedLearn.length > 0) learners.push(reco);
  }

  teachers.sort(sortVerifiedThenScore);
  learners.sort(sortVerifiedThenScore);
  return { teachers, learners };
}

/**
 * Match tavsiyalari uchun bildirishnoma yaratish (kuniga bir marta, takrorsiz).
 *
 * - "N kishi sizga bilim o'rgata oladi" → /matches?tab=teachers
 * - "N kishi sizdan o'rganmoqchi"       → /matches?tab=learners
 *
 * Eslatma: bu "best-effort" — agar notifications jadvaliga insert RLS bilan
 * cheklangan bo'lsa, jimgina o'tkazib yuboriladi (sahifaning o'zi baribir
 * havola orqali ochiladi).
 */
export async function ensureMatchNotifications(meId: string): Promise<void> {
  try {
    const { teachers, learners } = await computeRecommendations(meId);
    const supabase = await createClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    async function upsertNotif(count: number, link: string, message: string) {
      if (count <= 0) return;
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", meId)
        .eq("link", link)
        .gte("created_at", since)
        .maybeSingle();
      if (existing) return; // oxirgi 24 soatda allaqachon yuborilgan
      await supabase.from("notifications").insert({
        user_id: meId,
        type: "match",
        message,
        link,
        is_read: false,
      });
    }

    await upsertNotif(
      teachers.length,
      "/matches?tab=teachers",
      `🎓 ${teachers.length} ta foydalanuvchi sizga bilim o'rgata oladi. Ularni ko'ring!`
    );
    await upsertNotif(
      learners.length,
      "/matches?tab=learners",
      `📚 ${learners.length} ta foydalanuvchi sizdan o'rganmoqchi. Ularga bilim ulashing!`
    );
  } catch {
    /* best-effort — xatolikni e'tiborsiz qoldiramiz */
  }
}
