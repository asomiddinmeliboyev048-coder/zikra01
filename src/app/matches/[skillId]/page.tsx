import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import VerifiedBadge from "@/components/VerifiedBadge";
import { getCurrentProfile, getSkillById, getSkillMatchProfiles } from "@/lib/queries";
import { avatarFallback } from "@/lib/utils";

export const metadata: Metadata = { title: "Mosliklar" };
export const dynamic = "force-dynamic";

/**
 * Aqlli moslashtirish natijalari sahifasi.
 *
 * URL: /matches/<skillId>?role=teacher|learner
 *   - role=teacher: joriy foydalanuvchi shu ko'nikmani O'RGATADI ->
 *     unga o'rganmoqchi bo'lganlar (learnerlar) ro'yxati chiqadi.
 *   - role=learner: joriy foydalanuvchi shu ko'nikmani O'RGANADI ->
 *     uni o'rgata oladiganlar (teacherlar) ro'yxati chiqadi.
 *
 * Tasdiqlangan (galochka) foydalanuvchilar doim yuqorida turadi.
 */
export default async function MatchesPage({
  params,
  searchParams,
}: {
  params: Promise<{ skillId: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  const { skillId } = await params;
  const { role: roleParam } = await searchParams;
  const role = roleParam === "teacher" ? "teacher" : "learner";

  const [skill, profiles] = await Promise.all([
    getSkillById(skillId),
    getSkillMatchProfiles(skillId, role, me.id),
  ]);

  const skillName = skill?.name ?? "Ko'nikma";
  const heading =
    role === "teacher"
      ? `"${skillName}" o'rganmoqchi bo'lganlar`
      : `"${skillName}" o'rgata oladiganlar`;
  const subtitle =
    role === "teacher"
      ? "Quyidagi insonlar sizdan shu ko'nikmani o'rganmoqchi va sizni kutishmoqda."
      : "Quyidagi insonlar siz o'rganmoqchi bo'lgan ko'nikmani o'rgata oladi.";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          <p className="mt-1 text-xs text-gray-400">{profiles.length} ta foydalanuvchi</p>
        </div>

        {profiles.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-4xl">🔍</span>
            <p className="font-medium text-gray-700">Hozircha mos foydalanuvchi yo&apos;q</p>
            <p className="text-sm text-gray-500">Biroz vaqtdan so&apos;ng yana tekshiring.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => (
              <div key={p.id} className="card flex flex-col gap-3 p-5">
                <div className="flex items-center gap-3">
                  <Image
                    src={p.avatar_url || avatarFallback(p.full_name)}
                    alt={p.full_name}
                    width={52}
                    height={52}
                    className="rounded-xl object-cover"
                    style={{ width: 52, height: 52 }}
                    unoptimized
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 font-semibold text-gray-900">
                      <span className="truncate">{p.full_name}</span>
                      <VerifiedBadge verified={!!p.is_verified} size={16} />
                    </p>
                    {p.username && (
                      <p className="truncate text-xs text-brand">@{p.username}</p>
                    )}
                    {p.trust_score > 0 && (
                      <p className="text-xs text-gray-400">⭐ {p.trust_score.toFixed(1)}</p>
                    )}
                  </div>
                </div>

                {p.bio && (
                  <p className="line-clamp-2 text-sm text-gray-500">{p.bio}</p>
                )}

                <div className="mt-auto flex gap-2">
                  <Link href={`/profile/${p.id}`} className="btn-outline flex-1 text-center text-sm">
                    Profil
                  </Link>
                  <Link href={`/chat?with=${p.id}`} className="btn-primary flex-1 text-center text-sm">
                    Bog&apos;lanish
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
