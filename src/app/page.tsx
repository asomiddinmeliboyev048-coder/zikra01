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
    <div className="min-h-screen overflow-hidden">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/70 backdrop-blur">
        <div className="container-app flex h-16 items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="btn-ghost">
              Kirish
            </Link>
            <Link href="/register" className="btn-primary">
              Bepul boshlash
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-white">
        {/* Fon bezaklari */}
        <div className="absolute inset-0 -z-10 bg-dots opacity-70" />
        <div className="absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl animate-blob" />
        <div className="absolute -right-20 top-10 -z-10 h-72 w-72 rounded-full bg-success-100/70 blur-3xl animate-blob [animation-delay:3s]" />
        <div className="absolute bottom-0 left-1/3 -z-10 h-64 w-64 rounded-full bg-accent-100/50 blur-3xl animate-blob [animation-delay:6s]" />

        <div className="container-app grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/70 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
              🇺🇿 O&apos;zbekistonda birinchi · 🌍 Dunyoda o&apos;ziga xos
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl">
              Bilim qoldiring,{" "}
              <span className="text-gradient">tajriba oling</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-gray-600">
              Zikra — bepul P2P ko&apos;nikma almashish platformasi.{" "}
              <span className="font-semibold text-gray-800">
                &quot;Sen menga Python o&apos;rgat, men senga Ingliz tili
                o&apos;rgataman.&quot;
              </span>{" "}
              Hech qanday to&apos;lov yo&apos;q — faqat bilim almashinuvi.
            </p>
            <p className="mt-3 inline-block rounded-lg bg-brand-50 px-3 py-1 text-sm font-semibold italic text-brand-700">
              Learn. Teach. Be remembered.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary px-7 py-3 text-base shadow-card-hover">
                Bepul boshlash →
              </Link>
              <Link href="/login" className="btn-outline px-7 py-3 text-base">
                Hisobim bor
              </Link>
            </div>

            {/* Mini ishonch belgilari */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">✅ 100% bepul</span>
              <span className="flex items-center gap-1.5">🔁 O&apos;zaro almashinuv</span>
              <span className="flex items-center gap-1.5">🏆 Gamifikatsiya</span>
            </div>
          </div>

          {/* Hero kartochkalar */}
          <div className="relative h-[380px] animate-fade-in">
            <div className="glass absolute right-0 top-4 w-72 rotate-2 rounded-2xl border border-white/60 p-5 shadow-card-hover animate-float">
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
              <div className="mt-4 space-y-1.5 text-sm">
                <p className="text-success-700">🎓 O&apos;rgatadi: <b>Ingliz tili</b></p>
                <p className="text-brand-700">📚 O&apos;rganmoqchi: <b>Python</b></p>
              </div>
            </div>

            <div className="glass absolute bottom-6 left-0 w-64 -rotate-3 rounded-2xl border border-white/60 p-5 shadow-card-hover animate-float [animation-delay:1.5s]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success text-lg font-bold text-white">
                  J
                </div>
                <div>
                  <p className="font-semibold">Jasur</p>
                  <p className="text-xs text-gray-500">⭐ 4.9 · 23 dars</p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-sm">
                <p className="text-success-700">🎓 O&apos;rgatadi: <b>Python</b></p>
                <p className="text-brand-700">📚 O&apos;rganmoqchi: <b>Ingliz tili</b></p>
              </div>
            </div>

            <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-2xl text-white shadow-card-hover animate-float [animation-delay:0.7s]">
              🔁
            </div>
          </div>
        </div>
      </section>

      {/* STATISTIKA */}
      <section className="border-y border-gray-100 bg-white">
        <div className="container-app grid grid-cols-3 gap-4 py-10 text-center">
          <Stat icon="👥" value={stats.users} label="Foydalanuvchi" suffix="+" />
          <Stat icon="🎯" value={stats.skills} label="Ko'nikma" suffix="+" />
          <Stat icon="🤝" value={stats.exchanges} label="Bilim almashuvi" suffix="+" />
        </div>
      </section>

      {/* QANDAY ISHLAYDI */}
      <section className="container-app py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-brand">
            Oddiy va tez
          </span>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            Qanday ishlaydi?
          </h2>
          <p className="mt-3 text-gray-600">
            Atigi 3 qadamda bilim almashishni boshlang.
          </p>
        </div>

        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          <Step n={1} color="bg-brand" emoji="📝" title="Profil yarating"
            desc="Nimani o'rgata olishingiz va nimani o'rganmoqchi ekanligingizni belgilang." />
          <Step n={2} color="bg-success" emoji="🔍" title="Mos hamkor toping"
            desc="Moslik algoritmi sizga eng mos odamlarni ko'rsatadi — o'zaro almashinuv 100%." />
          <Step n={3} color="bg-accent" emoji="🚀" title="O'rganing va o'rgating"
            desc="Chat orqali bog'laning, dars o'ting, baho oling va XP yig'ing." />
        </div>
      </section>

      {/* NEGA NOYOB */}
      <section className="bg-gradient-to-b from-brand-50/60 to-white py-16 sm:py-20">
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Nega <span className="text-gradient">Zikra</span> noyob?
            </h2>
            <p className="mt-3 text-gray-600">
              Bunday platforma hali yaratilmagan edi — Zikra buni o&apos;zgartiradi.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Feature emoji="💸" title="To'liq bepul" desc="Hech qanday to'lov, obuna yoki yashirin xarajat yo'q." />
            <Feature emoji="🔁" title="O'zaro almashinuv" desc="Pul emas, bilim valyuta. Sen o'rgat, sen o'rgan." />
            <Feature emoji="🏆" title="Gamifikatsiya" desc="XP, darajalar, nishonlar va streak — o'rganish qiziqarli." />
            <Feature emoji="🇺🇿" title="O'zbekcha" desc="To'liq o'zbek tilida, mahalliy hamjamiyat uchun." />
          </div>
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
              <p className="mt-3 text-gray-600">
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
      <section className="relative overflow-hidden bg-gradient-to-r from-brand via-brand-600 to-brand-700 py-20 text-center text-white">
        <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl animate-blob" />
        <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-success/20 blur-2xl animate-blob [animation-delay:4s]" />
        <div className="container-app relative">
          <h2 className="text-3xl font-bold sm:text-4xl">Bugun o&apos;rganishni boshlang</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Bepul. Cheksiz. Faqat bilim almashinuvi. Zikra hamjamiyatiga
            qo&apos;shiling va o&apos;z izingizni qoldiring.
          </p>
          <Link
            href="/register"
            className="btn mt-8 bg-white px-8 py-3 text-base font-semibold text-brand shadow-card-hover hover:bg-brand-50"
          >
            Bepul ro&apos;yxatdan o&apos;tish →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 py-12 text-gray-300">
        <div className="container-app">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Brend */}
            <div>
              <span className="inline-flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
                  Z
                </span>
                <span className="text-xl font-bold text-white">Zikra</span>
              </span>
              <p className="mt-3 max-w-xs text-sm text-gray-400">
                O&apos;zbekistondagi birinchi bepul P2P ko&apos;nikma almashish
                platformasi. Learn. Teach. Be remembered.
              </p>
            </div>

            {/* Tezkor havolalar */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
                Havolalar
              </h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/register" className="hover:text-white">Ro&apos;yxatdan o&apos;tish</Link></li>
                <li><Link href="/login" className="hover:text-white">Kirish</Link></li>
              </ul>
            </div>

            {/* Support bilan bog'lanish */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
                Support bilan bog&apos;lanish
              </h4>
              <p className="mb-3 text-sm text-gray-400">
                Savol yoki taklif bormi? Biz bilan bog&apos;laning:
              </p>
              <div className="flex flex-col gap-2.5">
                <a
                  href="tel:+998918917007"
                  className="flex items-center gap-3 text-sm text-gray-200 hover:text-white"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success/20 text-success">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  +998 91 891 70 07
                </a>

                <a
                  href="https://t.me/asomiddinmeliboyev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-gray-200 hover:text-white"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#229ED9]/20 text-[#229ED9]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.95 4.46 18.66 19.9c-.25 1.1-.9 1.37-1.82.85l-5.03-3.71-2.43 2.34c-.27.27-.5.5-1 .5l.36-5.12 9.3-8.4c.4-.36-.09-.56-.63-.2L5.58 13.2.62 11.65c-1.08-.34-1.1-1.08.23-1.6L20.55 2.9c.9-.34 1.69.2 1.4 1.56z" />
                    </svg>
                  </span>
                  Telegram: @asomiddinmeliboyev
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Zikra. Barcha huquqlar himoyalangan. Learn. Teach. Be remembered.
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  suffix,
}: {
  icon: string;
  value: number;
  label: string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="mb-1 text-2xl">{icon}</span>
      <p className="text-3xl font-extrabold text-gradient sm:text-4xl">
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
  emoji,
}: {
  n: number;
  title: string;
  desc: string;
  color: string;
  emoji: string;
}) {
  return (
    <div className="card relative p-6 transition hover:-translate-y-1 hover:shadow-card-hover">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color} text-xl text-white shadow-sm`}>
        {emoji}
      </div>
      <span className="absolute right-5 top-5 text-3xl font-extrabold text-gray-100">
        {n}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  );
}

function Feature({
  emoji,
  title,
  desc,
}: {
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="card p-6 text-center transition hover:-translate-y-1 hover:shadow-card-hover">
      <span className="text-3xl">{emoji}</span>
      <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
      <p className="mt-1.5 text-sm text-gray-600">{desc}</p>
    </div>
  );
}
