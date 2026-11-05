import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Award, BookOpen, Check, ChevronRight,
  CirclePlay, Flame, GraduationCap, Layers3, MessageCircle, Play,
  Sparkles, Star, Trophy, Users, Video, Zap, Globe2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import InstallPWAButton from "@/components/InstallPWAButton";

export const metadata: Metadata = {
  title: "Zikra — Learn. Teach. Be remembered.",
  description: "Bilimingizni ulashing, yangi ko'nikmalarni o'rganing va Zikra hamjamiyatida rivojlaning.",
};

const steps = [
  { n: "01", icon: Users, title: "O'zingizni tanishtiring", body: "Nimalarni bilishingiz va qaysi ko'nikmalarni o'rganmoqchi ekaningizni profilingizda belgilang." },
  { n: "02", icon: MessageCircle, title: "O'z odamingizni toping", body: "Qiziqishlaringizga mos insonlar bilan tanishing va bilim almashishni boshlang." },
  { n: "03", icon: Trophy, title: "Birga rivojlaning", body: "Darslar, muloqot va kundalik maqsadlar orqali o'sishingizni davom ettiring." },
];
const features = [
  { icon: Video, title: "Video darslar", body: "Tajribangizni video orqali ulashing yoki yangi mavzularni o'zlashtiring.", tag: "O'rganing" },
  { icon: CirclePlay, title: "Qisqa bilimlar", body: "Tez ko'riladigan, foydali kontent bilan har kuni yangi g'oya toping.", tag: "Kashf eting" },
  { icon: MessageCircle, title: "Jonli muloqot", body: "Savol bering, fikr almashing va o'rgatuvchilar bilan bog'laning.", tag: "Bog'laning" },
  { icon: Flame, title: "XP va streak", body: "Faolligingizni kuzating, maqsadlar qo'ying va izchil davom eting.", tag: "Rivojlaning" },
  { icon: Award, title: "Yutuqlar", body: "O'rganish yo'lidagi natijalaringiz va erishgan marralaringizni ko'ring.", tag: "E'tirof eting" },
  { icon: Globe2, title: "Hamjamiyat", body: "Turli soha va tajribaga ega insonlardan ilhom oling.", tag: "Ulashining" },
];

export default function HomePage() {
  return (
    <div className="zikra-site min-h-screen overflow-hidden bg-[#fbfcfa] text-[#142522] transition-colors duration-300 dark:bg-[#071512] dark:text-[#eaf4f0]">
      <Navbar />
      <main>
        <section className="relative isolate overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -right-40 -top-44 h-[38rem] w-[38rem] rounded-full bg-emerald-300/20 blur-[110px] dark:bg-emerald-400/10" />
            <div className="absolute -left-48 top-64 h-[30rem] w-[30rem] rounded-full bg-amber-200/30 blur-[100px] dark:bg-amber-400/5" />
            <div className="absolute inset-0 opacity-[.22] [background-image:radial-gradient(#68877d_0.7px,transparent_0.7px)] [background-size:24px_24px] dark:opacity-[.12]" />
          </div>
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[.9fr_1.1fr] lg:gap-10 lg:px-10 lg:pb-32 lg:pt-24">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-800/10 bg-white/75 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-sm backdrop-blur dark:border-emerald-200/10 dark:bg-white/[.06] dark:text-emerald-200">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-black text-white">Z</span>
                Bilim almashishning yangi usuli
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
              <h1 className="mt-8 text-[3.65rem] font-semibold leading-[.98] tracking-[-.075em] sm:text-7xl lg:text-[5.8rem]">
                Bilimingizni
                <span className="block bg-gradient-to-r from-emerald-700 via-teal-600 to-amber-600 bg-clip-text pb-2 text-transparent dark:from-emerald-300 dark:via-teal-300 dark:to-amber-300">ulashing.</span>
                <span className="block">Birga o'sing.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-[#60736e] dark:text-[#a0b5ae] sm:text-lg">
                Siz bilgan narsa — kimdir uchun yangi imkoniyat. Zikra orqali o'rgating, o'rganing va bilimni insonlar o'rtasida harakatga keltiring.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-[#123b32] px-7 py-4 text-sm font-bold text-white shadow-[0_18px_45px_-20px_rgba(10,90,69,.65)] transition duration-300 hover:-translate-y-1 hover:bg-emerald-700 dark:bg-emerald-300 dark:text-[#09221b] dark:hover:bg-emerald-200">
                  Zikraga qo'shiling <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#qanday-ishlaydi" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dce7e1] bg-white/70 px-6 py-4 text-sm font-bold text-[#29463d] transition hover:border-emerald-700/30 hover:bg-white dark:border-white/10 dark:bg-white/[.04] dark:text-[#d8e9e1] dark:hover:bg-white/[.08]">
                  <Play className="h-4 w-4 fill-current" /> Qanday ishlaydi?
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[#83938d] dark:text-[#80958d]">
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Boshlash oson</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> O'zbek tilida</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> O'zaro bilim</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[650px] lg:ml-auto">
              <div className="absolute -inset-8 rounded-[3rem] bg-emerald-400/15 blur-3xl dark:bg-emerald-400/10" />
              <div className="relative rotate-[1deg] rounded-[2rem] border border-white/80 bg-white/85 p-3 shadow-[0_40px_100px_-45px_rgba(16,60,48,.38)] backdrop-blur-xl dark:border-white/10 dark:bg-[#10251f]/90 sm:rounded-[2.4rem] sm:p-5">
                <div className="flex items-center justify-between border-b border-[#eaf0ec] px-2 pb-4 dark:border-white/10">
                  <div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-sm font-black text-white">Z</span><div><p className="text-sm font-extrabold">Zikra</p><p className="text-[10px] text-[#8b9a94]">Learning community</p></div></div>
                  <div className="flex items-center gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">● Onlayn</span><div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-200 to-orange-400" /></div>
                </div>
                <div className="grid gap-3 py-4 sm:grid-cols-[.72fr_1.28fr]">
                  <div className="hidden rounded-2xl bg-[#f4f7f4] p-3 dark:bg-white/[.04] sm:block">
                    <p className="px-2 pb-3 pt-1 text-[9px] font-bold uppercase tracking-[.16em] text-[#94a49c]">Menyu</p>
                    {["Bosh sahifa","Kashf etish","Darslar","Suhbatlar"].map((x,i)=><div key={x} className={`mb-1 rounded-xl px-3 py-2.5 text-[11px] font-semibold ${i===0?"bg-white text-emerald-800 shadow-sm dark:bg-white/10 dark:text-emerald-200":"text-[#82918a]"}`}>{x}</div>)}
                    <div className="mt-5 rounded-2xl bg-[#143c32] p-3 text-white dark:bg-emerald-300 dark:text-[#0b251d]"><Zap className="h-4 w-4 text-amber-300 dark:text-amber-700" /><p className="mt-3 text-[10px] font-bold">Haftalik maqsad</p><div className="mt-2 h-1.5 rounded-full bg-white/20 dark:bg-black/10"><div className="h-full w-[72%] rounded-full bg-amber-300 dark:bg-emerald-700" /></div><p className="mt-2 text-[9px] text-white/60 dark:text-[#31564a]">720 / 1000 XP</p></div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between"><div><p className="text-[10px] text-[#91a099]">Xush kelibsiz,</p><p className="text-base font-extrabold">Sardor 👋</p></div><span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-bold text-orange-600 dark:bg-orange-400/10 dark:text-orange-300"><Flame className="h-3.5 w-3.5" /> 7 kun</span></div>
                    <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#e9f5ed] via-[#f7faf5] to-[#f8f0df] p-4 dark:from-emerald-900/40 dark:via-[#17352b] dark:to-amber-900/20">
                      <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-400 text-lg font-black text-white">S</div><div className="min-w-0"><p className="truncate text-xs font-extrabold">Sardor Karimov</p><p className="mt-1 text-[10px] text-[#7c9186] dark:text-[#a4b9ad]">UI/UX Designer · Mentor</p></div><div className="ml-auto flex items-center gap-1 text-[10px] font-bold"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4.9</div></div>
                      <div className="mt-4 flex flex-wrap gap-1.5"><span className="rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-bold text-emerald-800 dark:bg-white/10 dark:text-emerald-200">UI/UX</span><span className="rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-bold text-blue-700 dark:bg-white/10 dark:text-blue-200">Figma</span><span className="rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-bold text-amber-700 dark:bg-white/10 dark:text-amber-200">Product</span></div>
                      <div className="mt-4 flex items-center justify-between text-[9px] font-bold"><span>Level 7 · Expert</span><span className="text-[#87988e]">1,420 / 2,000 XP</span></div><div className="mt-2 h-1.5 rounded-full bg-white/70 dark:bg-black/20"><div className="h-full w-[71%] rounded-full bg-gradient-to-r from-emerald-600 to-teal-400" /></div>
                    </div>
                    <div className="mt-4 flex items-center justify-between"><p className="text-[11px] font-extrabold">Siz uchun tavsiyalar</p><span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300">Barchasi ↗</span></div>
                    <div className="mt-2 grid grid-cols-2 gap-2"><div className="rounded-xl border border-[#e9efeb] p-2 dark:border-white/10"><div className="flex h-16 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-blue-50 dark:from-violet-500/20 dark:to-blue-500/10"><Layers3 className="h-7 w-7 text-violet-500" /></div><p className="mt-2 text-[10px] font-extrabold">UI/UX asoslari</p><p className="mt-1 text-[8px] text-[#91a099]">12 min · 240 XP</p></div><div className="rounded-xl border border-[#e9efeb] p-2 dark:border-white/10"><div className="flex h-16 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-500/20 dark:to-orange-500/10"><BookOpen className="h-7 w-7 text-amber-600" /></div><p className="mt-2 text-[10px] font-extrabold">English speaking</p><p className="mt-1 text-[8px] text-[#91a099]">18 min · 320 XP</p></div></div>
                  </div>
                </div>
              </div>
              <div className="absolute -left-5 top-16 hidden -rotate-3 items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-xl dark:border-white/10 dark:bg-[#18342b] sm:flex"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200"><Sparkles className="h-4 w-4" /></span><span><b className="block text-[11px]">Yangi bilim topildi</b><small className="text-[9px] text-[#8a9b93]">Sizga mos tavsiya</small></span></div>
              <div className="absolute -bottom-5 -right-3 hidden items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-xl dark:border-white/10 dark:bg-[#18342b] sm:flex"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-300/10 dark:text-amber-200"><Zap className="h-4 w-4" /></span><span><b className="block text-[11px]">+120 XP</b><small className="text-[9px] text-[#8a9b93]">Maqsad sari qadam</small></span></div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#e8efea] bg-white/70 py-8 dark:border-white/[.07] dark:bg-white/[.025]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-5 px-5 text-center sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#91a099]">Bilim almashishning yangi muhiti</p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-semibold text-[#536a60] dark:text-[#a8bdb3]"><span className="flex items-center gap-2"><Users className="h-4 w-4 text-emerald-600" /> O'rganuvchilar</span><span className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-emerald-600" /> O'rgatuvchilar</span><span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500" /> Yangi imkoniyatlar</span></div>
          </div>
        </section>

        <section id="qanday-ishlaydi" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:gap-20">
            <div className="max-w-md"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-emerald-700 dark:text-emerald-300">Oddiy. Insoniy. Samarali.</p><h2 className="mt-5 text-4xl font-semibold tracking-[-.06em] sm:text-5xl">Bilim almashish uchun uch qadam.</h2><p className="mt-5 text-sm leading-7 text-[#73847c] dark:text-[#9aafa5]">Har kim nimanidir biladi. Har kim nimanidir o'rganishi mumkin. Zikra shu ikki ehtiyojni bir joyda uchrashtiradi.</p><Link href="/register" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:gap-3 dark:text-emerald-300">O'z yo'lingizni boshlang <ArrowUpRight className="h-4 w-4" /></Link></div>
            <div className="grid gap-3 sm:grid-cols-3">{steps.map(({n,icon:Icon,title,body})=><article key={n} className="group rounded-[1.7rem] border border-[#e5ede7] bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-700/20 hover:shadow-[0_25px_60px_-42px_rgba(10,80,60,.35)] dark:border-white/10 dark:bg-white/[.035]"><div className="flex items-center justify-between"><span className="text-xs font-black tracking-[.15em] text-[#a1b0a8]">{n}</span><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 transition group-hover:bg-emerald-700 group-hover:text-white dark:bg-emerald-300/10 dark:text-emerald-200"><Icon className="h-5 w-5" /></span></div><h3 className="mt-9 text-lg font-bold tracking-tight">{title}</h3><p className="mt-3 text-sm leading-6 text-[#7c8d84] dark:text-[#9aafa5]">{body}</p></article>)}</div>
          </div>
        </section>

        <section id="imkoniyatlar" className="bg-[#f1f6f2] py-24 dark:bg-[#0b201a] sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-emerald-700 dark:text-emerald-300">Zikra imkoniyatlari</p><h2 className="mt-5 text-4xl font-semibold tracking-[-.06em] sm:text-5xl">O'rganishning har bir bosqichi — bir joyda.</h2><p className="mt-5 text-sm leading-7 text-[#74867c] dark:text-[#9aafa5]">Bilimni topish, ulashish va kundalik odatga aylantirish uchun kerakli vositalar.</p></div>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{features.map(({icon:Icon,title,body,tag},i)=><article key={title} className="group relative overflow-hidden rounded-[1.7rem] border border-[#e1eae3] bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_60px_-42px_rgba(10,80,60,.3)] dark:border-white/10 dark:bg-[#10271f]"><div className="flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf6ef] text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-200"><Icon className="h-5 w-5" /></span><span className="text-[10px] font-bold uppercase tracking-[.15em] text-[#a0afa7]">{tag}</span></div><h3 className="mt-8 text-xl font-bold tracking-tight">{title}</h3><p className="mt-3 max-w-xs text-sm leading-6 text-[#7b8c83] dark:text-[#9aafa5]">{body}</p><div className="pointer-events-none absolute -bottom-12 -right-10 h-32 w-32 rounded-full bg-emerald-100/70 blur-3xl transition group-hover:bg-emerald-200 dark:bg-emerald-400/5" /></article>)}</div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-32">
          <div className="relative"><div className="absolute -inset-8 rounded-full bg-amber-200/20 blur-3xl dark:bg-amber-300/5" /><div className="relative rounded-[2rem] bg-[#123b32] p-8 text-white shadow-[0_35px_80px_-40px_rgba(10,60,45,.65)] sm:p-10 dark:bg-[#153b2e]"><div className="flex items-center justify-between"><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-emerald-100">Shaxsiy rivojlanish</span><Flame className="h-5 w-5 text-amber-300" /></div><p className="mt-12 text-5xl font-semibold tracking-[-.06em]">Har kuni.</p><p className="mt-2 text-5xl font-semibold tracking-[-.06em] text-emerald-300">Bir qadam.</p><p className="mt-5 max-w-sm text-sm leading-7 text-white/65">Kichik, izchil harakatlar katta natijalarga olib keladi. O'z o'sishingizni kuzating va o'zingizga yangi marralar belgilang.</p><div className="mt-10 flex items-end gap-2">{[30,48,38,68,52,82,100].map((h,i)=><div key={i} className="flex-1 rounded-t-lg bg-emerald-300/20" style={{height:`${h}px`}}><div className="h-full rounded-t-lg bg-gradient-to-t from-emerald-500/50 to-emerald-200/80" /></div>)}</div><div className="mt-3 flex justify-between text-[9px] font-bold uppercase tracking-wider text-white/35"><span>Dush</span><span>Sesh</span><span>Chor</span><span>Pay</span><span>Jum</span><span>Shan</span><span>Yak</span></div></div></div>
          <div className="max-w-xl"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-emerald-700 dark:text-emerald-300">O'sish — bu yo'l</p><h2 className="mt-5 text-4xl font-semibold tracking-[-.06em] sm:text-5xl">Faqat bilim emas. Odat ham yarating.</h2><p className="mt-6 text-sm leading-7 text-[#74867c] dark:text-[#9aafa5]">Zikra sizga o'rganishni kundalik hayotingizning tabiiy qismiga aylantirishga yordam beradigan tajribani taklif qiladi. Maqsad qo'ying, faolligingizni kuzating va oldinga intiling.</p><ul className="mt-8 space-y-4">{["O'z maqsadlaringizni belgilang","Faollik va rivojlanishni kuzating","Yutuqlaringizni qadrlang"].map(x=><li key={x} className="flex items-center gap-3 text-sm font-semibold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-200"><Check className="h-3.5 w-3.5" /></span>{x}</li>)}</ul></div>
        </section>

        <section className="px-5 pb-24 sm:px-8 lg:px-10 lg:pb-32"><div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-[#17483a] via-[#0e382e] to-[#102c28] px-7 py-16 text-center text-white shadow-[0_35px_90px_-45px_rgba(10,70,50,.65)] sm:px-12 sm:py-24"><div className="pointer-events-none absolute -right-20 -top-40 h-96 w-96 rounded-full bg-emerald-300/15 blur-[90px]" /><div className="relative mx-auto max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-100"><Sparkles className="h-3.5 w-3.5" /> Sizning navbatingiz</span><h2 className="mt-7 text-4xl font-semibold leading-[1.05] tracking-[-.06em] sm:text-6xl">Siz bilgan narsa — kimdir uchun yangi boshlanish.</h2><p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/65 sm:text-base">Bugun bir ko'nikma ulashing. Ertaga yangi bilim bilan qayting. Zikra hamjamiyatiga qo'shiling.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-extrabold text-[#17483a] transition hover:-translate-y-1 hover:bg-emerald-50">Bepul boshlash <ArrowRight className="h-4 w-4" /></Link><InstallPWAButton variant="outline" /></div><p className="mt-6 text-xs text-white/45">Hisobingiz bormi? <Link href="/login" className="font-bold text-white/85 hover:text-white">Kirish</Link></p></div></div></section>
      </main>
      <footer className="border-t border-[#e5ede7] bg-white/60 dark:border-white/[.07] dark:bg-white/[.02]"><div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10"><div><Link href="/" className="inline-flex items-center gap-2 text-lg font-black"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-sm text-white">Z</span>Zikra</Link><p className="mt-3 text-xs text-[#87968e] dark:text-[#82978d]">Learn. Teach. Be remembered.</p></div><div className="flex flex-wrap gap-x-7 gap-y-3 text-xs font-semibold text-[#74867c] dark:text-[#9aafa5]"><Link href="#qanday-ishlaydi" className="hover:text-emerald-700">Qanday ishlaydi?</Link><Link href="#imkoniyatlar" className="hover:text-emerald-700">Imkoniyatlar</Link><Link href="/login" className="hover:text-emerald-700">Kirish</Link><Link href="/register" className="hover:text-emerald-700">Ro'yxatdan o'tish</Link></div><p className="text-xs text-[#9aa8a1]">© {new Date().getFullYear()} Zikra. Barcha huquqlar himoyalangan.</p></div></footer>
    </div>
  );
}
