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
  const [weeklyActivity, setWeeklyActivity] = useState<{ day: string; count: number; dateKey: string }[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
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

  useEffect(() => {
    if (!activePlan?.trackId) {
      setWeeklyActivity([]);
      return;
    }
    let alive = true;
    setActivityLoading(true);
    fetch(`/api/learning/activity?track=${activePlan.trackId}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (!alive) return;
        const rows = Array.isArray(payload?.activities) ? payload.activities as { completed_at: string }[] : [];
        const today = new Date();
        const days = Array.from({ length: 7 }, (_, index) => {
          const day = new Date(today);
          day.setHours(0, 0, 0, 0);
          day.setDate(today.getDate() - (6 - index));
          const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
          const count = rows.filter((row) => {
            const stamp = new Date(row.completed_at);
            return Number.isFinite(stamp.getTime()) &&
              stamp.getFullYear() === day.getFullYear() &&
              stamp.getMonth() === day.getMonth() &&
              stamp.getDate() === day.getDate();
          }).length;
          return { day: new Intl.DateTimeFormat("uz-UZ", { weekday: "short" }).format(day), count, dateKey };
        });
        setWeeklyActivity(days);
      })
      .catch(() => { if (alive) setWeeklyActivity([]); })
      .finally(() => { if (alive) setActivityLoading(false); });
    return () => { alive = false; };
  }, [activePlan?.trackId]);

  const weeklyTotal = weeklyActivity.reduce((sum, day) => sum + day.count, 0);
  const maxDailyActivity = Math.max(1, ...weeklyActivity.map((day) => day.count));

  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + monthOffset);
  const monthName = new Intl.DateTimeFormat("uz-UZ", { month: "long", year: "numeric" }).format(date);
  const firstDay = (date.getDay() + 6) % 7;
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const today = new Date();
  const purposeLabel = ({ career: "Kasb va karyera", study: "O‘qish va ta’lim", certificate: "Sertifikat va imtihon", personal: "Shaxsiy rivojlanish" } as Record<string, string>)[activePlan?.purpose ?? ""] ?? activePlan?.purpose ?? "";


  if (planLoading) return <div className="grid min-h-[70vh] place-items-center zikra-silver bg-[#eef1f5] px-5 dark:bg-[#151a22]"><div className="text-center"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600"/><p className="mt-4 text-sm font-bold text-slate-500">Shaxsiy o‘quv yo‘lingiz tekshirilmoqda…</p></div></div>;
  if (wizardOpen) return <LearningOnboarding userName={profile.full_name} onStart={(_, nextPlan) => { setActivePlan(nextPlan); setWizardOpen(false); setAssessmentOpen(false); }} />;
  if (assessmentOpen && activePlan) return <AssessmentFlow track={activePlan.trackId} plan={activePlan} onClose={() => setAssessmentOpen(false)} />;

  return (
    <div className="zikra-silver min-h-[calc(100vh-64px)] bg-[#eef1f5] text-[#172b27] dark:bg-[#151a22] dark:text-[#e7f1ed]">
      <div className="mx-auto max-w-[1600px] space-y-4 px-3 py-4 sm:px-5 lg:space-y-5 lg:px-7 lg:py-6">
        <main className="min-w-0 space-y-4 lg:space-y-5">
          <header className="flex flex-col gap-4 rounded-[24px] border border-white bg-white/90 p-4 shadow-[0_12px_40px_-30px_rgba(17,75,61,.3)] dark:border-white/10 dark:bg-[#252d39] sm:flex-row sm:items-center sm:justify-between sm:px-6">
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
              <Link href={`/profile/${profile.id}`} aria-label="Profil" className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-200 text-sm font-black text-slate-700 ring-2 ring-slate-200 dark:bg-slate-400/15 dark:text-slate-200 dark:ring-slate-300/10">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover"/> : initials(profile.full_name)}
              </Link>
            </div>
          </header>


          <section className="relative isolate overflow-hidden rounded-[24px] bg-gradient-to-r from-[#e6eaf0] via-[#c4ccd7] to-[#f5f6f8] px-5 py-6 text-slate-900 shadow-[0_22px_55px_-30px_rgba(51,65,85,.32)] sm:px-8 sm:py-8">
            <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full bg-slate-400/25 blur-3xl"/>
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-64 rounded-full bg-slate-300/30 blur-3xl"/>
            <div className="relative z-10 max-w-[66%] sm:max-w-[62%]">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-500/20 bg-white/55 px-3 py-1.5 text-[10px] font-bold text-slate-700"><GraduationCap size={14}/> ZIKRA LEARN</span>
              <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight sm:text-3xl">O‘rgan, amaliyot qil,<br className="hidden sm:block"/> sertifikat ol!</h2>
              <p className="mt-2 max-w-md text-xs leading-5 text-slate-600 sm:text-sm">Bilim va ko‘nikmalaringni rivojlantirish uchun kurslar, video darslar va amaliy mashqlar bir joyda.</p>
              <Link href="/videos" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 shadow-lg transition hover:-translate-y-0.5">Kurslarni ko‘rish <ChevronRight size={15}/></Link>
            </div>
            <img src="/zikra-mascot.webp" alt="Zikra Learn mushukcha maskoti" className="pointer-events-none absolute -bottom-4 right-2 z-0 h-[94%] max-w-[43%] object-contain object-bottom drop-shadow-[0_14px_20px_rgba(0,0,0,.2)] sm:right-8 sm:h-[112%] sm:max-w-[34%]" />
          </section>

          <Link href="/ai-ustoz" className="group relative flex flex-col gap-4 overflow-hidden rounded-[24px] border border-white/80 bg-[linear-gradient(120deg,#f8fafc_0%,#dbe1e9_42%,#aeb8c6_72%,#f1f5f9_100%)] p-5 text-slate-800 shadow-[0_18px_45px_-28px_rgba(15,23,42,.5)] transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-[linear-gradient(120deg,#303a48_0%,#222b37_55%,#3c4655_100%)] dark:text-slate-100 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/40 blur-3xl dark:bg-slate-200/10"/>
            <div className="relative flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/80 bg-gradient-to-br from-white to-slate-300 text-slate-700 shadow-lg dark:border-white/20"><Sparkles size={25}/></span>
              <div><span className="inline-flex items-center gap-1 rounded-full border border-slate-500/20 bg-white/55 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-600 dark:bg-black/10 dark:text-slate-300"><Sparkles size={11}/> Yangi imkoniyat</span><h2 className="mt-1 text-lg font-black sm:text-xl">Zikra AI Ustoz</h2><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Ziyo bilan o‘zbekcha suhbatlashing, tanlagan ko‘nikmangizni mashq qiling.</p></div>
            </div>
            <span className="relative inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 text-xs font-extrabold text-white shadow-lg transition group-hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900">Ustoz bilan suhbat <ChevronRight size={16}/></span>
          </Link>

          <section className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-r from-white via-[#f2fbf7] to-[#e3f6ef] p-5 shadow-sm dark:border-slate-500/20 dark:from-[#252d39] dark:via-[#1d2530] dark:to-[#303a49] sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-7">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-slate-400/20 blur-3xl"/>
            <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:bg-slate-400/10 dark:text-slate-200"><Target size={13}/> Sizning shaxsiy yo‘lingiz</span>
              <h2 className="mt-3 text-xl font-black sm:text-2xl">{activePlan?.skillName ?? "Shaxsiy rivojlanish"}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{activePlan ? `${activePlan.currentLevel} → ${activePlan.targetLevel} · Kuniga ${activePlan.dailyMinutes} daqiqa · Maqsad: ${purposeLabel}` : "Yo‘l xaritangizni yarating."}</p>
              <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-200">Aniq bir maqsadingiz — bir qadam.</p>
            </div>
            <div className="relative mt-4 flex shrink-0 flex-col gap-2 sm:mt-0"><button onClick={() => setWizardOpen(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-700 px-5 text-sm font-extrabold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800"><MapIcon size={17}/> Yo‘l xaritasini tahrirlash <ChevronRight size={17}/></button><button onClick={() => setAssessmentOpen(true)} className="text-center text-[10px] font-bold text-slate-700 underline decoration-slate-400 underline-offset-4 dark:text-slate-200">Darajamni diagnostika qilish</button></div>
          </section>

          <div className="grid gap-4 ">
            <section className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-[22px] border border-white bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#252d39]">
                <div className="flex items-center justify-between"><p className="text-sm font-extrabold">Faollik</p><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:bg-slate-400/10 dark:text-slate-300">Bugungi holat</span></div>
                <div className="mt-5 flex items-end justify-between gap-3">
                  <div><p className="text-3xl font-black tracking-tight">{profile.streak_days}<span className="ml-1 text-sm font-bold text-slate-400">kun</span></p><p className="mt-1 text-xs text-slate-500">Joriy streak</p></div>
                  <div className="flex h-14 min-w-[112px] items-end justify-end gap-1.5" aria-label="So‘nggi 7 kunlik haqiqiy faollik">
                    {weeklyActivity.map((day) => <div key={day.dateKey} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${day.day}: ${day.count} ta faoliyat`}>
                      <span className="w-full max-w-3 rounded-t-md bg-gradient-to-t from-slate-600 to-slate-300 dark:from-slate-500 dark:to-slate-300" style={{ height: day.count ? `${Math.max(16, day.count / maxDailyActivity * 100)}%` : "4px", opacity: day.count ? 1 : .3 }} />
                      <span className="text-[8px] text-slate-400">{day.day.slice(0, 2)}</span>
                    </div>)}
                  </div>
                </div>
                <p className="mt-4 text-[11px] text-slate-400">{activityLoading ? "Faollik tarixi yuklanmoqda…" : `So‘nggi 7 kunda ${weeklyTotal} ta o‘quv faoliyati qayd etildi.`}</p>
              </article>
              <article className="rounded-[22px] border border-white bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#252d39]">
                <div className="flex items-center justify-between"><p className="text-sm font-extrabold">O‘sish ko‘rsatkichlari</p><TrendingUp size={17} className="text-slate-600"/></div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative grid h-[88px] w-[88px] shrink-0 place-items-center rounded-full" style={{background:"conic-gradient(#94a3b8 0deg, #64748b 250deg, #e2e8f0 250deg 360deg)"}}>
                    <div className="grid h-[68px] w-[68px] place-items-center rounded-full bg-white text-lg font-black dark:bg-[#252d39]">{profile.xp}</div>
                  </div>
                  <div className="min-w-0 space-y-3">
                    <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-400/10 dark:text-slate-300"><Award size={16}/></span><span><b className="block text-sm">{profile.level}</b><small className="text-[10px] text-slate-400">Joriy daraja</small></span></div>
                    <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-400/10 dark:text-slate-300"><Flame size={16}/></span><span><b className="block text-sm">{profile.xp} XP</b><small className="text-[10px] text-slate-400">To‘plangan tajriba</small></span></div>
                  </div>
                </div>
              </article>
            </section>


          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(270px,.85fr)]">
            <section className="min-w-0 rounded-[22px] border border-white bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#252d39] sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-base font-black">Kurslar va video darslar</h2><p className="mt-1 text-[11px] text-slate-400">Zikra hamjamiyati ulashgan bilimlardan boshlang.</p></div>
                <Link href="/videos" className="inline-flex items-center gap-1 rounded-xl bg-[#e6f5f1] px-3 py-2 text-[11px] font-bold text-slate-700 dark:bg-slate-400/10 dark:text-slate-300">Barchasi <ChevronRight size={14}/></Link>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold transition ${category === item ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-100 dark:bg-white/5 dark:text-slate-300"}`}>{item}</button>)}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {filteredCourses.slice(0, 6).map((course) => <Link href="/videos" key={course.id} className="group overflow-hidden rounded-2xl border border-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10">
                  <div className="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-[#303a49]">
                    {course.thumbnail_url ? <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/> : <div className="grid h-full place-items-center text-slate-700 dark:text-slate-300"><BookOpen size={32}/></div>}
                    <span className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-[9px] font-bold text-white">{formatDuration(course.duration)}</span>
                  </div>
                  <div className="p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{course.skill_name ?? "Zikra darsi"}</p>
                    <h3 className="mt-1 line-clamp-2 min-h-10 text-xs font-extrabold leading-5">{course.title}</h3>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400"><span>Video dars</span><span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">Ko‘rish <Play size={11} fill="currentColor"/></span></div>
                  </div>
                </Link>)}
                {filteredCourses.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-slate-200 py-10 text-center dark:border-white/10"><BookOpen className="mx-auto text-slate-300" size={28}/><p className="mt-2 text-sm font-bold">Hozircha mos kurs topilmadi</p><p className="mt-1 text-xs text-slate-400">Boshqa so‘z yoki yo‘nalish bilan qidirib ko‘ring.</p></div>}
              </div>
            </section>

            <aside className="space-y-4">
              <section className="rounded-[22px] border border-white bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#252d39] sm:p-5">
                <div className="flex items-center justify-between"><h2 className="text-sm font-black">Kalendar</h2><div className="flex gap-1"><button onClick={() => setMonthOffset((v) => v - 1)} aria-label="Oldingi oy" className="grid h-7 w-7 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"><ChevronLeft size={15}/></button><button onClick={() => setMonthOffset((v) => v + 1)} aria-label="Keyingi oy" className="grid h-7 w-7 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"><ChevronRight size={15}/></button></div></div>
                <p className="mt-2 text-center text-xs font-bold capitalize text-slate-500">{monthName}</p>
                <div className="mt-3 grid grid-cols-7 gap-1 text-center">{["Du","Se","Ch","Pa","Ju","Sh","Ya"].map((d) => <span key={d} className="py-1 text-[9px] font-bold text-slate-400">{d}</span>)}{Array.from({length:firstDay},(_,i)=><span key={`empty-${i}`}/>)}{Array.from({length:daysInMonth},(_,i)=>{const day=i+1;const isToday=day===today.getDate()&&date.getMonth()===today.getMonth()&&date.getFullYear()===today.getFullYear();return <span key={day} className={`grid aspect-square place-items-center rounded-full text-[10px] ${isToday?"bg-slate-700 font-black text-white shadow-md shadow-slate-800/20":"text-slate-600 dark:text-slate-300"}`}>{day}</span>;})}</div>
                <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5"><p className="text-lg font-black">{lessonStats.upcoming}</p><p className="text-[9px] text-slate-400">Kutilayotgan dars</p></div><div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5"><p className="text-lg font-black">{lessonStats.completed}</p><p className="text-[9px] text-slate-400">Yakunlangan dars</p></div></div>
              </section>
              <section className="rounded-[22px] border border-white bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#252d39] sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div><h2 className="text-sm font-black">Haftalik faollik</h2><p className="mt-1 text-[10px] text-slate-400">Saqlangan o‘quv faoliyatlaringiz asosida</p></div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:bg-slate-400/10 dark:text-slate-200">{weeklyTotal} ta</span>
                </div>
                <div className="mt-5 grid grid-cols-7 gap-2">
                  {weeklyActivity.map((day) => <div key={day.dateKey} className="flex min-w-0 flex-col items-center gap-2">
                    <div className="flex h-20 w-full items-end justify-center rounded-xl bg-slate-100/80 p-1.5 dark:bg-white/[.04]">
                      <div className="w-full max-w-5 rounded-t-lg bg-gradient-to-t from-slate-600 to-slate-300 dark:from-slate-500 dark:to-slate-300" style={{height: day.count ? `${Math.max(10, day.count / maxDailyActivity * 100)}%` : "3px", opacity: day.count ? 1 : .25}} />
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400">{day.day.slice(0, 2)}</span>
                    <span className="text-[9px] text-slate-500">{day.count}</span>
                  </div>)}
                </div>
                {!activityLoading && weeklyTotal === 0 && <p className="mt-3 text-center text-[10px] text-slate-400">Hali bu haftada faoliyat qayd etilmagan. Birinchi mashqni boshlang!</p>}
              </section>
            </aside>
          </div>


          <LearningGamesHub />

          {skills.length > 0 && <section className="rounded-[22px] border border-white bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#252d39] sm:p-5">
            <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-black">Mening yo‘nalishlarim</h2><p className="mt-1 text-[10px] text-slate-400">Profilingda belgilangan ko‘nikmalar</p></div><Link href="/onboarding" className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Tahrirlash ↗</Link></div>
            <div className="mt-3 flex flex-wrap gap-2">{skills.slice(0,10).map((skill) => <span key={skill} className="rounded-full border border-slate-200 bg-slate-100/70 px-3 py-1.5 text-[10px] font-bold text-slate-700 dark:border-slate-500/20 dark:bg-slate-500/5 dark:text-slate-200">{skill}</span>)}</div>
          </section>}

          <section className="grid gap-3 sm:grid-cols-3">
            <Link href="/videos" className="flex items-center gap-3 rounded-2xl border border-white bg-white p-4 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#252d39]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-400/10 dark:text-slate-300"><Video size={19}/></span><span><b className="block text-xs">Video darslar</b><small className="text-[10px] text-slate-400">Yangi bilimlarni o‘rgan</small></span><ChevronRight className="ml-auto text-slate-400" size={16}/></Link>
            <button onClick={() => setAssessmentOpen(true)} className="flex items-center gap-3 rounded-2xl border border-white bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#252d39]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-400/10 dark:text-slate-300"><Target size={19}/></span><span><b className="block text-xs">Amaliy mashqlar</b><small className="text-[10px] text-slate-400">Ko‘nikmalaringni sinab ko‘r</small></span><ChevronRight className="ml-auto text-slate-400" size={16}/></button>
            <Link href="/discovery" className="flex items-center gap-3 rounded-2xl border border-white bg-white p-4 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#252d39]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-400/10 dark:text-slate-300"><Compass size={19}/></span><span><b className="block text-xs">Hamjamiyat</b><small className="text-[10px] text-slate-400">Birgalikda rivojlan</small></span><ChevronRight className="ml-auto text-slate-400" size={16}/></Link>
          </section>
          <footer className="flex flex-wrap items-center justify-between gap-2 px-1 pb-6 text-[10px] text-slate-400"><span>© {new Date().getFullYear()} Zikra Learn</span><span className="inline-flex items-center gap-1"><CircleHelp size={12}/> Yordam kerakmi? <Link href="/chat" className="font-bold text-slate-700 dark:text-slate-300">Biz bilan bog‘lan</Link></span></footer>
        </main>
      </div>
    </div>
  );
}
