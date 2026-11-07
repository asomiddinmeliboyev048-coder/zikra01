"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Award, Bell, BookOpen, CheckCircle2, ChevronLeft, ChevronRight,
  CircleHelp, Compass, Flame, GraduationCap,
  Play, Search, Sparkles, Target, TrendingUp,
  Video, Map as MapIcon,
} from "lucide-react";
import LearningGamesHub from "@/components/learn/LearningGamesHub";
import LearningOnboarding, { type LearningPlanInput } from "@/app/lessons/experience-lab/LearningOnboarding";
import AssessmentFlow from "@/app/lessons/experience-lab/AssessmentFlow";

type Course = { id: string; title: string; thumbnail_url: string | null; duration: number | null; skill_name: string | null; created_at: string; };
type Props = {
  profile: { id: string; full_name: string; username: string | null; avatar_url: string | null; level: string; xp: number; streak_days: number; city: string | null; bio: string | null; };
  courses: Course[];
  skills: string[];
  lessonStats: { upcoming: number; completed: number; };
};

const categories = ["Barchasi", "Dasturlash", "Kiberxavfsizlik", "Dizayn", "Biznes", "Tillar"];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "Z";
}
function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "Video dars";
  const mins = Math.round(seconds / 60);
  return mins < 60 ? `${mins} daqiqa` : `${Math.floor(mins / 60)} soat ${mins % 60} daq.`;
}

export default function LearnDashboard({ profile, courses, skills, lessonStats }: Props) {
  const [planLoading, setPlanLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<LearningPlanInput | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Barchasi");
  const [monthOffset, setMonthOffset] = useState(0);
  const [doneTasks, setDoneTasks] = useState<string[]>([]);
  const filteredCourses = useMemo(() => courses.filter((course) => {
    const matchesQuery = `${course.title} ${course.skill_name ?? ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "Barchasi" || (course.skill_name ?? "").toLowerCase().includes(category.toLowerCase());
    return matchesQuery && matchesCategory;
  }), [courses, query, category]);

  useEffect(() => {
    let alive = true;
    const tracks = ["english", "russian", "coding", "cyber"];
    Promise.all(tracks.map(async (track) => {
      const response = await fetch(`/api/learning/plan?track=${track}`, { cache: "no-store" });
      if (!response.ok) return null;
      const payload = await response.json();
      return payload.plan ? { ...payload.plan, trackId: payload.plan.track_id, skillName: payload.plan.skill_name, currentLevel: payload.plan.current_level, targetLevel: payload.plan.target_level, dailyMinutes: payload.plan.daily_minutes, learningStyle: payload.plan.learning_style, targetDate: payload.plan.target_date ?? "", interests: payload.plan.interests ?? [] } as LearningPlanInput & { updated_at?: string } : null;
    })).then((plans) => {
      if (!alive) return;
      const saved = plans.filter((item): item is NonNullable<typeof item> => Boolean(item)).sort((a, b) => Date.parse(b.updated_at ?? "") - Date.parse(a.updated_at ?? ""))[0] ?? null;
      setActivePlan(saved);
      if (!saved) setWizardOpen(true);
    }).catch(() => { if (alive) setWizardOpen(true); }).finally(() => { if (alive) setPlanLoading(false); });
    return () => { alive = false; };
  }, []);

  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + monthOffset);
  const monthName = new Intl.DateTimeFormat("uz-UZ", { month: "long", year: "numeric" }).format(date);
  const firstDay = (date.getDay() + 6) % 7;
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const today = new Date();
  const tasks = [
    { id: "vocabulary", title: "Bugungi 10 ta yangi so‘zni yodlash", detail: "Shaxsiy lug‘atingizni boyiting" },
    { id: "course", title: "Yangi video dars ko‘rish", detail: "Bilimingga yana bir qadam qo‘sh" },
    { id: "mission", title: "Bugungi mashqni bajarish", detail: "Rivojlanish bo‘limidagi missiyani och" },
  ];

  if (planLoading) return <div className="grid min-h-[70vh] place-items-center bg-[#f3f7f6] px-5 dark:bg-[#071512]"><div className="text-center"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600"/><p className="mt-4 text-sm font-bold text-slate-500">Shaxsiy o‘quv yo‘lingiz tekshirilmoqda…</p></div></div>;
  if (wizardOpen) return <LearningOnboarding userName={profile.full_name} onStart={(_, nextPlan) => { setActivePlan(nextPlan); setWizardOpen(false); setAssessmentOpen(true); }} />;
  if (assessmentOpen && activePlan) return <AssessmentFlow track={activePlan.trackId} plan={activePlan} onClose={() => setAssessmentOpen(false)} />;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f3f7f6] text-[#172b27] dark:bg-[#071512] dark:text-[#e7f1ed]">
      <div className="mx-auto max-w-[1600px] space-y-4 px-3 py-4 sm:px-5 lg:space-y-5 lg:px-7 lg:py-6">
        <main className="min-w-0 space-y-4 lg:space-y-5">
          <header className="flex flex-col gap-4 rounded-[24px] border border-white bg-white/90 p-4 shadow-[0_12px_40px_-30px_rgba(17,75,61,.3)] dark:border-white/10 dark:bg-[#10231e] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">Zikra Learn · Shaxsiy kabinet</p>
              <h1 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Xush kelibsiz, {profile.full_name.split(" ")[0]}! <span aria-hidden>👋</span></h1>
              <p className="mt-1 text-xs text-slate-500">Bugun yangi bilim olish uchun ajoyib kun.</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:w-64 sm:flex-none dark:border-white/10 dark:bg-white/5">
                <Search size={16} className="shrink-0 text-slate-400"/>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kurs yoki mavzu qidirish..." className="w-full min-w-0 bg-transparent text-xs outline-none placeholder:text-slate-400"/>
              </label>
              <Link href="/notifications" aria-label="Bildirishnomalar" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"><Bell size={17}/></Link>
              <Link href={`/profile/${profile.id}`} aria-label="Profil" className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-100 text-sm font-black text-emerald-800 ring-2 ring-emerald-100 dark:bg-emerald-400/15 dark:text-emerald-200 dark:ring-emerald-300/10">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover"/> : initials(profile.full_name)}
              </Link>
            </div>
          </header>


          <section className="relative isolate overflow-hidden rounded-[24px] bg-gradient-to-r from-[#063e35] via-[#087d70] to-[#0d9b83] px-5 py-6 text-white shadow-[0_22px_55px_-30px_rgba(4,80,65,.6)] sm:px-8 sm:py-8">
            <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full bg-emerald-200/15 blur-3xl"/>
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-64 rounded-full bg-teal-200/10 blur-3xl"/>
            <div className="relative z-10 max-w-[66%] sm:max-w-[62%]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold text-emerald-100"><GraduationCap size={14}/> ZIKRA LEARN</span>
              <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight sm:text-3xl">O‘rgan, amaliyot qil,<br className="hidden sm:block"/> sertifikat ol!</h2>
              <p className="mt-2 max-w-md text-xs leading-5 text-emerald-50/85 sm:text-sm">Bilim va ko‘nikmalaringni rivojlantirish uchun kurslar, video darslar va amaliy mashqlar bir joyda.</p>
              <Link href="/videos" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-[#087d70] shadow-lg transition hover:-translate-y-0.5">Kurslarni ko‘rish <ChevronRight size={15}/></Link>
            </div>
            <img src="/zikra-mascot.webp" alt="Zikra Learn mushukcha maskoti" className="pointer-events-none absolute -bottom-4 right-2 z-0 h-[94%] max-w-[43%] object-contain object-bottom drop-shadow-[0_14px_20px_rgba(0,0,0,.2)] sm:right-8 sm:h-[112%] sm:max-w-[34%]" />
          </section>

          <section className="relative overflow-hidden rounded-[24px] border border-emerald-100 bg-gradient-to-r from-white via-[#f2fbf7] to-[#e3f6ef] p-5 shadow-sm dark:border-emerald-300/10 dark:from-[#10231e] dark:via-[#102b25] dark:to-[#123b31] sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-7">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl"/>
            <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200"><Target size={13}/> Sizning shaxsiy yo‘lingiz</span>
              <h2 className="mt-3 text-xl font-black sm:text-2xl">{activePlan?.skillName ?? "Shaxsiy rivojlanish"}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{activePlan ? `${activePlan.currentLevel} → ${activePlan.targetLevel} · Kuniga ${activePlan.dailyMinutes} daqiqa · Maqsad: ${activePlan.purpose}` : "Yo‘l xaritangizni yarating."}</p>
              <p className="mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200">Aniq bir maqsadingiz — bir qadam.</p>
            </div>
            <button onClick={() => setWizardOpen(true)} className="relative mt-4 inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#087d70] px-5 text-sm font-extrabold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-[#06665c] sm:mt-0"><MapIcon size={17}/> Yo‘l xaritasini tahrirlash <ChevronRight size={17}/></button>
          </section>

          <div className="grid gap-4 ">
            <section className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-[22px] border border-white bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#10231e]">
                <div className="flex items-center justify-between"><p className="text-sm font-extrabold">Faollik</p><span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">Bugungi holat</span></div>
                <div className="mt-5 flex items-end justify-between gap-3">
                  <div><p className="text-3xl font-black tracking-tight">{profile.streak_days}<span className="ml-1 text-sm font-bold text-slate-400">kun</span></p><p className="mt-1 text-xs text-slate-500">Joriy streak</p></div>
                  <div className="flex h-14 items-end gap-1.5" aria-label="Faollik ko‘rsatkichi"><span className="h-5 w-3 rounded-t-md bg-emerald-100 dark:bg-emerald-900"/><span className="h-8 w-3 rounded-t-md bg-emerald-200 dark:bg-emerald-800"/><span className="h-6 w-3 rounded-t-md bg-emerald-300 dark:bg-emerald-700"/><span className="h-11 w-3 rounded-t-md bg-emerald-500"/><span className="h-7 w-3 rounded-t-md bg-emerald-200 dark:bg-emerald-800"/><span className="h-10 w-3 rounded-t-md bg-emerald-400"/><span className="h-8 w-3 rounded-t-md bg-emerald-500"/></div>
                </div>
                <p className="mt-4 text-[11px] text-slate-400">Har kuni platformaga kirib, o‘rganishni davom ettir.</p>
              </article>
              <article className="rounded-[22px] border border-white bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#10231e]">
                <div className="flex items-center justify-between"><p className="text-sm font-extrabold">O‘sish ko‘rsatkichlari</p><TrendingUp size={17} className="text-emerald-600"/></div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative grid h-[88px] w-[88px] shrink-0 place-items-center rounded-full" style={{background:"conic-gradient(#0d9488 0deg, #0d9488 250deg, #e8efed 250deg 360deg)"}}>
                    <div className="grid h-[68px] w-[68px] place-items-center rounded-full bg-white text-lg font-black dark:bg-[#10231e]">{profile.xp}</div>
                  </div>
                  <div className="min-w-0 space-y-3">
                    <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"><Award size={16}/></span><span><b className="block text-sm">{profile.level}</b><small className="text-[10px] text-slate-400">Joriy daraja</small></span></div>
                    <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300"><Flame size={16}/></span><span><b className="block text-sm">{profile.xp} XP</b><small className="text-[10px] text-slate-400">To‘plangan tajriba</small></span></div>
                  </div>
                </div>
              </article>
            </section>


          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(270px,.85fr)]">
            <section className="min-w-0 rounded-[22px] border border-white bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#10231e] sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-base font-black">Kurslar va video darslar</h2><p className="mt-1 text-[11px] text-slate-400">Zikra hamjamiyati ulashgan bilimlardan boshlang.</p></div>
                <Link href="/videos" className="inline-flex items-center gap-1 rounded-xl bg-[#e6f5f1] px-3 py-2 text-[11px] font-bold text-[#087d70] dark:bg-emerald-400/10 dark:text-emerald-300">Barchasi <ChevronRight size={14}/></Link>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold transition ${category === item ? "bg-[#087d70] text-white" : "bg-slate-100 text-slate-500 hover:bg-emerald-50 dark:bg-white/5 dark:text-slate-300"}`}>{item}</button>)}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {filteredCourses.slice(0, 6).map((course) => <Link href="/videos" key={course.id} className="group overflow-hidden rounded-2xl border border-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10">
                  <div className="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-950 dark:to-[#16342c]">
                    {course.thumbnail_url ? <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/> : <div className="grid h-full place-items-center text-emerald-700 dark:text-emerald-300"><BookOpen size={32}/></div>}
                    <span className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-[9px] font-bold text-white">{formatDuration(course.duration)}</span>
                  </div>
                  <div className="p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">{course.skill_name ?? "Zikra darsi"}</p>
                    <h3 className="mt-1 line-clamp-2 min-h-10 text-xs font-extrabold leading-5">{course.title}</h3>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400"><span>Video dars</span><span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300">Ko‘rish <Play size={11} fill="currentColor"/></span></div>
                  </div>
                </Link>)}
                {filteredCourses.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-slate-200 py-10 text-center dark:border-white/10"><BookOpen className="mx-auto text-slate-300" size={28}/><p className="mt-2 text-sm font-bold">Hozircha mos kurs topilmadi</p><p className="mt-1 text-xs text-slate-400">Boshqa so‘z yoki yo‘nalish bilan qidirib ko‘ring.</p></div>}
              </div>
            </section>

            <aside className="space-y-4">
              <section className="rounded-[22px] border border-white bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#10231e] sm:p-5">
                <div className="flex items-center justify-between"><h2 className="text-sm font-black">Kalendar</h2><div className="flex gap-1"><button onClick={() => setMonthOffset((v) => v - 1)} aria-label="Oldingi oy" className="grid h-7 w-7 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"><ChevronLeft size={15}/></button><button onClick={() => setMonthOffset((v) => v + 1)} aria-label="Keyingi oy" className="grid h-7 w-7 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"><ChevronRight size={15}/></button></div></div>
                <p className="mt-2 text-center text-xs font-bold capitalize text-slate-500">{monthName}</p>
                <div className="mt-3 grid grid-cols-7 gap-1 text-center">{["Du","Se","Ch","Pa","Ju","Sh","Ya"].map((d) => <span key={d} className="py-1 text-[9px] font-bold text-slate-400">{d}</span>)}{Array.from({length:firstDay},(_,i)=><span key={`empty-${i}`}/>)}{Array.from({length:daysInMonth},(_,i)=>{const day=i+1;const isToday=day===today.getDate()&&date.getMonth()===today.getMonth()&&date.getFullYear()===today.getFullYear();return <span key={day} className={`grid aspect-square place-items-center rounded-full text-[10px] ${isToday?"bg-[#087d70] font-black text-white shadow-md shadow-emerald-800/20":"text-slate-600 dark:text-slate-300"}`}>{day}</span>;})}</div>
                <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5"><p className="text-lg font-black">{lessonStats.upcoming}</p><p className="text-[9px] text-slate-400">Kutilayotgan dars</p></div><div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5"><p className="text-lg font-black">{lessonStats.completed}</p><p className="text-[9px] text-slate-400">Yakunlangan dars</p></div></div>
              </section>
              <section className="rounded-[22px] border border-white bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#10231e] sm:p-5">
                <div className="flex items-center justify-between"><h2 className="text-sm font-black">Bugungi vazifalar</h2><span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{doneTasks.length}/{tasks.length}</span></div>
                <div className="mt-3 space-y-2">{tasks.map((task) => {const done=doneTasks.includes(task.id);return <button key={task.id} onClick={() => setDoneTasks((old) => done ? old.filter((id) => id !== task.id) : [...old,task.id])} className="flex w-full items-start gap-3 rounded-xl bg-slate-50 p-3 text-left transition hover:bg-emerald-50 dark:bg-white/[.035] dark:hover:bg-emerald-400/5"><span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border ${done?"border-emerald-600 bg-emerald-600 text-white":"border-slate-300 text-transparent dark:border-slate-600"}`}><CheckCircle2 size={13}/></span><span className="min-w-0"><b className={`block text-[11px] ${done?"text-slate-400 line-through":""}`}>{task.title}</b><small className="mt-1 block text-[9px] leading-4 text-slate-400">{task.detail}</small></span></button>;})}</div>
                <button onClick={() => setAssessmentOpen(true)} className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Mashqlar va missiyalar <ChevronRight size={13}/></button>
              </section>
            </aside>
          </div>


          <LearningGamesHub />

          {skills.length > 0 && <section className="rounded-[22px] border border-white bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#10231e] sm:p-5">
            <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-black">Mening yo‘nalishlarim</h2><p className="mt-1 text-[10px] text-slate-400">Profilingda belgilangan ko‘nikmalar</p></div><Link href="/onboarding" className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Tahrirlash ↗</Link></div>
            <div className="mt-3 flex flex-wrap gap-2">{skills.slice(0,10).map((skill) => <span key={skill} className="rounded-full border border-emerald-100 bg-emerald-50/70 px-3 py-1.5 text-[10px] font-bold text-emerald-800 dark:border-emerald-300/10 dark:bg-emerald-400/5 dark:text-emerald-200">{skill}</span>)}</div>
          </section>}

          <section className="grid gap-3 sm:grid-cols-3">
            <Link href="/videos" className="flex items-center gap-3 rounded-2xl border border-white bg-white p-4 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#10231e]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Video size={19}/></span><span><b className="block text-xs">Video darslar</b><small className="text-[10px] text-slate-400">Yangi bilimlarni o‘rgan</small></span><ChevronRight className="ml-auto text-slate-400" size={16}/></Link>
            <button onClick={() => setAssessmentOpen(true)} className="flex items-center gap-3 rounded-2xl border border-white bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#10231e]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"><Target size={19}/></span><span><b className="block text-xs">Amaliy mashqlar</b><small className="text-[10px] text-slate-400">Ko‘nikmalaringni sinab ko‘r</small></span><ChevronRight className="ml-auto text-slate-400" size={16}/></button>
            <Link href="/discovery" className="flex items-center gap-3 rounded-2xl border border-white bg-white p-4 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#10231e]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"><Compass size={19}/></span><span><b className="block text-xs">Hamjamiyat</b><small className="text-[10px] text-slate-400">Birgalikda rivojlan</small></span><ChevronRight className="ml-auto text-slate-400" size={16}/></Link>
          </section>
          <footer className="flex flex-wrap items-center justify-between gap-2 px-1 pb-6 text-[10px] text-slate-400"><span>© {new Date().getFullYear()} Zikra Learn</span><span className="inline-flex items-center gap-1"><CircleHelp size={12}/> Yordam kerakmi? <Link href="/chat" className="font-bold text-emerald-700 dark:text-emerald-300">Biz bilan bog‘lan</Link></span></footer>
        </main>
      </div>
    </div>
  );
}
