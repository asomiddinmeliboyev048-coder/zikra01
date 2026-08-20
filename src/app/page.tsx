import type { Metadata } from "next";
import Link from "next/link";

import Navbar from "@/components/Navbar";
import InstallPWAButton from "@/components/InstallPWAButton";

export const metadata: Metadata = {
  title: "Zikra — Bilimingizni ulashing. O'rganing. Rivojlaning.",
  description:
    "Zikra — bilim va ko'nikmalarni bepul almashish platformasi. Bilganingizni o'rgating, yangi ko'nikmalarni o'rganing va rivojlaning.",
};

const steps = [
  {
    number: "01",
    title: "Profilingizni yarating",
    description:
      "Nimalarni bilishingizni va qaysi ko'nikmalarni o'rganmoqchi ekaningizni belgilang.",
  },
  {
    number: "02",
    title: "Mos insonni toping",
    description:
      "Sizga kerakli bilimga ega insonlarni toping va o'zaro bilim almashishni boshlang.",
  },
  {
    number: "03",
    title: "O'rgating va o'rganing",
    description:
      "Bilimingizni ulashing, yangi ko'nikmalarni egallang va tajribangizni oshiring.",
  },
];

const features = [
  {
    icon: "🎓",
    title: "Ko'nikma almashish",
    description:
      "Pul to'lamasdan bilim almashing. Siz bilgan narsa boshqa birovga kerak bo'lishi mumkin.",
  },
  {
    icon: "🎬",
    title: "Video darslar",
    description:
      "Qisqa va foydali video darslar yarating yoki boshqalarning darslarini tomosha qiling.",
  },
  {
    icon: "💬",
    title: "Hamjamiyat",
    description:
      "O'qituvchilar va o'rganuvchilar bilan muloqot qiling, savollar bering va tajriba almashing.",
  },
  {
    icon: "🔥",
    title: "Streak va XP",
    description:
      "Har kuni o'rganing, XP yig'ing, streak saqlang va yangi darajalarga ko'tariling.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-white text-gray-950">
      <Navbar />

      <main>
        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="relative">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-[-180px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]" />
            <div className="absolute right-[-150px] top-[300px] h-[350px] w-[350px] rounded-full bg-accent/10 blur-[100px]" />
          </div>

          <div className="container-app px-4 pb-20 pt-12 sm:pb-28 sm:pt-20 lg:pb-32 lg:pt-24">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
              {/* Hero copy */}
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-brand-50 px-3.5 py-2 text-xs font-bold text-brand-700 shadow-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] text-white">
                    UZ
                  </span>

                  O'zbekistonda yangi avlod bilim platformasi

                  <span className="text-brand/50">→</span>
                </div>

                <h1 className="mt-7 text-5xl font-black leading-[1.02] tracking-[-0.045em] text-gray-950 sm:text-6xl lg:text-7xl">
                  Bilimingizni
                  <br />
                  <span className="bg-gradient-to-r from-brand via-brand-600 to-accent bg-clip-text text-transparent">
                    ulashing.
                  </span>
                  <br />
                  O'zingiz ham o'rganing.
                </h1>

                <p className="mt-7 max-w-xl text-base leading-7 text-gray-500 sm:text-lg sm:leading-8">
                  Zikra — odamlar bir-biriga bilim va ko'nikmalarini bepul
                  o'rgatadigan platforma. Siz bilgan narsangizni ulashing,
                  kerakli bilimni esa boshqalardan o'rganing.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-950 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-gray-950/10 transition duration-200 hover:-translate-y-0.5 hover:bg-brand hover:shadow-brand/20 sm:text-base"
                  >
                    Bepul boshlash
                    <span aria-hidden>→</span>
                  </Link>

                  <InstallPWAButton variant="outline" />
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <span className="text-green-500">✓</span>
                    Bepul foydalanish
                  </span>

                  <span className="flex items-center gap-1.5">
                    <span className="text-green-500">✓</span>
                    PWA ilova
                  </span>

                  <span className="flex items-center gap-1.5">
                    <span className="text-green-500">✓</span>
                    O'zbek tilida
                  </span>
                </div>
              </div>

              {/* Hero product preview */}
              <div className="relative mx-auto w-full max-w-[520px] lg:mx-0 lg:ml-auto">
                {/* Glow */}
                <div className="absolute -inset-10 -z-10 rounded-full bg-brand/10 blur-3xl" />

                {/* Floating notification */}
                <div className="absolute -left-2 top-10 z-20 hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-2xl shadow-gray-900/10 sm:flex sm:items-center sm:gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-lg">
                    🎉
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      Yangi dars!
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Sizga mos ko'nikma topildi
                    </p>
                  </div>
                </div>

                {/* Main card */}
                <div className="rounded-[2rem] border border-gray-200 bg-white p-4 shadow-2xl shadow-gray-900/10 sm:p-5">
                  {/* Fake app header */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-xs font-black text-white">
                        Z
                      </div>

                      <span className="text-sm font-extrabold">Zikra</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gray-100" />
                      <div className="h-7 w-7 rounded-full bg-gray-100" />
                    </div>
                  </div>

                  {/* Profile */}
                  <div className="mt-5 rounded-3xl bg-gradient-to-br from-gray-50 to-white p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-gradient-to-tr from-accent via-brand to-brand-700 p-[3px]">
                          <div className="rounded-full bg-white p-[3px]">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-xl font-black text-white">
                              S
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-extrabold text-gray-950">
                            Sardor Karimov
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            @sardor • Toshkent
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-600">
                        🔥 7 kun
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-full bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-700">
                        🎨 UI/UX Design
                      </span>

                      <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-600">
                        💻 Figma
                      </span>

                      <span className="rounded-full bg-purple-50 px-3 py-1.5 text-[11px] font-bold text-purple-600">
                        📱 Product
                      </span>
                    </div>

                    {/* XP */}
                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600">
                          Level 7 • Expert
                        </span>

                        <span className="text-[11px] font-medium text-gray-400">
                          1,420 / 2,000 XP
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full w-[71%] rounded-full bg-gradient-to-r from-brand to-accent" />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-6 grid grid-cols-3 border-t border-gray-100 pt-5 text-center">
                      <div>
                        <p className="text-lg font-black text-gray-950">28</p>
                        <p className="mt-0.5 text-[10px] text-gray-400">
                          Darslar
                        </p>
                      </div>

                      <div className="border-x border-gray-100">
                        <p className="text-lg font-black text-gray-950">
                          4.9
                        </p>
                        <p className="mt-0.5 text-[10px] text-gray-400">
                          Reyting
                        </p>
                      </div>

                      <div>
                        <p className="text-lg font-black text-gray-950">12</p>
                        <p className="mt-0.5 text-[10px] text-gray-400">
                          Nishonlar
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recommended */}
                  <div className="mt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-extrabold text-gray-950">
                        Sizga tavsiya
                      </p>

                      <span className="text-xs font-bold text-brand">
                        Barchasi →
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-gray-100 p-3">
                        <div className="flex h-20 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-blue-50 text-3xl">
                          🎨
                        </div>

                        <p className="mt-2 text-xs font-bold text-gray-900">
                          UI/UX asoslari
                        </p>

                        <p className="mt-1 text-[10px] text-gray-400">
                          12 daqiqa • 240 XP
                        </p>
                      </div>

                      <div className="rounded-2xl border border-gray-100 p-3">
                        <div className="flex h-20 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-yellow-50 text-3xl">
                          🇬🇧
                        </div>

                        <p className="mt-2 text-xs font-bold text-gray-900">
                          English Speaking
                        </p>

                        <p className="mt-1 text-[10px] text-gray-400">
                          18 daqiqa • 320 XP
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating XP card */}
                <div className="absolute -bottom-5 -right-3 hidden rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-2xl shadow-gray-900/10 sm:block">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-50">
                      ⭐
                    </div>

                    <div>
                      <p className="text-xs font-black text-gray-900">
                        +120 XP
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Bugungi dars
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            TRUST / STATS
        ====================================================== */}

        <section className="border-y border-gray-100 bg-gray-50/70">
          <div className="container-app px-4 py-8 sm:py-10">
            <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
              {[
                ["100%", "Bepul platforma"],
                ["24/7", "Bilim almashish"],
                ["∞", "Imkoniyatlar"],
                ["1 → 1", "O'zaro o'rganish"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="text-xl font-black tracking-tight text-gray-950 sm:text-2xl">
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            PROBLEM / PHILOSOPHY
        ====================================================== */}

        <section className="container-app px-4 pb-4 pt-20 sm:pt-28 lg:pt-32">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.18em] text-brand">
                Zikra falsafasi
              </span>

              <h2 className="mt-4 max-w-xl text-3xl font-black leading-tight tracking-[-0.03em] text-gray-950 sm:text-4xl lg:text-5xl">
                Bilim faqat sizda qolmasin.
                <span className="text-brand"> Uni ulashing.</span>
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-gray-500 sm:text-base">
                Internetda juda ko'p bilim bor. Ammo ko'pincha kerakli bilimni
                topish, to'g'ri inson bilan bog'lanish yoki amaliyot qilish
                qiyin. Zikra bu jarayonni oddiy qiladi.
              </p>

              <div className="mt-7">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 text-sm font-bold text-brand transition hover:gap-3"
                >
                  Zikra bilan boshlash
                  <span>→</span>
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-gray-100 bg-gray-50 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                  💰
                </div>

                <h3 className="mt-5 text-base font-extrabold">
                  Bilim pul emas
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Bilim almashish uchun qimmat kurs sotib olish shart emas.
                </p>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-gray-50 p-6 sm:translate-y-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                  🤝
                </div>

                <h3 className="mt-5 text-base font-extrabold">
                  Insonlar orqali
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Real insonlardan real tajriba va amaliy bilim oling.
                </p>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-gray-50 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                  🚀
                </div>

                <h3 className="mt-5 text-base font-extrabold">
                  Doimiy rivojlanish
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Har kuni kichik qadamlar bilan yangi darajaga chiqing.
                </p>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-gray-50 p-6 sm:translate-y-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                  🌍
                </div>

                <h3 className="mt-5 text-base font-extrabold">
                  Hamjamiyat
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  O'rganishni yolg'iz emas, hamjamiyat bilan amalga oshiring.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            HOW IT WORKS
        ====================================================== */}

        <section className="container-app px-4 pt-24 sm:pt-32">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand">
              Juda oddiy
            </span>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-gray-950 sm:text-4xl">
              Qanday ishlaydi?
            </h2>

            <p className="mt-4 text-sm leading-6 text-gray-500 sm:text-base">
              Bilim almashishni boshlash uchun sizga atigi uchta qadam kerak.
            </p>
          </div>

          <div className="relative mt-12 grid gap-5 sm:grid-cols-3">
            {/* Connecting line */}
            <div className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-gray-200 sm:block" />

            {steps.map((step) => (
              <div
                key={step.number}
                className="relative rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-900/5 sm:p-8"
              >
                <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-950 text-xs font-black text-white">
                  {step.number}
                </div>

                <h3 className="mt-6 text-lg font-extrabold text-gray-950">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================
            FEATURES
        ====================================================== */}

        <section className="container-app px-4 pt-24 sm:pt-32">
          <div className="grid items-end gap-6 md:grid-cols-2">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.18em] text-brand">
                Platforma
              </span>

              <h2 className="mt-3 max-w-xl text-3xl font-black tracking-[-0.03em] text-gray-950 sm:text-4xl">
                O'rganish uchun kerak bo'lgan hamma narsa.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-gray-500 md:ml-auto">
              Zikra sizga bilim topishdan tortib, uni ulashish va natijangizni
              kuzatishgacha bo'lgan butun jarayonni bitta joyga jamlaydi.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`group rounded-3xl border border-gray-100 p-6 transition duration-300 hover:-translate-y-1 hover:border-brand/20 hover:shadow-xl hover:shadow-brand/5 sm:p-8 ${
                  index === 0
                    ? "bg-brand-50/60"
                    : index === 3
                      ? "bg-orange-50/40"
                      : "bg-gray-50/60"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm transition group-hover:scale-105">
                  {feature.icon}
                </div>

                <h3 className="mt-6 text-lg font-extrabold text-gray-950">
                  {feature.title}
                </h3>

                <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
                  {feature.description}
                </p>

                <div className="mt-6 text-xs font-bold text-brand opacity-0 transition group-hover:opacity-100">
                  Batafsil →
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================
            PWA
        ====================================================== */}

        <section className="container-app px-4 pt-24 sm:pt-32">
          <div className="relative overflow-hidden rounded-[2rem] bg-gray-950 px-6 py-10 text-white sm:px-10 sm:py-14 lg:px-14">
            <div className="absolute right-[-100px] top-[-100px] h-[300px] w-[300px] rounded-full bg-brand/30 blur-[100px]" />

            <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">
                  📱 PWA
                  <span className="h-1 w-1 rounded-full bg-white/30" />
                  O'rnatish bepul
                </div>

                <h2 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">
                  Zikrani telefoningizga o'rnating.
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/60 sm:text-base">
                  Play Market qidirish shart emas. Zikra'ni bir necha soniyada
                  telefoningiz bosh ekraniga qo'shing va istalgan vaqtda
                  foydalaning.
                </p>

                <div className="mt-6">
                  <InstallPWAButton variant="primary" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 lg:w-[340px]">
                {[
                  ["⚡", "Tez"],
                  ["💾", "Yengil"],
                  ["📲", "Qulay"],
                ].map(([icon, title]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur"
                  >
                    <div className="text-xl">{icon}</div>
                    <p className="mt-2 text-xs font-bold text-white/80">
                      {title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            FINAL CTA
        ====================================================== */}

        <section className="container-app px-4 pb-20 pt-24 sm:pb-28 sm:pt-32">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand via-brand-600 to-brand-800 px-6 py-16 text-center shadow-2xl shadow-brand/20 sm:px-10 sm:py-20">
            <div className="absolute left-1/2 top-0 h-[250px] w-[500px] -translate-x-1/2 rounded-full bg-white/10 blur-[100px]" />

            <div className="relative">
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">
                Bugun boshlang 🚀
              </span>

              <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
                Siz bilgan narsa — boshqa birov uchun imkoniyat.
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
                Zikra'ga qo'shiling. Birinchi ko'nikmangizni ulashing va
                o'zingiz o'rganmoqchi bo'lgan narsani toping.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-7 py-3.5 text-sm font-black text-brand-700 shadow-xl transition hover:-translate-y-0.5 hover:bg-gray-50 sm:w-auto"
                >
                  Bepul ro'yxatdan o'tish
                </Link>

                <InstallPWAButton variant="outline" />
              </div>

              <p className="mt-5 text-xs text-white/50">
                Allaqachon a'zomisiz?{" "}
                <Link
                  href="/login"
                  className="font-bold text-white/80 hover:text-white"
                >
                  Hisobingizga kiring
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="container-app px-4 py-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-lg font-black tracking-tight"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-sm text-white">
                  Z
                </span>

                Zikra
              </Link>

              <p className="mt-2 max-w-xs text-xs leading-5 text-gray-400">
                Bilimni ulashing. O'rganing. Rivojlaning.
              </p>
            </div>

            <div className="flex items-center gap-5 text-sm text-gray-400">
              <Link
                href="/login"
                className="transition hover:text-gray-900"
              >
                Kirish
              </Link>

              <Link
                href="/register"
                className="font-semibold text-gray-700 transition hover:text-brand"
              >
                Ro'yxatdan o'tish
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Zikra. Barcha huquqlar himoyalangan.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
