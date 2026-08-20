import type { Metadata } from "next";
import Link from "next/link";

import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  ChevronRight,
  Flame,
  GraduationCap,
  Layers3,
  MessageCircle,
  Play,
  Rocket,
  Sparkles,
  Star,
  Trophy,
  Users,
  Video,
  Zap,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import InstallPWAButton from "@/components/InstallPWAButton";

export const metadata: Metadata = {
  title: "Zikra — Learn. Teach. Be remembered.",
  description:
    "Zikra — o'zbekistondagi yangi avlod P2P bilim va ko'nikma almashish platformasi. O'rganing, o'rgating va rivojlaning.",
};

const steps = [
  {
    number: "01",
    icon: Users,
    title: "Profilingizni yarating",
    description:
      "Bilgan ko'nikmalaringizni va o'rganmoqchi bo'lgan yo'nalishlaringizni belgilang.",
  },
  {
    number: "02",
    icon: MessageCircle,
    title: "Insonlar bilan bog'laning",
    description:
      "Sizga mos insonlarni toping, tajriba almashing va real muloqot orqali o'rganing.",
  },
  {
    number: "03",
    icon: Trophy,
    title: "O'rgating va rivojlaning",
    description:
      "Darslar yarating, XP yig'ing, streak saqlang va yangi darajalarga ko'tariling.",
  },
];

const features = [
  {
    icon: Video,
    number: "01",
    title: "Video darslar",
    description:
      "Bilimingizni qisqa yoki to'liq video darslar orqali boshqalarga ulashing.",
    className: "md:col-span-2",
  },
  {
    icon: Play,
    number: "02",
    title: "Reels",
    description:
      "Qisqa, foydali va tushunarli bilim kontentlarini tomosha qiling.",
    className: "",
  },
  {
    icon: MessageCircle,
    number: "03",
    title: "Chat",
    description:
      "O'rgatuvchilar va o'rganuvchilar bilan bevosita muloqot qiling.",
    className: "",
  },
  {
    icon: Award,
    number: "04",
    title: "Sertifikatlar",
    description:
      "O'rgangan ko'nikmalaringizni tasdiqlovchi sertifikatlarga ega bo'ling.",
    className: "",
  },
  {
    icon: Flame,
    number: "05",
    title: "Streak & XP",
    description:
      "Har kungi faolligingizni streak, XP, level va badge'lar orqali kuzating.",
    className: "md:col-span-2",
  },
];

const stats = [
  {
    value: "10K+",
    label: "O'rganuvchilar",
    icon: Users,
  },
  {
    value: "2.5K+",
    label: "Video darslar",
    icon: Video,
  },
  {
    value: "500+",
    label: "O'rgatuvchilar",
    icon: GraduationCap,
  },
  {
    value: "50K+",
    label: "Bilim almashish",
    icon: Sparkles,
  },
];

const benefits = [
  "Bepul bilim almashish",
  "Real insonlardan amaliy tajriba",
  "Video va qisqa kontentlar",
  "XP, streak va badge tizimi",
  "PWA orqali tezkor foydalanish",
  "Sertifikat va rivojlanish imkoniyati",
];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-950">
      <Navbar />

      <main>
        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="relative overflow-hidden">
          {/* Background */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-[-300px] h-[650px] w-[900px] -translate-x-1/2 rounded-full bg-brand/10 blur-[140px]" />
            <div className="absolute left-[-200px] top-[350px] h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px]" />
            <div className="absolute right-[-150px] top-[180px] h-[400px] w-[400px] rounded-full bg-blue-100/70 blur-[120px]" />
          </div>

          <div className="container-app px-4 pb-20 pt-10 sm:pb-28 sm:pt-16 lg:pb-36 lg:pt-24">
            <div className="grid items-center gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
              {/* Hero content */}
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-brand-50/80 px-3 py-1.5 text-xs font-bold text-brand-700 shadow-sm backdrop-blur">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[9px] font-black text-white">
                    Z
                  </span>

                  O'zbekistonda yangi avlod bilim platformasi

                  <ChevronRight className="h-3.5 w-3.5" />
                </div>

                <h1 className="mt-7 max-w-4xl text-[3.3rem] font-black leading-[0.98] tracking-[-0.055em] text-gray-950 sm:text-6xl lg:text-[5.2rem]">
                  Learn.
                  <br />
                  <span className="bg-gradient-to-r from-brand via-brand-600 to-accent bg-clip-text text-transparent">
                    Teach.
                  </span>
                  <br />
                  Be remembered.
                </h1>

                <p className="mt-7 max-w-xl text-base leading-7 text-gray-500 sm:text-lg sm:leading-8">
                  O'zingiz bilgan ko'nikmani boshqalarga o'rgating va o'zingiz
                  xohlagan yangi bilimlarni amalda egallang. Zikra — bilim
                  berish va o'rganishni insonlar bilan bog'laydigan P2P
                  platforma.
                </p>

                {/* CTA */}
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/register"
                    className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-950 px-6 py-4 text-sm font-black text-white shadow-xl shadow-gray-950/10 transition duration-300 hover:-translate-y-1 hover:bg-brand hover:shadow-brand/25 sm:text-base"
                  >
                    Boshlash

                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>

                  <InstallPWAButton variant="outline" />
                </div>

                {/* Trust */}
                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-50 text-green-500">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    Bepul boshlash
                  </span>

                  <span className="flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-50 text-green-500">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    PWA
                  </span>

                  <span className="flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-50 text-green-500">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    O'zbek tilida
                  </span>
                </div>
              </div>

              {/* =================================================
                  PRODUCT MOCKUP
              ================================================== */}

              <div className="relative mx-auto w-full max-w-[620px] lg:ml-auto">
                {/* Glow */}
                <div className="absolute -inset-12 -z-10 rounded-full bg-brand/10 blur-3xl" />

                {/* Floating notification */}
                <div className="absolute -left-4 top-12 z-30 hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-2xl shadow-gray-900/10 sm:block">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                      <Sparkles className="h-5 w-5 text-green-500" />
                    </div>

                    <div>
                      <p className="text-xs font-black text-gray-900">
                        Yangi bilim topildi
                      </p>

                      <p className="mt-0.5 text-[10px] text-gray-400">
                        Sizga mos dars
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main application */}
                <div className="rounded-[2rem] border border-gray-200 bg-white p-3 shadow-2xl shadow-gray-900/10 sm:p-5">
                  {/* App header */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-black text-white shadow-lg shadow-brand/20">
                        Z
                      </div>

                      <div>
                        <p className="text-xs font-black text-gray-950">
                          Zikra
                        </p>

                        <p className="text-[9px] text-gray-400">
                          Learn. Teach. Be remembered.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="hidden h-8 w-24 rounded-xl bg-gray-50 sm:block" />
                      <div className="h-8 w-8 rounded-full bg-gray-100" />
                    </div>
                  </div>

                  {/* App body */}
                  <div className="mt-4 grid gap-4 sm:grid-cols-[0.72fr_1.28fr]">
                    {/* Sidebar */}
                    <div className="hidden rounded-2xl bg-gray-50 p-3 sm:block">
                      <div className="space-y-2">
                        {[
                          "Bosh sahifa",
                          "Darslar",
                          "Reels",
                          "Chat",
                          "Profil",
                        ].map((item, index) => (
                          <div
                            key={item}
                            className={`rounded-xl px-3 py-2.5 text-[10px] font-bold ${
                              index === 0
                                ? "bg-white text-brand shadow-sm"
                                : "text-gray-400"
                            }`}
                          >
                            {item}
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 rounded-2xl bg-gray-950 p-3 text-white">
                        <Zap className="h-4 w-4 text-yellow-400" />

                        <p className="mt-2 text-[10px] font-black">
                          Bugungi maqsad
                        </p>

                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full w-[72%] rounded-full bg-brand" />
                        </div>

                        <p className="mt-1.5 text-[8px] text-white/40">
                          720 / 1000 XP
                        </p>
                      </div>
                    </div>

                    {/* Dashboard */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9px] text-gray-400">
                            Xush kelibsiz
                          </p>

                          <p className="text-sm font-black text-gray-950">
                            Sardor 👋
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1.5">
                          <Flame className="h-3 w-3 fill-orange-500 text-orange-500" />

                          <span className="text-[9px] font-black text-orange-600">
                            7 kun
                          </span>
                        </div>
                      </div>

                      {/* Profile card */}
                      <div className="mt-4 rounded-2xl bg-gradient-to-br from-brand-50 via-white to-purple-50 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-brand to-accent text-sm font-black text-white">
                              S
                            </div>

                            <div>
                              <p className="text-xs font-black">
                                Sardor Karimov
                              </p>

                              <p className="text-[9px] text-gray-400">
                                UI/UX Designer
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />

                            <span className="text-[9px] font-black">4.9</span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-white px-2.5 py-1 text-[8px] font-bold text-brand shadow-sm">
                            UI/UX
                          </span>

                          <span className="rounded-full bg-white px-2.5 py-1 text-[8px] font-bold text-blue-600 shadow-sm">
                            Figma
                          </span>

                          <span className="rounded-full bg-white px-2.5 py-1 text-[8px] font-bold text-purple-600 shadow-sm">
                            Product
                          </span>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-gray-600">
                              Level 7 • Expert
                            </span>

                            <span className="text-[8px] text-gray-400">
                              1,420 / 2,000 XP
                            </span>
                          </div>

                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
                            <div className="h-full w-[71%] rounded-full bg-gradient-to-r from-brand to-accent" />
                          </div>
                        </div>
                      </div>

                      {/* Recommended */}
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[10px] font-black">
                            Sizga tavsiya
                          </p>

                          <span className="text-[8px] font-bold text-brand">
                            Barchasi →
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-xl border border-gray-100 p-2">
                            <div className="flex h-16 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-blue-50">
                              <Layers3 className="h-6 w-6 text-purple-500" />
                            </div>

                            <p className="mt-2 text-[9px] font-black">
                              UI/UX asoslari
                            </p>

                            <p className="mt-0.5 text-[7px] text-gray-400">
                              12 min • 240 XP
                            </p>
                          </div>

                          <div className="rounded-xl border border-gray-100 p-2">
                            <div className="flex h-16 items-center justify-center rounded-lg bg-gradient-to-br from-orange-100 to-yellow-50">
                              <BookOpen className="h-6 w-6 text-orange-500" />
                            </div>

                            <p className="mt-2 text-[9px] font-black">
                              English Speaking
                            </p>

                            <p className="mt-0.5 text-[7px] text-gray-400">
                              18 min • 320 XP
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* XP floating card */}
                <div className="absolute -bottom-5 -right-3 z-30 hidden rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-2xl shadow-gray-900/10 sm:block">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-50">
                      <Zap className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    </div>

                    <div>
                      <p className="text-xs font-black">+120 XP</p>

                      <p className="text-[9px] text-gray-400">
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
            STATS
        ====================================================== */}

        <section className="border-y border-gray-100 bg-gray-50/70">
          <div className="container-app px-4 py-9 sm:py-12">
            <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-4 sm:gap-0">
              {stats.map((stat, index) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className={`flex flex-col items-center justify-center text-center ${
                      index !== 0
                        ? "border-gray-200 sm:border-l"
                        : ""
                    }`}
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                      <Icon className="h-4 w-4 text-brand" />
                    </div>

                    <p className="text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">
                      {stat.value}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================
            P2P PHILOSOPHY
        ====================================================== */}

        <section
          id="imkoniyatlar"
          className="container-app px-4 pb-6 pt-24 sm:pt-32 lg:pt-40"
        >
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-brand">
                <Sparkles className="h-3.5 w-3.5" />
                Zikra falsafasi
              </span>

              <h2 className="mt-5 max-w-xl text-3xl font-black leading-[1.08] tracking-[-0.04em] text-gray-950 sm:text-4xl lg:text-5xl">
                Bilimni iste'mol qilish emas.
                <span className="text-brand"> Uni yaratish.</span>
              </h2>

              <p className="mt-6 max-w-xl text-sm leading-7 text-gray-500 sm:text-base">
                Zikra faqat dars ko'rish platformasi emas. Bu yerda har bir
                inson bir vaqtning o'zida o'rganuvchi ham, o'rgatuvchi ham
                bo'lishi mumkin.
              </p>

              <div className="mt-8 space-y-3">
                {benefits.slice(0, 4).map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-center gap-3 text-sm text-gray-600"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand">
                      <Check className="h-3 w-3" />
                    </span>

                    {benefit}
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 text-sm font-black text-brand"
                >
                  Zikra bilan boshlash

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Philosophy visual */}
            <div className="relative">
              <div className="absolute inset-0 rounded-[3rem] bg-brand/5 blur-3xl" />

              <div className="relative rounded-[2.5rem] border border-gray-100 bg-gray-50 p-5 sm:p-7">
                <div className="rounded-[2rem] bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">
                        Sizning rivojlanishingiz
                      </p>

                      <p className="mt-1 text-xl font-black">
                        Level 7
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/20">
                      <Rocket className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-7">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-600">
                        Expert
                      </span>

                      <span className="text-gray-400">
                        71%
                      </span>
                    </div>

                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full w-[71%] rounded-full bg-gradient-to-r from-brand to-accent" />
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-orange-50 p-4 text-center">
                      <Flame className="mx-auto h-5 w-5 text-orange-500" />

                      <p className="mt-2 text-lg font-black">7</p>

                      <p className="text-[9px] text-gray-400">
                        Streak
                      </p>
                    </div>

                    <div className="rounded-2xl bg-brand-50 p-4 text-center">
                      <Zap className="mx-auto h-5 w-5 text-brand" />

                      <p className="mt-2 text-lg font-black">1.4K</p>

                      <p className="text-[9px] text-gray-400">
                        XP
                      </p>
                    </div>

                    <div className="rounded-2xl bg-yellow-50 p-4 text-center">
                      <Award className="mx-auto h-5 w-5 text-yellow-500" />

                      <p className="mt-2 text-lg font-black">12</p>

                      <p className="text-[9px] text-gray-400">
                        Badges
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                        <Trophy className="h-5 w-5 text-purple-500" />
                      </div>

                      <div>
                        <p className="text-xs font-black">
                          Keyingi maqsad
                        </p>

                        <p className="mt-0.5 text-[10px] text-gray-400">
                          Master darajasiga 580 XP qoldi
                        </p>
                      </div>

                      <ArrowRight className="ml-auto h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            HOW IT WORKS
        ====================================================== */}

        <section
          id="qanday-ishlaydi"
          className="container-app px-4 pt-24 sm:pt-32 lg:pt-40"
        >
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand">
              Juda oddiy
            </span>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
              Uch qadam.
              <span className="text-brand"> Cheksiz imkoniyat.</span>
            </h2>

            <p className="mt-5 text-sm leading-7 text-gray-500 sm:text-base">
              Zikra'da bilim almashishni boshlash uchun murakkab jarayonlar
              kerak emas.
            </p>
          </div>

          <div className="relative mt-12 grid gap-5 sm:grid-cols-3 lg:mt-16">
            <div className="absolute left-[16%] right-[16%] top-14 hidden h-px bg-gradient-to-r from-gray-200 via-brand/30 to-gray-200 sm:block" />

            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="group relative rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-gray-900/5 sm:p-8"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-950 text-white transition duration-300 group-hover:bg-brand">
                      <Icon className="h-5 w-5" />
                    </div>

                    <span className="text-4xl font-black tracking-tighter text-gray-100">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-7 text-lg font-black">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-gray-500">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            FEATURE MATRIX
        ====================================================== */}

        <section
          id="darslar"
          className="container-app px-4 pt-24 sm:pt-32 lg:pt-40"
        >
          <div className="grid items-end gap-6 md:grid-cols-2">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.18em] text-brand">
                Platforma
              </span>

              <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                O'rganish uchun kerak bo'lgan hamma narsa.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-7 text-gray-500 md:ml-auto">
              Video, Reels, chat, gamifikatsiya va sertifikatlar — barchasi
              bitta platformada.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.number}
                  className={`group relative overflow-hidden rounded-[2rem] border border-gray-100 bg-gray-50/70 p-6 transition duration-300 hover:-translate-y-1 hover:border-brand/20 hover:bg-white hover:shadow-2xl hover:shadow-brand/5 sm:p-8 ${feature.className}`}
                >
                  <div className="absolute right-[-50px] top-[-50px] h-32 w-32 rounded-full bg-brand/5 blur-2xl transition duration-500 group-hover:bg-brand/10" />

                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition duration-300 group-hover:scale-105">
                        <Icon className="h-5 w-5 text-brand" />
                      </div>

                      <span className="text-xs font-black text-gray-300">
                        {feature.number}
                      </span>
                    </div>

                    <h3 className="mt-7 text-lg font-black">
                      {feature.title}
                    </h3>

                    <p className="mt-3 max-w-lg text-sm leading-6 text-gray-500">
                      {feature.description}
                    </p>

                    <div className="mt-6 flex items-center gap-1 text-xs font-black text-brand opacity-0 transition duration-300 group-hover:opacity-100">
                      Batafsil
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            PWA
        ====================================================== */}

        <section className="container-app px-4 pt-24 sm:pt-32 lg:pt-40">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gray-950 px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-14">
            <div className="absolute right-[-120px] top-[-120px] h-[400px] w-[400px] rounded-full bg-brand/30 blur-[120px]" />
            <div className="absolute bottom-[-150px] left-[30%] h-[300px] w-[300px] rounded-full bg-accent/20 blur-[120px]" />

            <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_0.8fr]">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">
                  <Zap className="h-3.5 w-3.5 text-yellow-400" />
                  Progressive Web App
                </div>

                <h2 className="mt-6 text-3xl font-black leading-tight tracking-[-0.03em] sm:text-4xl">
                  Zikra har doim yoningizda.
                </h2>

                <p className="mt-4 text-sm leading-7 text-white/55 sm:text-base">
                  Play Market yoki App Store qidirishingiz shart emas. Zikra'ni
                  brauzeringizdan bir necha soniyada telefoningiz bosh ekraniga
                  o'rnating.
                </p>

                <div className="mt-7">
                  <InstallPWAButton variant="primary" />
                </div>

                <p className="mt-4 text-[11px] leading-5 text-white/35">
                  iPhone/iPad: Safari → Share → Add to Home Screen.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  {
                    icon: Zap,
                    title: "Tezkor",
                    text: "Ilova kabi tez ishlaydi.",
                  },
                  {
                    icon: Layers3,
                    title: "Yengil",
                    text: "Telefon xotirasini tejaydi.",
                  },
                  {
                    icon: Rocket,
                    title: "Oson",
                    text: "Do'konsiz o'rnatiladi.",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                        <Icon className="h-4 w-4 text-white" />
                      </div>

                      <div>
                        <p className="text-xs font-black">
                          {item.title}
                        </p>

                        <p className="mt-0.5 text-[10px] text-white/40">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            SOCIAL PROOF / COMMUNITY
        ====================================================== */}

        <section className="container-app px-4 pt-24 sm:pt-32 lg:pt-40">
          <div className="rounded-[2.5rem] border border-gray-100 bg-gray-50 p-6 sm:p-10 lg:p-14">
            <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.18em] text-brand">
                  Hamjamiyat
                </span>

                <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                  Har kuni kimdir
                  <span className="text-brand"> nimanidir o'rgatmoqda.</span>
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-gray-500">
                  Zikra'da siz faqat kontent tomosha qilmaysiz. Siz boshqa
                  insonlarning rivojlanishiga hissa qo'shasiz va o'zingiz ham
                  yangi bilimlarga ega bo'lasiz.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  ["🎨", "Dizayn"],
                  ["💻", "Dasturlash"],
                  ["🇬🇧", "Tillar"],
                  ["📈", "Biznes"],
                  ["📸", "Kontent"],
                  ["🧠", "Shaxsiy rivoj"],
                ].map(([icon, title]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-gray-100 bg-white p-4 text-center transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="text-xl">{icon}</div>

                    <p className="mt-2 text-xs font-bold text-gray-600">
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

        <section className="container-app px-4 pb-20 pt-24 sm:pb-28 sm:pt-32 lg:pb-36">
          <div className="relative overflow-hidden rounded-[2.8rem] bg-gradient-to-br from-brand via-brand-600 to-brand-800 px-6 py-16 text-center shadow-2xl shadow-brand/20 sm:px-10 sm:py-20 lg:py-24">
            <div className="absolute left-1/2 top-[-100px] h-[350px] w-[700px] -translate-x-1/2 rounded-full bg-white/10 blur-[120px]" />

            <div className="absolute bottom-[-150px] left-[-100px] h-[300px] w-[300px] rounded-full bg-black/10 blur-[100px]" />

            <div className="relative">
              <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">
                <Sparkles className="h-3.5 w-3.5" />
                Bugun boshlang
              </div>

              <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                Siz bilgan narsa —
                <br className="hidden sm:block" />
                boshqa birov uchun imkoniyat.
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
                O'zingiz bilgan ko'nikmani ulashing. Yangi bilimlarni o'rganing.
                Zikra hamjamiyatining bir qismiga aylaning.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-black text-brand-700 shadow-xl transition duration-300 hover:-translate-y-1 hover:bg-gray-50 sm:w-auto"
                >
                  Bepul boshlash

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <InstallPWAButton variant="outline" />
              </div>

              <p className="mt-6 text-xs text-white/50">
                Allaqachon a'zomisiz?{" "}
                <Link
                  href="/login"
                  className="font-bold text-white/80 transition hover:text-white"
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
        <div className="container-app px-4 py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-lg font-black tracking-tight"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-black text-white">
                  Z
                </span>

                Zikra
              </Link>

              <p className="mt-4 max-w-sm text-sm leading-6 text-gray-400">
                Learn. Teach. Be remembered. Bilimni ulashing, o'rganing va
                rivojlaning.
              </p>
            </div>

            {/* Platform */}
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-900">
                Platforma
              </p>

              <div className="mt-4 space-y-3 text-sm text-gray-400">
                <Link
                  href="#darslar"
                  className="block transition hover:text-brand"
                >
                  Darslar
                </Link>

                <Link
                  href="#darslar"
                  className="block transition hover:text-brand"
                >
                  Reels
                </Link>

                <Link
                  href="#imkoniyatlar"
                  className="block transition hover:text-brand"
                >
                  Imkoniyatlar
                </Link>

                <Link
                  href="#qanday-ishlaydi"
                  className="block transition hover:text-brand"
                >
                  Qanday ishlaydi?
                </Link>
              </div>
            </div>

            {/* Account */}
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-900">
                Hisob
              </p>

              <div className="mt-4 space-y-3 text-sm text-gray-400">
                <Link
                  href="/login"
                  className="block transition hover:text-brand"
                >
                  Kirish
                </Link>

                <Link
                  href="/register"
                  className="block font-semibold text-gray-700 transition hover:text-brand"
                >
                  Ro'yxatdan o'tish
                </Link>

                <Link
                  href="/"
                  className="block transition hover:text-brand"
                >
                  PWA ilova
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Zikra. Barcha huquqlar himoyalangan.
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="transition hover:text-gray-900">
                Telegram
              </span>

              <span className="transition hover:text-gray-900">
                Instagram
              </span>

              <span className="transition hover:text-gray-900">
                YouTube
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
