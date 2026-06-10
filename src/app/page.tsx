import Link from "next/link";
import Logo from "@/components/Logo";
import UserCard from "@/components/UserCard";
import { createClient } from "@/lib/supabase/server";
import { getUserSkills } from "@/lib/queries";
import type { Profile, ProfileWithSkills } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = await createClient();
  const [users, skills, exchanges] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("skills").select("id", { count: "exact", head: true }),
    supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
  ]);
  return {
    users: users.count ?? 0,
    skills: skills.count ?? 0,
    exchanges: exchanges.count ?? 0,
  };
}

async function getFeatured(): Promise<ProfileWithSkills[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("onboarded", true)
    .order("xp", { ascending: false })
    .limit(3);

  const profiles = (data as Profile[]) ?? [];
  return Promise.all(
    profiles.map(async (p) => {
      const { teach, learn } = await getUserSkills(p.id);
      return { ...p, teach_skills: teach, learn_skills: learn };
    })
  );
}

export default async function LandingPage() {
  const [stats, featured] = await Promise.all([getStats(), getFeatured()]);

  return (
    <div className="min-h-screen">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="container-app flex h-16 items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="btn-ghost">
              Kirish
            </Link>
            <Link href="/register" className="btn-primary">
              Boshlash
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-success-50">
        <div className="container-app grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-2">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
              🇺🇿 O&apos;zbekistondagi birinchi bepul P2P platforma
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl">
              Bilim qoldiring,{" "}
              <span className="text-brand">tajriba oling</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-gray-600">
              Sen menga Python o&apos;rgat, men senga Ingliz tili o&apos;rgataman.
              Hech qanday to&apos;lov yo&apos;q — faqat bilim almashinuvi.
            </p>
            <p className="mt-2 text-sm font-medium italic text-success-700">
              Learn. Teach. Be remembered.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary px-7 py-3 text-base">
                Bepul boshlash →
              </Link>
              <Link
                href="/login"
                className="btn-outline px-7 py-3 text-base"
              >
                Hisobim bor
              </Link>
            </div>
          </div>

          {/* Hero illustration — sample card */}
          <div className="relative animate-fade-in">
            <div className="card rotate-1 p-5 shadow-card-hover">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
                  M
                </div>
                <div>
                  <p className="font-semibold">Madina</p>
                  <p className="text-xs text-gray-500">Toshkent</p>
                </div>
                <span className="ml-auto rounded-full bg-success px-2.5 py-1 text-xs font-bold text-white">
                  100%
                </span>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-success-700">
                  🎓 O&apos;rgatadi: <b>Ingliz tili</b>, Copywriting
                </p>
                <p className="text-brand-700">
                  📚 O&apos;rganmoqchi: <b>Python</b>, SMM
                </p>
              </div>
            </div>
            <div className="card absolute -bottom-6 -left-2 w-48 -rotate-3 p-4 shadow-card-hover sm:-left-6">
              <p className="text-xs font-semibold text-gray-700">
                ⭐ 4.9 reyting
              </p>
              <p className="mt-1 text-xs text-gray-500">
                23 ta dars o&apos;tkazgan
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTIKA */}
      <section className="border-y border-gray-100 bg-white">
        <div className="container-app grid grid-cols-3 gap-4 py-10 text-center">
          <Stat value={stats.users} label="Foydalanuvchi" suffix="+" />
          <Stat value={stats.skills} label="Ko'nikma" suffix="+" />
          <Stat value={stats.exchanges} label="Bilim almashuvi" suffix="+" />
        </div>
      </section>

      {/* QANDAY ISHLAYDI */}
      <section className="container-app py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Qanday ishlaydi?
          </h2>
          <p className="mt-2 text-gray-600">
            Atigi 3 qadamda bilim almashishni boshlang.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Step
            n={1}
            color="bg-brand"
            title="Profil yarating"
            desc="Nimani o'rgata olishingiz va nimani o'rganmoqchi ekanligingizni belgilang."
          />
          <Step
            n={2}
            color="bg-success"
            title="Mos hamkor toping"
            desc="Moslik algoritmi sizga eng mos odamlarni ko'rsatadi — o'zaro almashinuv 100%."
          />
          <Step
            n={3}
            color="bg-accent"
            title="O'rganing va o'rgating"
            desc="Chat orqali bog'laning, dars o'ting, baho oling va XP yig'ing."
          />
        </div>
      </section>

      {/* FOYDALANUVCHILAR */}
      {featured.length > 0 && (
        <section className="bg-white py-16">
          <div className="container-app">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                Platformadagi odamlar
              </h2>
              <p className="mt-2 text-gray-600">
                Hoziroq bilim almashishga tayyor foydalanuvchilar.
              </p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <UserCard key={p.id} profile={p} showMatch={false} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-r from-brand to-brand-700 py-16 text-center text-white">
        <div className="container-app">
          <h2 className="text-3xl font-bold">Bugun o&apos;rganishni boshlang</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Bepul. Cheksiz. Faqat bilim almashinuvi. Zikra hamjamiyatiga
            qo&apos;shiling.
          </p>
          <Link
            href="/register"
            className="btn mt-7 bg-white px-8 py-3 text-base font-semibold text-brand hover:bg-brand-50"
          >
            Bepul ro&apos;yxatdan o&apos;tish
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="container-app flex flex-col items-center justify-between gap-4 text-sm text-gray-500 sm:flex-row">
          <Logo size="sm" />
          <p>© {new Date().getFullYear()} Zikra. Learn. Teach. Be remembered.</p>
        </div>
      </footer>
    </div>
  );
}

function Stat({
  value,
  label,
  suffix,
}: {
  value: number;
  label: string;
  suffix?: string;
}) {
  return (
    <div>
      <p className="text-3xl font-extrabold text-brand sm:text-4xl">
        {value}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  );
}

function Step({
  n,
  title,
  desc,
  color,
}: {
  n: number;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div className="card p-6">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${color} text-lg font-bold text-white`}
      >
        {n}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  );
}
