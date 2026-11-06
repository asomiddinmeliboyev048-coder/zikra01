"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Lightbulb, Sparkles } from "lucide-react";

const tips = [
  "O'rgatmoqchi bo'lgan ko'nikmangni profilingizda aniq yozing — mos hamkor sizni tezroq topadi.",
  "Yangi bilimni o'rganishda kichik, aniq maqsad qo'ying va har kuni oz-ozdan mashq qiling.",
  "Bilim almashishdan oldin ikki tomonning maqsadi va uchrashuv vaqtini kelishib oling.",
  "Profilingizga haqiqiy tajribangiz va loyihalaringizni qo'shing — bu ishonchni oshiradi.",
  "O'rgangan narsangizni boshqalarga tushuntirib bering: bu bilimni mustahkamlashning samarali usuli.",
];

export default function LandingTips() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % tips.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused]);

  const move = (step: number) => setIndex((current) => (current + step + tips.length) % tips.length);

  return <aside aria-label="Foydali maslahatlar" className="border-b border-emerald-100 bg-[#f1faf5] text-[#164b3a] dark:border-white/10 dark:bg-[#0d211b] dark:text-emerald-100"
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
    <div className="mx-auto flex min-h-[54px] max-w-7xl items-center gap-3 px-5 py-2 sm:px-8 lg:px-10">
      <span className="hidden shrink-0 items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.13em] text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-200 sm:inline-flex"><Lightbulb className="h-3.5 w-3.5" /> Foydali maslahat</span>
      <Sparkles className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300 sm:hidden" />
      <p key={index} aria-live="polite" className="min-w-0 flex-1 animate-[zikra-tip-in_.35s_ease-out_both] text-xs font-semibold leading-5 sm:text-sm">{tips[index]}</p>
      <div className="flex shrink-0 items-center gap-1">
        <span className="mr-1 hidden text-[10px] tabular-nums text-emerald-800/50 dark:text-emerald-100/45 sm:inline">{index + 1}/{tips.length}</span>
        <button type="button" onClick={() => move(-1)} aria-label="Oldingi maslahat" className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-emerald-200/70 dark:hover:bg-white/10"><ArrowLeft className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => move(1)} aria-label="Keyingi maslahat" className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-emerald-200/70 dark:hover:bg-white/10"><ArrowRight className="h-3.5 w-3.5" /></button>
      </div>
    </div>
    <style jsx>{`@keyframes zikra-tip-in { from { opacity: .25; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
  </aside>;
}
