import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import MatchBadge from "@/components/MatchBadge";
import VerifiedBadge from "@/components/VerifiedBadge";
import { getCurrentProfile } from "@/lib/queries";
import { computeRecommendations, type RecoProfile } from "@/lib/recommendations";
import { avatarFallback, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tavsiyalar" };
export const dynamic = "force-dynamic";

type Tab = "teachers" | "learners";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  if (!me.onboarded) redirect("/onboarding");

  const { tab: tabParam } = await searchParams;
  const tab: Tab = tabParam === "learners" ? "learners" : "teachers";

  const { teachers, learners } = await computeRecommendations(me.id);

  const list = tab === "teachers" ? teachers : learners;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app max-w-3xl py-8">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Sizga mos odamlar</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tasdiqlangan (✔) va eng mos keladigan foydalanuvchilar yuqorida.
          </p>
        </div>

        {/* Tablar */}
        <div className="mb-6 flex gap-2 rounded-xl bg-gray-100 p-1 dark:bg-white/5">
          <TabLink
            href="/matches?tab=teachers"
            active={tab === "teachers"}
            label="Menga o'rgata oladi"
            count={teachers.length}
          />
          <TabLink
            href="/matches?tab=learners"
            active={tab === "learners"}
            label="Mendan o'rganmoqchi"
            count={learners.length}
          />
        </div>

        {list.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-4xl">🔍</span>
            <p className="font-medium text-gray-700">Hozircha mos odam topilmadi</p>
            <p className="max-w-sm text-sm text-gray-500">
              {tab === "teachers"
                ? "Profilingizga o'rganmoqchi bo'lgan ko'nikmalar qo'shsangiz, sizga o'rgata oladigan odamlar shu yerda chiqadi."
                : "Profilingizga o'rgata oladigan ko'nikmalar qo'shsangiz, sizdan o'rganmoqchi bo'lganlar shu yerda chiqadi."}
            </p>
            <Link href="/onboarding" className="btn-outline mt-2">
              Ko&apos;nikmalarni tahrirlash
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map((p) => (
              <MatchRow key={p.id} profile={p} tab={tab} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
        active ? "bg-white text-brand shadow-sm dark:bg-[#161d31]" : "text-gray-500"
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 text-xs",
          active ? "bg-brand-50 text-brand dark:bg-brand/20" : "bg-gray-200 text-gray-500 dark:bg-white/10"
        )}
      >
        {count}
      </span>
    </Link>
  );
}

function MatchRow({ profile, tab }: { profile: RecoProfile; tab: Tab }) {
  const matched = tab === "teachers" ? profile.matchedTeach : profile.matchedLearn;
  const matchLabel =
    tab === "teachers" ? "Sizga o'rgata oladi" : "Sizdan o'rganmoqchi";

  return (
    <li className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <Link href={`/profile/${profile.id}`} className="shrink-0">
        <Image
          src={profile.avatar_url || avatarFallback(profile.full_name)}
          alt={profile.full_name}
          width={56}
          height={56}
          className="h-14 w-14 rounded-2xl object-cover"
          unoptimized
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/profile/${profile.id}`}
            className="truncate font-semibold text-gray-900 hover:text-brand dark:text-white"
          >
            {profile.full_name}
          </Link>
          <VerifiedBadge verified={!!profile.is_verified} size={16} />
          <span className="ml-auto shrink-0">
            <MatchBadge score={profile.match_score ?? 0} />
          </span>
        </div>
        {profile.city && (
          <p className="truncate text-xs text-gray-500">{profile.city}</p>
        )}
        <div className="mt-1.5">
          <p
            className={cn(
              "mb-1 text-[11px] font-medium uppercase tracking-wide",
              tab === "teachers" ? "text-success-700" : "text-brand-700"
            )}
          >
            {matchLabel}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {matched.slice(0, 6).map((s) => (
              <span
                key={s.id}
                className={tab === "teachers" ? "tag-teach" : "tag-learn"}
              >
                {s.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 gap-2 sm:flex-col">
        <Link href={`/chat?with=${profile.id}`} className="btn-primary flex-1 whitespace-nowrap text-sm">
          Bog&apos;lanish
        </Link>
        <Link
          href={`/profile/${profile.id}`}
          className="btn-outline flex-1 whitespace-nowrap text-sm"
        >
          Profil
        </Link>
      </div>
    </li>
  );
}
