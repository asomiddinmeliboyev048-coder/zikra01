import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import StoriesBar from "@/components/StoriesBar";
import DiscoveryClient from "./DiscoveryClient";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getUserSkills } from "@/lib/queries";
import { computeMatchScore } from "@/lib/matching";
import type { Profile, Skill, ProfileWithSkills, UserSkill } from "@/lib/types";

export const metadata: Metadata = { title: "Kashf etish" };
export const dynamic = "force-dynamic";

export default async function DiscoveryPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  if (!me.onboarded) redirect("/onboarding");

  const supabase = await createClient();

  // Mening ko'nikmalarim
  const mySkills = await getUserSkills(me.id);

  // Boshqa barcha onboarded foydalanuvchilar
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("*")
    .eq("onboarded", true)
    .neq("id", me.id);

  const profiles = (profilesData as Profile[]) ?? [];
  const ids = profiles.map((p) => p.id);

  // Ularning barcha ko'nikmalarini bitta so'rovda olamiz
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
      skillsByUser.get(r.user_id)![r.type].push(r.skill);
    }
  }

  // Moslik hisoblash
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

  // Moslik bo'yicha tartiblash (yuqori birinchi)
  enriched.sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));

  // Filter uchun ko'nikmalar ro'yxati
  const { data: allSkills } = await supabase
    .from("skills")
    .select("*")
    .order("name");

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app py-8">
        <StoriesBar />
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Hamkor toping</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sizga eng mos keladigan odamlar yuqorida. Moslik foizi o&apos;zaro
            almashinuv imkoniyatini ko&apos;rsatadi.
          </p>
        </div>

        {/* Tavsiyalar sahifasiga o'tish (kim o'rgata oladi / kim o'rganmoqchi) */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/matches?tab=teachers"
            className="card flex items-center gap-3 p-4 transition hover:shadow-card-hover"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success-50 text-xl">
              🎓
            </span>
            <span>
              <span className="block font-semibold text-gray-900">
                Menga kim o&apos;rgata oladi?
              </span>
              <span className="block text-xs text-gray-500">
                Siz o&apos;rganmoqchi bo&apos;lgan ko&apos;nikma egalari
              </span>
            </span>
          </Link>
          <Link
            href="/matches?tab=learners"
            className="card flex items-center gap-3 p-4 transition hover:shadow-card-hover"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xl">
              📚
            </span>
            <span>
              <span className="block font-semibold text-gray-900">
                Mendan kim o&apos;rganmoqchi?
              </span>
              <span className="block text-xs text-gray-500">
                Siz o&apos;rgata oladigan ko&apos;nikmani xohlaganlar
              </span>
            </span>
          </Link>
        </div>

        <DiscoveryClient
          profiles={enriched}
          skills={(allSkills as Skill[]) ?? []}
        />
      </main>
    </div>
  );
}
