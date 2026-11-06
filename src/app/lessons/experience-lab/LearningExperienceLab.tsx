"use client";

import { useState } from "react";
import { BookOpen, Code2, ShieldCheck, Swords } from "lucide-react";
import SkillDuel from "./SkillDuel";
import AssessmentFlow from "./AssessmentFlow";
import type { TrackId } from "./question-bank";

const options: { id: TrackId; title: string; description: string; icon: typeof BookOpen; color: string }[] = [
  { id: "english", title: "Ingliz tili", description: "So‘z boyligi va inglizcha atamalar", icon: BookOpen, color: "from-violet-500 to-indigo-600" },
  { id: "coding", title: "Dasturlash", description: "Kod, texnologiya va dasturlash atamalari", icon: Code2, color: "from-sky-500 to-blue-600" },
  { id: "cyber", title: "Kiberxavfsizlik", description: "Axborot xavfsizligi va texnik atamalar", icon: ShieldCheck, color: "from-emerald-500 to-teal-600" },
];

export default function LearningExperienceLab() {
  const [selected, setSelected] = useState<TrackId>("english");
  const [duelOpen, setDuelOpen] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const skill = options.find((item) => item.id === selected)!;

  if (assessmentOpen) return <div className="fixed inset-0 z-[100] min-h-[100dvh] w-full overflow-hidden bg-[#0b0d12]"><AssessmentFlow track={selected} onClose={() => setAssessmentOpen(false)} /></div>;

  if (duelOpen) {
    return <div className="fixed inset-0 z-[100] min-h-[100dvh] w-full overflow-hidden bg-[#0b0d12]"><SkillDuel skill={skill.title} onClose={() => setDuelOpen(false)} /></div>;
  }

  return (
    <main className="relative flex min-h-[calc(100dvh-5rem)] w-full items-center justify-center overflow-hidden bg-[#0b0d12] px-4 py-8 text-white sm:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -bottom-48 -right-40 h-[34rem] w-[34rem] rounded-full bg-emerald-500/15 blur-[130px]" />
        <div className="absolute inset-0 opacity-[.12] [background-image:radial-gradient(#a5b4fc_1px,transparent_1px)] [background-size:26px_26px]" />
      </div>

      <section className="relative z-10 mx-auto w-full max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] border border-violet-300/20 bg-violet-400/10 text-violet-300 shadow-[0_0_60px_-15px_rgba(139,92,246,.5)]">
            <Swords size={30} />
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[.28em] text-violet-300">ZIKRA ARENA</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Bilimingni sinab ko‘r.</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">Yo‘nalishni tanla va boshqa Zikra foydalanuvchisi bilan bilim duelida bellash.</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {options.map((item) => {
            const Icon = item.icon;
            const active = selected === item.id;
            return (
              <button key={item.id} type="button" onClick={() => setSelected(item.id)} aria-pressed={active}
                className={"group relative min-h-40 overflow-hidden rounded-[26px] border p-5 text-left transition duration-300 hover:-translate-y-1 " + (active ? "border-violet-300/70 bg-white/[.09] shadow-[0_18px_60px_-28px_rgba(139,92,246,.65)] ring-2 ring-violet-400/30" : "border-white/10 bg-white/[.035] hover:border-white/20 hover:bg-white/[.06]")}>
                <div className={"mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white " + item.color}><Icon size={23} /></div>
                <h2 className="text-lg font-extrabold">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">{item.description}</p>
                {active && <span className="absolute right-5 top-5 h-2.5 w-2.5 rounded-full bg-violet-300 shadow-[0_0_16px_rgba(196,181,253,.9)]" />}
              </button>
            );
          })}
        </div>

        <div className="mt-7 flex flex-col items-center gap-4">
          <button type="button" onClick={() => setAssessmentOpen(true)} className="group flex min-h-14 w-full max-w-md items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/[.07] px-8 text-sm font-black text-white transition hover:border-violet-300/50 hover:bg-violet-400/10 active:scale-[.99]"><BookOpen size={19}/> DARAJAMNI ANIQLASH</button>
          <button type="button" onClick={() => setDuelOpen(true)} className="group flex min-h-16 w-full max-w-md items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 px-8 text-base font-black shadow-[0_12px_40px_-12px_rgba(124,58,237,.7)] transition hover:brightness-110 active:scale-[.99]">
            <Swords size={21} /> DUELNI BOSHLASH
          </button>
          <p className="text-center text-xs text-slate-500">Duel natijalari va foydalanuvchi ma’lumotlari mavjud saqlash tizimida qoladi.</p>
        </div>
      </section>
    </main>
  );
}
