"use client";

import { useState } from "react";
import { Lightbulb, Sparkles } from "lucide-react";

const tips = [
  "O'rgatmoqchi bo'lgan ko'nikmangni profilingizda aniq yozing — mos hamkor sizni tezroq topadi.",
  "Yangi bilimni o'rganishda kichik, aniq maqsad qo'ying va har kuni oz-ozdan mashq qiling.",
  "Bilim almashishdan oldin ikki tomonning maqsadi va uchrashuv vaqtini kelishib oling.",
  "Profilingizga haqiqiy tajribangiz va loyihalaringizni qo'shing — bu ishonchni oshiradi.",
  "O'rgangan narsangizni boshqalarga tushuntirib bering: bu bilimni mustahkamlashning samarali usuli.",
];

function TipTrack({ copy = false }: { copy?: boolean }) {
  return (
    <div className="flex w-max shrink-0 items-center gap-8 pr-8" aria-hidden={copy || undefined}>
      {tips.map((tip, index) => (
        <div key={index} className="flex shrink-0 items-center gap-8 whitespace-nowrap">
          <span className="inline-flex items-center gap-2.5 text-xs font-semibold text-[#285b49] dark:text-emerald-100 sm:text-sm">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            {tip}
          </span>
          <span className="h-1.5 w-1.5 shrink-0 rotate-45 rounded-[1px] bg-emerald-400/70" />
        </div>
      ))}
    </div>
  );
}

export default function LandingTips() {
  const [paused, setPaused] = useState(false);

  return (
    <aside
      aria-label="Foydali maslahatlar"
      className="group relative z-20 overflow-hidden border-y border-emerald-100/80 bg-[#f1faf5] text-[#164b3a] dark:border-white/10 dark:bg-[#0d211b]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="mx-auto flex min-h-[58px] max-w-[1600px] items-center gap-4 px-4 sm:px-7">
        <span className="relative z-10 inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-[9px] font-extrabold uppercase tracking-[.14em] text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-200 sm:text-[10px]">
          <Lightbulb className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Foydali maslahatlar</span>
          <span className="sm:hidden">Maslahat</span>
        </span>

        <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)]">
          <div
            className={`zikra-tips-marquee flex w-max items-center hover:[animation-play-state:paused] ${paused ? "[animation-play-state:paused]" : ""}`}
          >
            <TipTrack />
            <TipTrack copy />
          </div>
        </div>
        <span className="hidden shrink-0 text-[9px] font-bold uppercase tracking-widest text-emerald-800/45 dark:text-emerald-100/40 lg:inline">O'rgan · Ulash · Rivojlan</span>
      </div>

      <style jsx>{`
        .zikra-tips-marquee {
          animation: zikra-tips-scroll 52s linear infinite;
          will-change: transform;
        }
        @keyframes zikra-tips-scroll {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .zikra-tips-marquee { animation: none; }
        }
      `}</style>
    </aside>
  );
}
