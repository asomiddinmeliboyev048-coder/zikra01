import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Award, BookOpen, Check, ChevronDown, CirclePlay,
  CircleDollarSign, Flame, Handshake,
  MessageCircle, Sparkles, Users, Video, Globe2, Laptop,
  Lightbulb, Repeat2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import InstallPWAButton from "@/components/InstallPWAButton";
import LandingAOS from "@/components/landing/LandingAOS";

export const metadata: Metadata = {
  title: "Zikra — Bilim almashish orqali birga rivojlaning",
  description:
    "Zikra — talabalar, mutaxassislar va o'qituvchilar uchun bepul o'zaro bilim almashish platformasi. Sen menga bir bilim, men senga boshqasini.",
};

const steps = [
  {
    number: "01",
    icon: Lightbulb,
    title: "Nimani bilishingni ulash",
    description:
      "O'zing yaxshi biladigan ko'nikmalarni profilingga qo'sh. Boshqalarga nimani o'rgata olishingni ko'rsat.",
  },
  {
    number: "02",
    icon: Users,
    title: "Senga mos insonni top",
    description:
      "O'rganmoqchi bo'lgan yo'nalishing bo'yicha bilimga ega insonlarni kashf et va ular bilan bog'lan.",
  },
  {
    number: "03",
    icon: Repeat2,
    title: "Bilimlarni o'zaro almash",
    description:
      "Sen unga bir bilim berasan, u esa senga boshqasini o'rgatadi. Ikkalangiz ham yutasiz.",
  },
];

const features = [
  {
    icon: Video,
    title: "Video darslar",
    description: "Bilimingni video dars orqali ulash va boshqalarning tajribasidan o'rgan.",
    tone: "from-emerald-500/15 to-teal-500/5",
  },
  {
    icon: CirclePlay,
    title: "Qisqa bilimlar",
    description: "Reels formatidagi qisqa videolar orqali yangi g'oyalarni kashf et.",
    tone: "from-violet-500/15 to-indigo-500/5",
  },
  {
    icon: MessageCircle,
    title: "Jonli muloqot",
    description: "Savollar ber, fikr almash va bilim almashish bo'yicha kelishib ol.",
    tone: "from-sky-500/15 to-cyan-500/5",
  },
  {
    icon: Flame,
    title: "XP va streak",
    description: "Faolligingni kuzat, o'rganish odatini shakllantir va davomiylikni saqla.",
    tone: "from-orange-500/15 to-amber-500/5",
  },
  {
    icon: Award,
    title: "Yutuqlar",
    description: "O'rganish yo'lida erishgan natijalaring va yutuqlaringni kuzat.",
    tone: "from-amber-500/15 to-yellow-500/5",
  },
  {
    icon: Globe2,
    title: "Hamjamiyat",
    description: "Turli tajriba va qarashlarga ega insonlar bilan bir muhitda rivojlan.",
    tone: "from-pink-500/15 to-rose-500/5",
  },
];

const audiences = [
  {
    title: "Talabalar",
    description: "Darsdan tashqarida amaliy ko'nikmalarni o'rgan va bilimingni boshqalar bilan mustahkamla.",
    image:
      "https://images.unsplash.com/photo-1758270705317-3ef6142d306f?auto=format&fit=crop&w=1100&q=85",
    alt: "Noutbuk atrofida birgalikda bilim olayotgan talabalar",
    label: "O'rganish va tajriba",
  },
  {
    title: "Mutaxassislar",
    description: "Kasbiy tajribangni ulash, boshqa yo'nalishlarni o'rgan va yangi aloqalar o'rnat.",
    image:
      "https://thumbs.wbm.im/pw/medium/8d03b94c091071e47c7070fcde60d883.jpg",
    alt: "Noutbuk orqali tajriba almashayotgan ikki mutaxassis",
    label: "Tajriba va hamkorlik",
  },
  {
    title: "O'qituvchilar",
    description: "Bilimingni kengroq auditoriya bilan bo'lish va boshqalardan ham yangi bilim ol.",
    image:
      "https://images.unsplash.com/photo-1758685848142-06e158cf64bc?auto=format&fit=crop&w=1100&q=85",
    alt: "Noutbuk va kitoblar bilan ishlayotgan o'qituvchi",
    label: "O'rgatish va ulashish",
  },
];

const faqs = [
  {
    question: "Zikra nima?",
    answer:
      "Zikra — insonlar o'z bilim va ko'nikmalarini o'zaro almashishlari uchun yaratilgan platforma. Bu yerda sen o'rgatishing ham, yangi bilimlarni o'rganishing ham mumkin.",
  },
  {
    question: "Bilim almashish qanday ishlaydi?",
    answer:
      "Zikra o'zaro barter tamoyiliga asoslanadi: sen boshqa insonga o'zing bilgan bir bilimni o'rgatasan, u esa senga o'zidagi boshqa bilimni ulashadi. Tafsilotlarni o'zaro kelishib olasiz.",
  },
  {
    question: "Zikra'dan foydalanish bepulmi?",
    answer:
      "Ha. Zikra'ga qo'shilish va platformadan foydalanish to'liq bepul. Bilim almashish uchun platformaga to'lov qilishing shart emas.",
  },
  {
    question: "Kimlar Zikra'dan foydalanishi mumkin?",
    answer:
      "Zikra, avvalo, talabalar, turli soha mutaxassislari va o'qituvchilar uchun. Bilimini ulashishni yoki yangi narsalarni o'rganishni istagan har bir inson qo'shilishi mumkin.",
  },
  {
    question: "Qaysi yo'nalishlarda bilim almashish mumkin?",
    answer:
      "Dasturlash, xorijiy tillar, dizayn, marketing, biznes va boshqa ko'plab yo'nalishlarda bilim almashish mumkin. Muhimi — sen nimani o'rgata olishing va nimani o'rganmoqchi ekaning.",
  },
  {
    question: "Zikra'da sertifikat olish mumkinmi?",
    answer:
      "Sertifikat tizimi hozirda ishlab chiqilmoqda. Tayyor bo'lgach, ushbu imkoniyat haqida platformada alohida ma'lumot beriladi.",
  },
  {
    question: "Zikra hozir faol ishlayaptimi?",
    answer:
      "Ha. Zikra hozir ishlamoqda va platformadan foydalanuvchilar foydalanmoqda. Jamoa platformani muntazam rivojlantirib bormoqda.",
  },
  {
    question: "Qanday qilib ro'yxatdan o'taman?",
    answer:
      "“Bepul qo'shilish” tugmasini bosib, ro'yxatdan o'tish sahifasiga o't. Hisob yaratganingdan so'ng profilingni to'ldirib, bilim almashishni boshlashing mumkin.",
  },
];

export default function HomePage() {
  return (
    <div className="zikra-site min-h-screen overflow-hidden bg-[#fbfcfa] text-[#142522] transition-colors duration-300 dark:bg-[#071512] dark:text-[#eaf4f0]">
      <LandingAOS />
      <Navbar />
      <main>
        {/* HERO */}
        <section className="relative isolate overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -right-40 -top-44 h-[38rem] w-[38rem] rounded-full bg-emerald-300/20 blur-[110px] dark:bg-emerald-400/10" />
            <div className="absolute -left-48 top-64 h-[30rem] w-[30rem] rounded-full bg-amber-200/30 blur-[100px] dark:bg-amber-400/5" />
            <div className="absolute inset-0 opacity-[.18] [background-image:radial-gradient(#68877d_0.7px,transparent_0.7px)] [background-size:24px_24px] dark:opacity-[.1]" />
          </div>
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[.9fr_1.1fr] lg:gap-12 lg:px-10 lg:pb-28 lg:pt-24">
            <div className="relative z-10 max-w-2xl" data-aos="fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-800/10 bg-white/80 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-sm backdrop-blur dark:border-emerald-200/10 dark:bg-white/[.06] dark:text-emerald-200">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-black text-white">Z</span>
                Bilim almashishning yangi usuli
                <span className="ml-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-200">100% bepul</span>
              </div>
              <h1 className="mt-8 text-[3.55rem] font-semibold leading-[.96] tracking-[-.075em] sm:text-7xl lg:text-[5.45rem]">
                Bilimingni
                <span className="block bg-gradient-to-r from-emerald-700 via-teal-600 to-amber-600 bg-clip-text pb-2 text-transparent dark:from-emerald-300 dark:via-teal-300 dark:to-amber-300">ulash.</span>
                <span className="block">Birga rivojlan.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-[#60736e] dark:text-[#a0b5ae] sm:text-lg">
                Sen menga bir bilim, men senga boshqasini. Zikra — bilimni pulga emas, o'zaro manfaatli almashuvga asoslangan hamjamiyat.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-[#123b32] px-7 py-4 text-sm font-bold text-white shadow-[0_18px_45px_-20px_rgba(10,90,69,.65)] transition duration-300 hover:-translate-y-1 hover:bg-emerald-700 dark:bg-emerald-300 dark:text-[#09221b] dark:hover:bg-emerald-200">
                  Bepul qo'shilish <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#qanday-ishlaydi" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dce7e1] bg-white/70 px-6 py-4 text-sm font-bold text-[#29463d] transition hover:border-emerald-700/30 hover:bg-white dark:border-white/10 dark:bg-white/[.04] dark:text-[#d8e9e1] dark:hover:bg-white/[.08]">
                  <BookOpen className="h-4 w-4" /> Qanday ishlaydi?
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[#83938d] dark:text-[#80958d]">
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> To'liq bepul</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> O'zaro barter</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Faol platforma</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[660px]" data-aos="fade-left" data-aos-delay="120">
              <div className="absolute -inset-7 rounded-[3rem] bg-emerald-400/20 blur-3xl dark:bg-emerald-400/10" />
              <div className="relative overflow-hidden rounded-[2.1rem] border border-white/80 bg-white p-2 shadow-[0_40px_100px_-45px_rgba(16,60,48,.45)] dark:border-white/10 dark:bg-[#10251f] sm:rounded-[2.5rem] sm:p-3">
                <div className="relative h-[300px] overflow-hidden rounded-[1.65rem] sm:h-[410px] sm:rounded-[2rem]">
                  <img
                    src="https://images.unsplash.com/photo-1758270705317-3ef6142d306f?auto=format&fit=crop&w=1600&q=90"
                    alt="Birgalikda noutbuk atrofida bilim va tajriba almashayotgan yoshlar"
                    className="absolute inset-0 h-full w-full object-cover"
                    fetchPriority="high"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071d18]/90 via-[#071d18]/15 to-transparent" />
                  <div className="absolute left-5 top-5 rounded-full border border-white/25 bg-black/20 px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-white backdrop-blur-md sm:left-7 sm:top-7">
                    Zikra hamjamiyati
                  </div>
                  <div className="absolute bottom-5 left-5 right-5 text-white sm:bottom-8 sm:left-8 sm:right-8">
                    <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-200">Bilim birlashganda</p>
                    <p className="mt-2 max-w-md text-3xl font-semibold leading-tight tracking-[-.045em] sm:text-4xl">Har kimda ulashishga arziydigan bilim bor.</p>
                  </div>
                </div>
              </div>
              <div className="absolute -left-3 top-20 hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#18342b] sm:flex" data-aos="zoom-in" data-aos-delay="500">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200"><Handshake className="h-5 w-5" /></span>
                <span><b className="block text-xs">O'zaro barter</b><small className="text-[10px] text-[#8a9b93]">Bilim ↔ bilim</small></span>
              </div>
              <div className="absolute -bottom-5 -right-2 hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#18342b] sm:flex" data-aos="zoom-in" data-aos-delay="650">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-300/10 dark:text-amber-200"><CircleDollarSign className="h-5 w-5" /></span>
                <span><b className="block text-xs">0 so'm</b><small className="text-[10px] text-[#8a9b93]">Foydalanish bepul</small></span>
              </div>
            </div>
          </div>
        </section>

        {/* VALUE STRIP */}
        <section className="border-y border-[#e8efea] bg-white/75 py-7 dark:border-white/[.07] dark:bg-white/[.025]">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-5 text-center sm:grid-cols-3 sm:px-8">
            {[
              { icon: Repeat2, title: "O'zaro bilim almashish", note: "Har ikki tomon uchun foyda" },
              { icon: CircleDollarSign, title: "To'liq bepul", note: "Qo'shilish va foydalanish bepul" },
              { icon: Users, title: "Haqiqiy hamjamiyat", note: "Talabalar, mutaxassislar, ustozlar" },
            ].map(({ icon: Icon, title, note }, i) => (
              <div key={title} className="flex items-center justify-center gap-3" data-aos="fade-up" data-aos-delay={i * 100}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-200"><Icon className="h-5 w-5" /></span>
                <span className="text-left"><b className="block text-sm">{title}</b><small className="mt-1 block text-xs text-[#8a9b93]">{note}</small></span>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="qanday-ishlaydi" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:gap-20">
            <div className="max-w-md" data-aos="fade-right">
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-emerald-700 dark:text-emerald-300">Oddiy. O'zaro. Bepul.</p>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-.06em] sm:text-5xl">Bilim almashish uchun uch qadam.</h2>
              <p className="mt-5 text-sm leading-7 text-[#73847c] dark:text-[#9aafa5]">Har kim nimanidir biladi. Har kim nimanidir o'rganishi mumkin. Zikra shu ikki ehtiyojni bir joyda uchrashtiradi.</p>
              <Link href="/register" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-emerald-800 transition hover:gap-3 dark:text-emerald-300">O'z yo'lingni boshlash <ArrowUpRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {steps.map(({ number, icon: Icon, title, description }, i) => (
                <article key={number} className="group rounded-[1.7rem] border border-[#e5ede7] bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-700/20 hover:shadow-[0_25px_60px_-42px_rgba(10,80,60,.35)] dark:border-white/10 dark:bg-white/[.035]" data-aos="fade-up" data-aos-delay={i * 120}>
                  <div className="flex items-center justify-between"><span className="text-xs font-black tracking-[.15em] text-[#a1b0a8]">{number}</span><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 transition group-hover:bg-emerald-700 group-hover:text-white dark:bg-emerald-300/10 dark:text-emerald-200"><Icon className="h-5 w-5" /></span></div>
                  <h3 className="mt-9 text-lg font-bold tracking-tight">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#7c8d84] dark:text-[#9aafa5]">{description}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-12 overflow-hidden rounded-[1.8rem] border border-emerald-900/10 bg-gradient-to-r from-[#eaf5ed] via-white to-[#f8f2e5] p-6 dark:border-white/10 dark:from-[#10271f] dark:via-[#10251f] dark:to-[#29251b] sm:p-8" data-aos="zoom-in-up">
            <div className="grid items-center gap-5 sm:grid-cols-[1fr_auto_1fr]">
              <div><p className="text-xs font-bold uppercase tracking-[.15em] text-emerald-700 dark:text-emerald-300">Sen ulashasan</p><p className="mt-2 text-2xl font-semibold tracking-tight">Ingliz tili</p><p className="mt-1 text-sm text-[#7b8c83] dark:text-[#9aafa5]">O'zing yaxshi bilgan bilim</p></div>
              <div className="flex items-center justify-center"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg shadow-emerald-900/15 dark:bg-emerald-300 dark:text-[#09221b]"><Repeat2 className="h-6 w-6" /></div></div>
              <div className="sm:text-right"><p className="text-xs font-bold uppercase tracking-[.15em] text-amber-700 dark:text-amber-300">Sen o'rganasan</p><p className="mt-2 text-2xl font-semibold tracking-tight">Dasturlash</p><p className="mt-1 text-sm text-[#7b8c83] dark:text-[#9aafa5]">Hamkoring bilgan bilim</p></div>
            </div>
            <p className="mt-6 text-center text-xs font-medium text-[#7b8c83] dark:text-[#9aafa5]">Namunaviy bilim almashish — yo'nalishlarni o'zaro kelishib tanlaysiz.</p>
          </div>
        </section>

        {/* FEATURES */}
        <section id="imkoniyatlar" className="bg-[#f1f6f2] py-24 dark:bg-[#0b201a] sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-2xl text-center" data-aos="fade-up">
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-emerald-700 dark:text-emerald-300">Zikra imkoniyatlari</p>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-.06em] sm:text-5xl">O'rganish va ulashish — bir platformada.</h2>
              <p className="mt-5 text-sm leading-7 text-[#74867c] dark:text-[#9aafa5]">Bilimni topish, ulashish va kundalik odatga aylantirish uchun kerakli vositalar.</p>
            </div>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description, tone }, i) => (
                <article key={title} className="group relative overflow-hidden rounded-[1.7rem] border border-[#e1eae3] bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_60px_-42px_rgba(10,80,60,.3)] dark:border-white/10 dark:bg-[#10271f]" data-aos="fade-up" data-aos-delay={(i % 3) * 100}>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tone} text-emerald-800 dark:text-emerald-200`}><Icon className="h-6 w-6" /></div>
                  <h3 className="mt-7 text-xl font-bold tracking-tight">{title}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-[#7b8c83] dark:text-[#9aafa5]">{description}</p>
                  <div className="pointer-events-none absolute -bottom-12 -right-10 h-32 w-32 rounded-full bg-emerald-100/70 blur-3xl transition group-hover:bg-emerald-200 dark:bg-emerald-400/5" />
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* AUDIENCE */}
        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end" data-aos="fade-up">
            <div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-emerald-700 dark:text-emerald-300">Kimlar uchun?</p><h2 className="mt-5 text-4xl font-semibold tracking-[-.06em] sm:text-5xl">Bilim ulashishni istagan har bir inson uchun.</h2></div>
            <p className="max-w-sm text-sm leading-7 text-[#74867c] dark:text-[#9aafa5]">Zikra turli tajriba va bilimga ega insonlarni bir maqsad atrofida birlashtiradi.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {audiences.map((item, i) => (
              <article key={item.title} className="group overflow-hidden rounded-[1.8rem] border border-[#e5ede7] bg-white shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[.035]" data-aos="fade-up" data-aos-delay={i * 120}>
                <div className="relative h-56 overflow-hidden sm:h-64"><img src={item.image} alt={item.alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" /><span className="absolute bottom-4 left-4 rounded-full border border-white/30 bg-black/25 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur">{item.label}</span></div>
                <div className="p-6"><h3 className="text-xl font-bold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-[#7b8c83] dark:text-[#9aafa5]">{item.description}</p></div>
              </article>
            ))}
          </div>
        </section>

        {/* FREE + STATUS */}
        <section className="bg-[#0d2821] py-20 text-white dark:bg-[#0a211a] sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_.85fr] lg:px-10">
            <div data-aos="fade-right"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-emerald-300">Ochiq imkoniyat</p><h2 className="mt-5 max-w-xl text-4xl font-semibold leading-tight tracking-[-.06em] sm:text-5xl">Bilim almashish uchun to'lov kerak emas.</h2><p className="mt-6 max-w-xl text-sm leading-7 text-white/65">Zikra'ga qo'shilish va undan foydalanish to'liq bepul. Biz bilim va tajriba almashish imkoniyatini hamma uchun ochiq qilishni istaymiz.</p><Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-6 py-3.5 text-sm font-extrabold text-[#09221b] transition hover:-translate-y-1 hover:bg-emerald-200">Hoziroq qo'shilish <ArrowRight className="h-4 w-4" /></Link></div>
            <div className="grid gap-4 sm:grid-cols-2" data-aos="fade-left">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[.06] p-6"><CircleDollarSign className="h-7 w-7 text-emerald-300" /><p className="mt-6 text-3xl font-semibold">0 so'm</p><p className="mt-2 text-sm text-white/60">Ro'yxatdan o'tish va foydalanish</p></div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[.06] p-6"><Award className="h-7 w-7 text-amber-300" /><p className="mt-6 text-xl font-semibold">Ishlab chiqilmoqda</p><p className="mt-2 text-sm text-white/60">Sertifikat tizimi ustida ish ketmoqda</p></div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[.7fr_1.3fr] lg:gap-20 lg:px-10 lg:py-32">
          <div data-aos="fade-right"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-emerald-700 dark:text-emerald-300">Savollaringiz bormi?</p><h2 className="mt-5 text-4xl font-semibold tracking-[-.06em] sm:text-5xl">Ko'p so'raladigan savollar.</h2><p className="mt-5 text-sm leading-7 text-[#74867c] dark:text-[#9aafa5]">Zikra haqida bilmoqchi bo'lgan asosiy ma'lumotlaringni shu yerdan topishing mumkin.</p><a href="https://t.me/asomiddinmeliboyev" target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:gap-3 dark:text-emerald-300">Yana savoling bormi? <ArrowUpRight className="h-4 w-4" /></a></div>
          <div className="space-y-3" data-aos="fade-up">
            {faqs.map((faq, i) => (
              <details key={faq.question} className="group rounded-2xl border border-[#e5ede7] bg-white px-5 py-4 transition open:border-emerald-700/20 open:shadow-sm dark:border-white/10 dark:bg-white/[.035]" data-aos="fade-up" data-aos-delay={Math.min(i * 35, 210)}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold marker:hidden"><span>{faq.question}</span><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0f6f1] text-emerald-800 transition group-open:rotate-180 dark:bg-white/10 dark:text-emerald-200"><ChevronDown className="h-4 w-4" /></span></summary>
                <p className="max-w-2xl pt-4 pr-10 text-sm leading-7 text-[#74867c] dark:text-[#9aafa5]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* FOUNDER */}
        <section className="border-y border-[#e7eee8] bg-[#f4f8f5] py-20 dark:border-white/[.07] dark:bg-[#0b201a] sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 md:grid-cols-[auto_1fr] lg:px-10">
            <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-[2.3rem] bg-gradient-to-br from-emerald-700 to-teal-500 text-4xl font-black text-white shadow-2xl shadow-emerald-900/20 ring-8 ring-white dark:ring-white/5 sm:h-44 sm:w-44 sm:text-5xl" data-aos="zoom-in">AM</div>
            <div className="max-w-3xl" data-aos="fade-left"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-emerald-700 dark:text-emerald-300">Loyiha asoschisi</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Asomiddin Meliboyev</h2><p className="mt-4 text-sm leading-7 text-[#74867c] dark:text-[#9aafa5]">TATU Axborot xavfsizligi yo'nalishi talabasi va full-stack dasturchi. Zikra g'oyasi — insonlar o'z bilimlarini o'zaro ulashishi va bir-birining rivojlanishiga hissa qo'shishi mumkin bo'lgan ochiq muhit yaratish.</p><div className="mt-6 flex flex-wrap gap-3"><a href="https://t.me/asomiddinmeliboyev" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#123b32] px-5 py-3 text-xs font-bold text-white transition hover:-translate-y-0.5 dark:bg-emerald-300 dark:text-[#09221b]"><MessageCircle className="h-4 w-4" /> Telegram orqali bog'lanish</a><a href="https://asomiddin1.vercel.app" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#d7e4da] bg-white px-5 py-3 text-xs font-bold text-[#29463d] transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[.05] dark:text-white"><Laptop className="h-4 w-4" /> Portfolio <ArrowUpRight className="h-3.5 w-3.5" /></a></div></div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-[#17483a] via-[#0e382e] to-[#102c28] px-7 py-16 text-center text-white shadow-[0_35px_90px_-45px_rgba(10,70,50,.65)] sm:px-12 sm:py-24" data-aos="zoom-in-up">
            <div className="pointer-events-none absolute -right-20 -top-40 h-96 w-96 rounded-full bg-emerald-300/15 blur-[90px]" />
            <div className="relative mx-auto max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-100"><Sparkles className="h-3.5 w-3.5" /> Sening navbating</span><h2 className="mt-7 text-4xl font-semibold leading-[1.05] tracking-[-.06em] sm:text-6xl">Sen bilgan bilim — kimdir uchun yangi imkoniyat.</h2><p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/65 sm:text-base">Bugun bir bilim ulash. Ertaga yangi bilim bilan qayt. Zikra hamjamiyatiga bepul qo'shil.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-extrabold text-[#17483a] transition hover:-translate-y-1 hover:bg-emerald-50">Bepul boshlash <ArrowRight className="h-4 w-4" /></Link><InstallPWAButton variant="outline" /></div><p className="mt-6 text-xs text-white/45">Hisobing bormi? <Link href="/login" className="font-bold text-white/85 hover:text-white">Kirish</Link></p></div>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#e5ede7] bg-white/60 dark:border-white/[.07] dark:bg-white/[.02]">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div><Link href="/" className="inline-flex items-center gap-2 text-lg font-black"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-sm text-white">Z</span>Zikra</Link><p className="mt-3 text-xs text-[#87968e] dark:text-[#82978d]">Bilimni ulash. Birga rivojlan.</p></div>
          <div className="flex flex-wrap gap-x-7 gap-y-3 text-xs font-semibold text-[#74867c] dark:text-[#9aafa5]"><Link href="#qanday-ishlaydi" className="hover:text-emerald-700">Qanday ishlaydi?</Link><Link href="#imkoniyatlar" className="hover:text-emerald-700">Imkoniyatlar</Link><Link href="#faq" className="hover:text-emerald-700">FAQ</Link><Link href="/login" className="hover:text-emerald-700">Kirish</Link><Link href="/register" className="hover:text-emerald-700">Ro'yxatdan o'tish</Link></div>
          <p className="text-xs text-[#9aa8a1]">© {new Date().getFullYear()} Zikra. Barcha huquqlar himoyalangan.</p>
        </div>
        <div className="mx-auto max-w-7xl px-5 pb-5 text-[10px] text-[#9aa8a1] sm:px-8 lg:px-10">Rasmlar: Unsplash (Vitaly Gariev) va Pikwizard. Vizual materiallar namoyish maqsadida ishlatilgan.</div>
      </footer>
    </div>
  );
}
