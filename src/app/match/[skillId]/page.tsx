import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import UserCard from "@/components/UserCard";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getUserSkills } from "@/lib/queries";
import { computeMatchScore } from "@/lib/matching";
import type { Profile, Skill, ProfileWithSkills, UserSkill } from "@/lib/types";

export const dynamic = "force-dynamic";

// mentors  = shu ko'nikmani O'RGATA oladiganlar (men o'rganmoqchi bo'lganlar uchun)
// students = shu ko'nikmani O'RGANMOQCHI bo'lganlar (men o'rgata olganlar uchun)
type Mode = "mentors" | "students";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ?mode= qiymatini normallashtirish (turli nomlarni qabul qilamiz) */
function parseMode(raw?: string): Mode {
  const v = (raw ?? "").toLowerCase();
  if (["students", "student", "learners", "learn", "teach"].includes(v)) {
    return "students";
  }
  // standart: o'rgatuvchilar (mentors)
  return "mentors";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ skillId: string }>;
}): Promise<Metadata> {
  const { skillId } = await params;
  const name = decodeURIComponent(skillId);
  return { title: `${name} bo'yicha hamkorlar` };
}

export default async function MatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ skillId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  if (!me.onboarded) redirect("/onboarding");

  const { skillId } = await params;
  const sp = await searchParams;
  const mode = parseMode(sp.mode);

  const supabase = await createClient();

  // --- 1) Ko'nikmani aniqlaymiz: avval UUID bo'yicha, bo'lmasa nom bo'yicha ---
  let skill: Skill | null = null;
  if (UUID_RE.test(skillId)) {
    const { data } = await supabase
      .from("skills")
      .select("*")
      .eq("id", skillId)
      .maybeSingle();
    skill = (data as Skill | null) ?? null;
  }
  if (!skill) {
    const name = decodeURIComponent(skillId).trim();
    const { data } = await supabase
      .from("skills")
      .select("*")
      .ilike("name", name)
      .maybeSingle();
    skill = (data as Skill | null) ?? null;
  }

  // Ko'nikma topilmasa — 404 emas, do'stona bo'sh holat
  if (!skill) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container-app py-8">
          <div className="card flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-4xl">🔍</span>
            <p className="font-medium text-gray-700">Ko&apos;nikma topilmadi</p>
            <p className="max-w-sm text-sm text-gray-500">
              Bu ko&apos;nikma o&apos;chirilgan yoki mavjud emas. Boshqa
              hamkorlarni Kashf etish bo&apos;limidan topishingiz mumkin.
            </p>
            <Link href="/discovery" className="btn-primary mt-2">
              Kashf etishga o&apos;tish
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // --- 2) Shu ko'nikma bo'yicha kerakli foydalanuvchi id'larini olamiz ---
  // mentors -> ko'nikmani "teach" qiladiganlar; students -> "learn" qiladiganlar
  const wantType: UserSkill["type"] = mode === "mentors" ? "teach" : "learn";

  const { data: usRows } = await supabase
    .from("user_skills")
    .select("user_id")
    .eq("skill_id", skill.id)
    .eq("type", wantType);

  const userIds = Array.from(
    new Set(((usRows as { user_id: string }[]) ?? []).map((r) => r.user_id))
  ).filter((id) => id !== me.id);

  // --- 3) Profillarni TASDIQLANGANLAR TEPADA bo'lgan holda olamiz ---
  // is_verified DESC (galochkalilar birinchi), keyin trust_score DESC.
  let profiles: Profile[] = [];
  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds)
      .eq("onboarded", true)
      .order("is_verified", { ascending: false })
      .order("trust_score", { ascending: false })
      .order("created_at", { ascending: false });
    profiles = (profilesData as Profile[]) ?? [];
  }

  // --- 4) Kartochkalar uchun ularning ko'nikmalarini va moslikni qo'shamiz ---
  const mySkills = await getUserSkills(me.id);
  const skillsByUser = new Map<string, { teach: Skill[]; learn: Skill[] }>();
  if (profiles.length > 0) {
    const { data: allUs } = await supabase
      .from("user_skills")
      .select("user_id, type, skill:skills(*)")
      .in(
        "user_id",
        profiles.map((p) => p.id)
      );
    const rows = (allUs as unknown as (UserSkill & { skill: Skill })[]) ?? [];
    for (const r of rows) {
      if (!skillsByUser.has(r.user_id)) {
        skillsByUser.set(r.user_id, { teach: [], learn: [] });
      }
      if (r.skill) skillsByUser.get(r.user_id)![r.type].push(r.skill);
    }
  }

  // MUHIM: verified-first tartibni SAQLAB qolamiz (match bo'yicha QAYTA
  // saralamaymiz) — spec talabi: galochkalilar har doim tepada.
  const enriched: ProfileWithSkills[] = profiles.map((p) => {
    const s = skillsByUser.get(p.id) ?? { teach: [], learn: [] };
    const score = computeMatchScore(
      { teach: mySkills.teach, learn: mySkills.learn },
      { teach: s.teach, learn: s.learn }
    );
    return {
      ...p,
      teach_skills: s.teach,
      learn_skills: s.learn,
      match_score: score,
    };
  });

  const title =
    mode === "mentors"
      ? `«${skill.name}» — o'rgatuvchilar`
      : `«${skill.name}» — o'rganuvchilar`;
  const subtitle =
    mode === "mentors"
      ? "Siz o'rganmoqchi bo'lgan bu ko'nikmani o'rgata oladigan hamkorlar. Tasdiqlangan (galochkali) ustozlar tepada."
      : "Siz o'rgata oladigan bu ko'nikmani o'rganmoqchi bo'lganlar. Tasdiqlangan foydalanuvchilar tepada.";

  const tabBase =
    "rounded-lg px-4 py-2 text-sm font-medium transition whitespace-nowrap";
  const tabActive = "bg-brand text-white shadow-sm";
  const tabIdle = "text-gray-600 hover:bg-gray-100";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app py-8">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>

        {/* O'rgatuvchilar / O'rganuvchilar almashtirgichi */}
        <div className="mb-6 inline-flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
          <Link
            href={`/match/${skill.id}?mode=mentors`}
            className={`${tabBase} ${mode === "mentors" ? tabActive : tabIdle}`}
          >
            🎓 O&apos;rgatuvchilar
          </Link>
          <Link
            href={`/match/${skill.id}?mode=students`}
            className={`${tabBase} ${
              mode === "students" ? tabActive : tabIdle
            }`}
          >
            📚 O&apos;rganuvchilar
          </Link>
        </div>

        {enriched.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-4xl">🫥</span>
            <p className="font-medium text-gray-700">
              Hozircha hech kim topilmadi
            </p>
            <p className="max-w-sm text-sm text-gray-500">
              {mode === "mentors"
                ? "Bu ko'nikmani o'rgata oladigan foydalanuvchilar hali yo'q. Keyinroq yana urinib ko'ring."
                : "Bu ko'nikmani o'rganmoqchi bo'lgan foydalanuvchilar hali yo'q. Keyinroq yana urinib ko'ring."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enriched.map((p) => (
              <UserCard key={p.id} profile={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
