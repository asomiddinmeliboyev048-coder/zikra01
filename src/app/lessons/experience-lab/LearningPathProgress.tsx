"use client";

import { useMemo, useState } from "react";
import { Award, BookOpen, CheckCircle2, Circle, Headphones, LockKeyhole, Mic, PenLine, Sparkles, ChevronDown, Clock3, Trophy } from "lucide-react";
import type { AssessmentTrack } from "./assessment-bank";

type Activity = {
  id: string;
  activity_type: string;
  score: number | null;
  completed_at: string;
  item_key?: string | null;
  duration_seconds?: number;
  details?: Record<string, unknown>;
};

type Props = { activities: Activity[]; trackId: AssessmentTrack };

const stageConfig: Record<AssessmentTrack, { title: string; description: string }[]> = {
  english: [
    { title: "Lug‘at", description: "Yangi so‘zlarni o‘rganing va yodlang" },
    { title: "Tinglash", description: "Audio matnlarni tinglab tushuning" },
    { title: "Gapirish", description: "Talaffuz va nutqni mashq qiling" },
    { title: "Yozish", description: "Fikrlaringizni yozma ifodalang" },
  ],
  russian: [
    { title: "Словарный запас", description: "Yangi ruscha so‘zlarni o‘rganing" },
    { title: "Аудирование", description: "Ruscha audio matnlarni tinglang" },
    { title: "Говорение", description: "Rus tilida talaffuzni mashq qiling" },
    { title: "Письмо", description: "Rus tilida yozma mashq bajaring" },
  ],
  coding: [
    { title: "Asosiy tushunchalar", description: "Atamalar va dasturlash lug‘atini o‘rganing" },
    { title: "Kod tahlili", description: "Kod va texnik izohlarni tushuning" },
    { title: "Amaliy kod", description: "Kod yozish va yechimni tushuntirish" },
    { title: "Texnik hujjat", description: "Kod va yechimlarni yozma bayon qiling" },
  ],
  cyber: [
    { title: "Xavfsizlik atamalari", description: "Kiberxavfsizlik terminlarini o‘rganing" },
    { title: "Tahdidlarni tahlil", description: "Xavfsizlik matnlari va vaziyatlarini tahlil qiling" },
    { title: "Himoya amaliyoti", description: "Xavfsizlik yechimlarini og‘zaki tushuntiring" },
    { title: "Hisobot yozish", description: "Xavfsizlik xulosalarini yozma ifodalang" },
  ],
};

const stageTypes = [
  { id: "vocabulary", Icon: BookOpen },
  { id: "listening", Icon: Headphones },
  { id: "speaking", Icon: Mic },
  { id: "writing", Icon: PenLine },
] as const;

const dateLabel = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Sana noma’lum" : new Intl.DateTimeFormat("uz-UZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
};

export default function LearningPathProgress({ activities, trackId }: Props) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const eligible = useMemo(
    () => activities.filter((item) => stageTypes.some((stage) => stage.id === item.activity_type) && (item.score ?? 0) >= 45),
    [activities]
  );
  const completedTypes = new Set(eligible.map((item) => item.activity_type));
  const completedCount = completedTypes.size;
  const activeDays = new Set(eligible.map((item) => {
    const date = new Date(item.completed_at);
    return Number.isNaN(date.getTime()) ? "" : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }).filter(Boolean)).size;
  const reinforcementDone = completedCount >= 3 && activeDays >= 2;
  const stageStates = [
    ...stageTypes.map((stage) => completedTypes.has(stage.id) ? "completed" : "pending"),
    reinforcementDone ? "completed" : "pending",
  ];
  const activeIndex = stageStates.findIndex((state) => state !== "completed");
  const stageItems = [
    ...stageTypes.map((stage, index) => ({ ...stage, ...stageConfig[trackId][index] })),
    { id: "reinforcement", title: "Mustahkamlash", description: "Kamida 3 ko‘nikma va 2 faol kun", Icon: Sparkles },
  ];
  const firstPractice = eligible.length > 0;
  const badges = [
    { id: "first", title: "Ilk qadam", description: "Birinchi muvaffaqiyatli mashq", earned: firstPractice, date: eligible.length ? eligible.reduce((a, b) => new Date(a.completed_at) < new Date(b.completed_at) ? a : b).completed_at : null, Icon: Award },
    { id: "all-skills", title: "To‘rt ko‘nikma", description: "Barcha asosiy mashq turlarini yakunlash", earned: completedCount === 4, date: completedCount === 4 ? eligible.filter((a) => stageTypes.some((s) => s.id === a.activity_type)).reduce((a, b) => new Date(a.completed_at) > new Date(b.completed_at) ? a : b).completed_at : null, Icon: BookOpen },
    { id: "consistency", title: "Barqaror ritm", description: "Kamida 3 xil faol kun", earned: activeDays >= 3, date: activeDays >= 3 ? eligible.slice().sort((a,b) => new Date(b.completed_at).getTime()-new Date(a.completed_at).getTime())[0]?.completed_at ?? null : null, Icon: Sparkles },
  ];
  const history = eligible.slice().sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()).slice(0, 8);
  const totalCompleted = completedCount + (reinforcementDone ? 1 : 0);

  return (
    <section className="rounded-[26px] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-slate-100/80 p-4 shadow-[0_18px_50px_-38px_rgba(51,65,85,.38)] dark:border-slate-500/20 dark:from-[#252d39] dark:via-[#202936] dark:to-[#303a49] sm:rounded-[30px] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500 dark:text-slate-400">SILVER LEARNING PATH</p>
          <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100 sm:text-2xl">Sizning o‘quv yo‘lingiz</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Har bir bosqich real mashg‘ulotlar tarixiga asoslanadi.</p>
        </div>
        <span className="rounded-full border border-slate-300/80 bg-white/80 px-3 py-1.5 text-[10px] font-bold text-slate-600 dark:border-slate-500/30 dark:bg-white/5 dark:text-slate-300">{totalCompleted}/5 bosqich</span>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-5">
        {stageItems.map((stage, index) => {
          const completed = stageStates[index] === "completed";
          const locked = !completed && index > (activeIndex === -1 ? stageItems.length : activeIndex);
          const active = !completed && !locked;
          const expanded = expandedStage === stage.id;
          const Icon = stage.Icon;
          const count = stage.id === "reinforcement" ? (reinforcementDone ? 1 : 0) : eligible.filter((item) => item.activity_type === stage.id).length;
          return (
            <button type="button" key={stage.id} aria-expanded={expanded} onClick={() => setExpandedStage(expanded ? null : stage.id)} className={`relative min-w-0 rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${completed ? "border-slate-400/70 bg-slate-200/70 dark:border-slate-400/30 dark:bg-slate-500/15" : active ? "border-slate-400 bg-white shadow-sm dark:border-slate-400/50 dark:bg-white/[.07]" : "border-slate-200/70 bg-slate-100/60 dark:border-slate-600/30 dark:bg-black/10"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`grid h-8 w-8 place-items-center rounded-xl ${completed ? "bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}><Icon size={16}/></span>
                {completed ? <CheckCircle2 size={16} className="text-slate-700 dark:text-slate-200"/> : locked ? <LockKeyhole size={15} className="text-slate-400"/> : <Circle size={15} className="text-slate-500"/>}
              </div>
              <p className="mt-3 text-xs font-black text-slate-800 dark:text-slate-100">{stage.title}</p>
              <p className="mt-1 min-h-8 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{stage.description}</p>
              <div className="mt-2 flex items-center justify-between gap-1"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{completed ? "Bajarildi" : active ? "Keyingi qadam" : "Qulflangan"}</p><ChevronDown size={13} className={`text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}/></div>
              <p className="mt-1 text-[9px] text-slate-500 dark:text-slate-400">{count} ta mashq</p>
            </button>
          );
        })}
      </div>

      {expandedStage && (() => {
        const stage = stageItems.find((item) => item.id === expandedStage);
        if (!stage) return null;
        const stageActivities = expandedStage === "reinforcement" ? eligible : eligible.filter((item) => item.activity_type === expandedStage);
        return <div className="mt-3 rounded-2xl border border-slate-300/70 bg-white/75 p-4 dark:border-slate-500/25 dark:bg-white/[.04]">
          <div className="flex items-center justify-between gap-2"><div><h3 className="text-sm font-black text-slate-800 dark:text-slate-100">{stage.title}</h3><p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{stage.description}</p></div><span className="text-[10px] font-bold text-slate-500">{stageStates[stageItems.findIndex((item) => item.id === expandedStage)] === "completed" ? "Yakunlangan" : "Jarayonda"}</span></div>
          {stageActivities.length ? <div className="mt-3 space-y-2">{stageActivities.slice(0,5).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-100/80 px-3 py-2 dark:bg-black/10"><span className="min-w-0"><b className="block truncate text-[10px] text-slate-700 dark:text-slate-200">{item.item_key || stage.title}</b><small className="text-[9px] text-slate-500">{dateLabel(item.completed_at)}</small></span><span className="shrink-0 rounded-full bg-slate-200 px-2 py-1 text-[9px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">{item.score ?? 0}%</span></div>)}</div> : <p className="mt-3 text-[10px] text-slate-500 dark:text-slate-400">Bu bosqich bo‘yicha hali muvaffaqiyatli mashg‘ulot yo‘q.</p>}
        </div>;
      })()}

      <div className="mt-5 border-t border-slate-200/80 pt-4 dark:border-slate-600/30">
        <div className="flex items-center justify-between gap-3"><h3 className="text-xs font-black text-slate-800 dark:text-slate-100">Yutuqlar tarixi</h3><span className="text-[10px] text-slate-500 dark:text-slate-400">{badges.filter((badge) => badge.earned).length}/3 ochilgan</span></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {badges.map(({ id, title, description, earned, date, Icon }) => (
            <div key={id} className={`flex items-center gap-3 rounded-xl border p-3 ${earned ? "border-slate-300 bg-white/80 dark:border-slate-500/30 dark:bg-white/[.05]" : "border-slate-200/70 bg-slate-100/50 opacity-60 dark:border-slate-700/40 dark:bg-black/10"}`}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"><Icon size={17}/></span>
              <span className="min-w-0"><b className="block text-[11px] text-slate-800 dark:text-slate-100">{title}</b><small className="block text-[9px] leading-4 text-slate-500 dark:text-slate-400">{description}</small><small className="mt-1 block text-[9px] text-slate-400">{earned && date ? dateLabel(date) : "Hali ochilmagan"}</small></span>
              {earned && <Trophy size={14} className="ml-auto shrink-0 text-slate-500"/>}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200/80 pt-4 dark:border-slate-600/30">
        <div className="flex items-center justify-between gap-3"><h3 className="text-xs font-black text-slate-800 dark:text-slate-100">So‘nggi mashg‘ulotlar</h3><span className="text-[10px] text-slate-500 dark:text-slate-400">Oxirgi {history.length} ta</span></div>
        {history.length ? <div className="mt-3 space-y-2">{history.map((item) => {
          const stage = stageConfig[trackId][stageTypes.findIndex((s) => s.id === item.activity_type)];
          return <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2 dark:bg-white/[.04]"><span className="flex min-w-0 items-center gap-2"><Clock3 size={14} className="shrink-0 text-slate-400"/><span className="min-w-0"><b className="block truncate text-[10px] text-slate-700 dark:text-slate-200">{item.item_key || stage?.title || item.activity_type}</b><small className="text-[9px] text-slate-400">{dateLabel(item.completed_at)}</small></span></span><span className="shrink-0 text-[10px] font-bold text-slate-600 dark:text-slate-300">{item.score ?? 0}%</span></div>;
        })}</div> : <p className="mt-3 text-[10px] text-slate-500 dark:text-slate-400">Mashg‘ulot bajarganingizdan keyin tarix shu yerda ko‘rinadi.</p>}
        <p className="mt-3 text-[9px] text-slate-400">Ko‘rsatkichlar faoliyat tarixidan hisoblanadi. Yutuqlar qo‘shimcha XP bermaydi.</p>
      </div>
    </section>
  );
}
