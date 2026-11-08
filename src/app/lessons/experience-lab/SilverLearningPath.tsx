"use client";

import { ArrowDown, ArrowUpRight, Check, LockKeyhole, Sparkles, Target, Trophy } from "lucide-react";

type Props = {
  completedActivities: number;
  totalActivities: number;
  skillName: string;
  onContinue: () => void;
};

const stages = [
  { title: "Asoslar", description: "Poydevor bilimlarini mustahkamlash" },
  { title: "Amaliyot", description: "Bilimni amaliy vazifalarda sinash" },
  { title: "Mustahkamlash", description: "Takrorlash va ko‘nikmalarni oshirish" },
  { title: "Sinov", description: "O‘zlashtirilgan bilimni tekshirish" },
  { title: "Mahorat", description: "Keyingi darajaga tayyorlanish" },
];

export default function SilverLearningPath({ completedActivities, totalActivities, skillName, onContinue }: Props) {
  const completed = Math.min(stages.length, Math.max(0, completedActivities));
  const activeIndex = Math.min(completed, stages.length - 1);
  const progress = Math.round((completed / stages.length) * 100);

  return (
    <section className="silver-path-shell mt-5 overflow-hidden rounded-[30px] border p-4 shadow-sm sm:p-6 lg:p-7" aria-labelledby="silver-path-title">
      <div className="silver-path-orb silver-path-orb-one" aria-hidden="true" />
      <div className="silver-path-orb silver-path-orb-two" aria-hidden="true" />
      <div className="relative z-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <span className="silver-eyebrow inline-flex items-center gap-2"><Sparkles size={13}/> YOUR LEARNING JOURNEY</span>
            <h2 id="silver-path-title" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">O‘quv yo‘lingiz</h2>
            <p className="silver-muted mt-1 text-sm leading-6">{skillName} bo‘yicha kichik qadamlar katta natijaga olib boradi.</p>
          </div>
          <div className="silver-progress-chip">
            <span className="text-2xl font-black tabular-nums">{progress}%</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Umumiy progress</span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold"><Target size={16}/> Bosqichlar xaritasi</div>
          <span className="silver-muted text-xs tabular-nums">{completed}/{stages.length} bosqich</span>
        </div>
        <div className="silver-progress-track mt-2" role="progressbar" aria-label="O‘quv yo‘li progressi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <span style={{ width: progress + "%" }} />
        </div>

        <div className="silver-path-grid mt-6">
          <div className="silver-path-rail" aria-hidden="true"><span style={{ height: progress + "%" }} /></div>
          {stages.map((stage, index) => {
            const isComplete = index < completed;
            const isActive = index === activeIndex && completed < stages.length;
            const isLocked = !isComplete && !isActive;
            return (
              <button
                key={stage.title}
                type="button"
                disabled={isLocked}
                onClick={onContinue}
                className={"silver-path-node " + (isComplete ? "is-complete " : "") + (isActive ? "is-active " : "") + (isLocked ? "is-locked" : "")}
                aria-label={stage.title + (isComplete ? ", bajarilgan" : isActive ? ", faol bosqich" : ", qulflangan")}
              >
                <span className="silver-node-icon">
                  {isComplete ? <Check size={19} strokeWidth={2.8}/> : isActive ? <ArrowUpRight size={19}/> : <LockKeyhole size={16}/>}
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="silver-node-title">{stage.title}</span>
                    {isActive && <span className="silver-node-state">HOZIRGI</span>}
                    {isComplete && <span className="silver-node-state">BAJARILDI</span>}
                  </span>
                  <span className="silver-node-description">{stage.description}</span>
                </span>
                <span className="silver-node-index">{String(index + 1).padStart(2, "0")}</span>
              </button>
            );
          })}
        </div>

        <div className="silver-path-footer mt-5 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="silver-footer-icon"><Trophy size={18}/></span>
            <div><p className="text-sm font-bold">Keyingi qadam sizni kutmoqda</p><p className="silver-muted text-xs">{totalActivities} ta o‘quv faoliyati qayd etilgan</p></div>
          </div>
          <button type="button" onClick={onContinue} className="silver-continue-button inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold">
            Davom etish <ArrowDown size={15}/>
          </button>
        </div>
      </div>
    </section>
  );
}
