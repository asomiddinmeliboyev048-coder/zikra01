"use client";

import { Award, BookOpen, CheckCircle2, Circle, Headphones, LockKeyhole, Mic, PenLine, Sparkles } from "lucide-react";

type Activity = {
  id: string;
  activity_type: string;
  score: number | null;
  completed_at: string;
};

type Props = { activities: Activity[] };

const stages = [
  { id: "vocabulary", title: "Lug‘at", description: "Yangi so‘zlarni o‘rganing", Icon: BookOpen },
  { id: "listening", title: "Tinglash", description: "Audio mashqni yakunlang", Icon: Headphones },
  { id: "speaking", title: "Gapirish", description: "Nutq mashqini bajaring", Icon: Mic },
  { id: "writing", title: "Yozish", description: "Fikringizni yozib mashq qiling", Icon: PenLine },
] as const;

export default function LearningPathProgress({ activities }: Props) {
  const completedTypes = new Set(
    activities
      .filter((item) => ["vocabulary", "listening", "speaking", "writing"].includes(item.activity_type) && (item.score ?? 0) >= 45)
      .map((item) => item.activity_type)
  );
  const completedCount = completedTypes.size;
  const activeDays = new Set(
    activities
      .filter((item) => ["vocabulary", "listening", "speaking", "writing"].includes(item.activity_type) && (item.score ?? 0) >= 45)
      .map((item) => new Date(item.completed_at).toLocaleDateString("en-CA"))
      .filter((day) => day && day !== "Invalid Date")
  ).size;
  const reinforcementDone = completedCount >= 3 && activeDays >= 2;
  const stageStates = [
    ...stages.map((stage) => completedTypes.has(stage.id) ? "completed" : "pending"),
    reinforcementDone ? "completed" : "pending",
  ];
  const activeIndex = stageStates.findIndex((state) => state !== "completed");
  const stageItems = [
    ...stages,
    { id: "reinforcement", title: "Mustahkamlash", description: "Kamida 3 ko‘nikma va 2 faol kun", Icon: Sparkles },
  ];
  const badges = [
    { title: "Ilk qadam", description: "Birinchi mashq yakunlandi", earned: completedTypes.size > 0 || activities.some((a) => a.activity_type === "vocabulary" && (a.score ?? 0) >= 45), Icon: Award },
    { title: "To‘rt ko‘nikma", description: "Barcha asosiy mashq turlari", earned: completedCount === 4, Icon: BookOpen },
    { title: "Barqaror ritm", description: "Kamida 3 faol kun", earned: activeDays >= 3, Icon: Sparkles },
  ];

  return (
    <section className="rounded-[26px] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-slate-100/80 p-4 shadow-[0_18px_50px_-38px_rgba(51,65,85,.38)] dark:border-slate-500/20 dark:from-[#252d39] dark:via-[#202936] dark:to-[#303a49] sm:rounded-[30px] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500 dark:text-slate-400">SILVER LEARNING PATH</p>
          <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100 sm:text-2xl">Sizning o‘quv yo‘lingiz</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Bosqichlar bajarilgan mashqlar tarixiga qarab ochiladi.</p>
        </div>
        <span className="rounded-full border border-slate-300/80 bg-white/80 px-3 py-1.5 text-[10px] font-bold text-slate-600 dark:border-slate-500/30 dark:bg-white/5 dark:text-slate-300">{completedCount + (reinforcementDone ? 1 : 0)}/5 bosqich</span>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-5">
        {stageItems.map((stage, index) => {
          const completed = stageStates[index] === "completed";
          const locked = !completed && index > (activeIndex === -1 ? stageItems.length : activeIndex);
          const active = !completed && !locked;
          const Icon = stage.Icon;
          return (
            <article key={stage.id} className={`relative min-w-0 rounded-2xl border p-3 transition-colors ${completed ? "border-slate-400/70 bg-slate-200/70 dark:border-slate-400/30 dark:bg-slate-500/15" : active ? "border-slate-400 bg-white shadow-sm dark:border-slate-400/50 dark:bg-white/[.07]" : "border-slate-200/70 bg-slate-100/60 dark:border-slate-600/30 dark:bg-black/10"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`grid h-8 w-8 place-items-center rounded-xl ${completed ? "bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}><Icon size={16}/></span>
                {completed ? <CheckCircle2 size={16} className="text-slate-700 dark:text-slate-200"/> : locked ? <LockKeyhole size={15} className="text-slate-400"/> : <Circle size={15} className="text-slate-500"/>}
              </div>
              <p className="mt-3 text-xs font-black text-slate-800 dark:text-slate-100">{stage.title}</p>
              <p className="mt-1 min-h-8 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{stage.description}</p>
              <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{completed ? "Bajarildi" : active ? "Keyingi qadam" : "Qulflangan"}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-5 border-t border-slate-200/80 pt-4 dark:border-slate-600/30">
        <div className="flex items-center justify-between gap-3"><h3 className="text-xs font-black text-slate-800 dark:text-slate-100">Yutuqlar</h3><span className="text-[10px] text-slate-500 dark:text-slate-400">{badges.filter((badge) => badge.earned).length}/3 ochilgan</span></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {badges.map(({ title, description, earned, Icon }) => (
            <div key={title} className={`flex items-center gap-3 rounded-xl border p-3 ${earned ? "border-slate-300 bg-white/80 dark:border-slate-500/30 dark:bg-white/[.05]" : "border-slate-200/70 bg-slate-100/50 opacity-60 dark:border-slate-700/40 dark:bg-black/10"}`}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"><Icon size={17}/></span>
              <span className="min-w-0"><b className="block text-[11px] text-slate-800 dark:text-slate-100">{title}</b><small className="block text-[9px] leading-4 text-slate-500 dark:text-slate-400">{description}</small></span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[9px] text-slate-400">Yutuqlar mavjud mashg‘ulotlar tarixidan hisoblanadi; ular alohida XP bermaydi.</p>
      </div>
    </section>
  );
}
