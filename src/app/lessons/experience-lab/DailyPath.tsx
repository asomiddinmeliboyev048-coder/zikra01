"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, CircleHelp, LockKeyhole, RefreshCw, Star, Trophy, X, Flame, Zap } from "lucide-react";
import { bank, type Question, type TrackId } from "./question-bank";
import { completeDailyTaskAction } from "@/app/actions/daily";

type Props = {
  completedIndexes: number[];
  date: string;
  streak: number;
  xp: number;
  migrationMissing?: boolean;
  initialError?: string;
};

type QuizQuestion = Question & { key: string };

function hashSeed(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return h >>> 0;
}
function seededShuffle<T>(items: T[], seed: string): T[] {
  const out = [...items];
  let state = hashSeed(seed) || 1;
  for (let i = out.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
const allQuestions: QuizQuestion[] = (Object.keys(bank) as TrackId[]).flatMap((track) =>
  bank[track].flatMap((lesson) => lesson.questions.map((q, index) => ({
    ...q, key: `${track}-${lesson.id}-${index}`,
  }))),
);
function taskQuestions(date: string, task: number, attempt: number): QuizQuestion[] {
  const base = seededShuffle(allQuestions, `${date}:daily-pool`);
  const chunk = base.slice(task * 3, task * 3 + 3);
  if (attempt === 0) return chunk;
  const assignedToday = new Set(base.slice(0, 15).map((q) => q.key));
  const unused = seededShuffle(base.filter((q) => !assignedToday.has(q.key) && !chunk.some((c) => c.key === q.key)), `${date}:${task}:${attempt}:alternatives`);
  return unused.slice(0, 3);
}

export default function DailyPath({ completedIndexes: initialIndexes, date, streak, xp, migrationMissing, initialError }: Props) {
  const [completed, setCompleted] = useState<number[]>(initialIndexes);
  const [active, setActive] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [feedback, setFeedback] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [passed, setPassed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const questionSet = useMemo(() => active === null ? [] : taskQuestions(date, active, attempt), [active, date, attempt]);
  const ordered = [...completed].sort((a,b)=>a-b);
  const current = Math.min(5, ordered.length);
  const activeQuestion = questionSet[qIndex];
  const finishedToday = completed.length >= 5;

  function openTask(index: number) {
    if (index !== current || finishedToday || migrationMissing) return;
    setActive(index); setAttempt(0); setQIndex(0); setSelected(null); setAnswers([]); setFeedback(false);
    setCorrect(0); setPassed(false); setSaved(false); setError("");
  }
  function closeQuiz() { setActive(null); setError(""); }
  function checkAnswer() {
    if (selected === null || feedback || !activeQuestion) return;
    setAnswers((prev) => [...prev, selected]);
    setCorrect((prev) => prev + (selected === activeQuestion.answer ? 1 : 0));
    setFeedback(true);
  }
  async function nextQuestion() {
    if (!activeQuestion || active === null) return;
    const right = selected === activeQuestion.answer;
    const nextCorrect = correct;
    if (qIndex < 2) {
      setQIndex((v) => v + 1); setSelected(null); setFeedback(false);
      return;
    }
    const totalCorrect = nextCorrect;
    const qualifies = totalCorrect * 100 >= 3 * 60;
    setPassed(qualifies);
    if (!qualifies) return;
    await saveTask(active, totalCorrect);
  }
  async function saveTask(index: number, score: number) {
    setSaving(true); setError("");
    try {
      const result = await completeDailyTaskAction({ index, correct: score, total: 3 });
      if (result.error) throw new Error(result.error);
      setCompleted((prev) => prev.includes(index) ? prev : [...prev, index].sort((a,b)=>a-b));
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Natijani saqlab bo‘lmadi.");
    } finally { setSaving(false); }
  }
  function retryTask() {
    setAttempt((n) => n + 1); setQIndex(0); setSelected(null); setAnswers([]);
    setFeedback(false); setCorrect(0); setPassed(false); setSaved(false); setError("");
  }
  const nodes = [-40, 10, 40, 10, -40];

  return <section id="daily-tasks" className="scroll-mt-32 overflow-hidden rounded-[28px] border border-brand-100 bg-white shadow-card dark:border-white/10 dark:bg-[#16201e]" aria-label="Kunlik vazifalar">
    <header className="bg-gradient-to-br from-brand-700 via-brand-600 to-teal-500 p-5 text-white sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[10px] font-black tracking-[.18em] text-brand-100">ZIKRA · KUNLIK MARSHRUT</p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Kunlik vazifalar</h2>
          <p className="mt-1 text-sm text-white/80">Har kuni bilim sari 5 qadam.</p>
          <p className="mt-2 text-xs text-white/70">{date} · Toshkent vaqti</p>
        </div>
        <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-center"><p className="text-2xl font-black">{completed.length}/5</p><p className="text-[10px] font-bold uppercase tracking-wider text-white/75">Vazifalar</p></div>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/15" role="progressbar" aria-label="Kunlik vazifalar bajarilishi" aria-valuemin={0} aria-valuemax={5} aria-valuenow={completed.length}><div className="h-full rounded-full bg-white transition-all duration-500" style={{width:`${completed.length/5*100}%`}}/></div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold"><span className="inline-flex items-center gap-1.5"><Flame size={17} className="text-amber-200"/> {streak} kunlik seriya</span><span className="inline-flex items-center gap-1.5"><Zap size={17} className="text-amber-200"/> {xp} XP</span><span className="text-xs font-medium text-white/75">XP mukofoti bu bosqichda yoqilmagan</span></div>
    </header>
    <div className="relative px-3 py-7 sm:px-6 sm:py-9">
      {migrationMissing && <div role="alert" className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100"><b>Kunlik vazifalar hali yoqilmagan.</b><p className="mt-1">Supabase SQL Editor’da `202611040004_daily_tasks.sql` migratsiyasini ishga tushiring, keyin sahifani yangilang.</p></div>}
      {initialError && !migrationMissing && <p role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">{initialError}</p>}
      {finishedToday && <div className="mb-6 rounded-2xl border border-amber-200 bg-accent-50 p-4 text-center dark:border-amber-500/20 dark:bg-accent-500/10"><Trophy className="mx-auto text-accent-600" size={30}/><p className="mt-2 font-black text-accent-700 dark:text-accent-100">Bugungi yo‘l yakunlandi!</p><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Ertaga yangi vazifalar ochiladi.</p></div>}
      <div className="relative mx-auto flex max-w-md flex-col items-center gap-5 py-1">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 320 540" preserveAspectRatio="none" aria-hidden="true"><path d="M160 48 C120 98 220 130 190 165 S105 230 160 270 S225 330 190 375 S100 445 160 495" fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="8" strokeLinecap="round" strokeDasharray="4 12"/></svg>
        {Array.from({length:5},(_,i)=>i).map((index)=>{
          const isDone=completed.includes(index), isCurrent=index===current&&!finishedToday, isLocked=!isDone&&!isCurrent;
          return <div key={index} className="relative z-10 flex w-full items-center justify-center" style={{transform:`translateX(${nodes[index]}px)`}}>
            <div className="relative flex flex-col items-center">
              {isCurrent&&<span className="mb-2 animate-bounce rounded-full bg-brand-600 px-3 py-1 text-xs font-black text-white shadow-lg">Boshlash</span>}
              <button type="button" disabled={!isCurrent||migrationMissing} onClick={()=>openTask(index)} aria-label={isDone?`Vazifa ${index+1}, bajarildi`:isCurrent?`Vazifa ${index+1}, boshlash`:`Vazifa ${index+1}, qulflangan`} className={`grid h-[70px] w-[70px] place-items-center rounded-full border-b-[5px] transition enabled:active:translate-y-1 enabled:active:border-b-0 disabled:cursor-not-allowed ${isDone?"border-success-700 bg-success-500 text-white":isCurrent?"border-brand-800 bg-brand text-white shadow-[0_7px_24px_rgba(11,155,136,.3)] ring-4 ring-brand-100 dark:ring-brand-900/50":"border-slate-300 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-white/10"}`}>
                {isDone?<Check size={31} strokeWidth={3}/>:isCurrent?<><Star size={31} fill="currentColor"/><span className="sr-only">Boshlash</span></>:<LockKeyhole size={26}/>}
              </button>
              <p className="mt-2 text-xs font-black text-slate-700 dark:text-slate-200">{index+1}-vazifa</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{isDone?"Bajarildi":isCurrent?"3 ta savol":"Qulflangan"}</p>
            </div>
          </div>;
        })}
        <div className="relative z-10 mt-1 flex flex-col items-center"><div className={`grid h-[76px] w-[76px] place-items-center rounded-full border-b-[5px] ${finishedToday?"border-accent-700 bg-accent-500 text-white":"border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-white/10"}`}><Trophy size={32}/></div><p className="mt-2 text-sm font-black">Kun yakuni</p><p className="text-xs font-bold text-accent-600 dark:text-accent-300">Kun bonusi +20 XP</p><p className="mt-1 text-[10px] text-slate-400">Hozircha vizual maqsad · mukofot faol emas</p></div>
      </div>
      <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">Vazifalar ketma-ket ochiladi. Har birida 3 ta savol bor.</p>
    </div>

    {active!==null&&<div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={(e)=>{if(e.target===e.currentTarget)closeQuiz();}}>
      <section role="dialog" aria-modal="true" aria-labelledby="daily-quiz-title" className="max-h-[94dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-slate-900 shadow-2xl dark:bg-[#101a17] dark:text-white sm:max-w-xl sm:rounded-[28px] sm:p-7">
        <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-brand-600">Kunlik sinov · {active+1}/5</p><h3 id="daily-quiz-title" className="mt-1 text-xl font-black">{saved?"":" "}Bilimingizni tekshiring</h3></div><button type="button" onClick={closeQuiz} aria-label="Sinovni yopish" className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-white/10"><X/></button></div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" role="progressbar" aria-label="Savollar" aria-valuemin={0} aria-valuemax={3} aria-valuenow={saved?3:qIndex+1}><div className="h-full rounded-full bg-brand transition-all" style={{width:`${saved?100:(qIndex+1)/3*100}%`}}/></div>
        {!passed&&activeQuestion&&<div className="mt-6">
          <p className="text-xs font-bold text-slate-400">SAVOL {qIndex+1}/3</p><h4 className="mt-2 text-xl font-black leading-snug">{activeQuestion.prompt}</h4>
          <div className="mt-5 grid gap-2.5">{seededShuffle(activeQuestion.choices.map((label,index)=>({label,index})),`${date}:${active}:${attempt}:${qIndex}:options`).map((option,order)=>{
            const displayedCorrect=option.index===activeQuestion.answer;
            const isSelected=selected===option.index;
            return <button key={option.index} type="button" disabled={feedback} onClick={()=>setSelected(option.index)} className={`flex min-h-[56px] items-center gap-3 rounded-2xl border-2 p-3 text-left text-sm font-bold transition ${feedback&&displayedCorrect?"border-success-500 bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-100":isSelected?"border-brand bg-brand-50 dark:bg-brand-500/10":"border-slate-200 bg-white hover:border-brand-300 dark:border-white/10 dark:bg-white/[.03]"}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs dark:bg-white/10">{String.fromCharCode(65+order)}</span><span className="flex-1">{option.label}</span>{feedback&&displayedCorrect&&<Check size={18} className="text-success-600"/>}</button>;
          })}</div>
          {feedback&&<div aria-live="polite" className="mt-4 rounded-2xl bg-brand-50 p-4 text-sm text-brand-900 dark:bg-brand-500/10 dark:text-brand-100"><p className="font-black">{selected===activeQuestion.answer?"To‘g‘ri javob!":"O‘rganish davom etadi."}</p><p className="mt-1 leading-relaxed">{activeQuestion.explanation}</p></div>}
          {!feedback?<button type="button" disabled={selected===null} onClick={checkAnswer} className="mt-5 min-h-12 w-full rounded-xl bg-brand px-4 font-black text-white shadow-[0_4px_0_#07645B] disabled:opacity-40">Tekshirish</button>:<button type="button" onClick={nextQuestion} disabled={saving} className="mt-5 min-h-12 w-full rounded-xl bg-brand px-4 font-black text-white shadow-[0_4px_0_#07645B] disabled:opacity-50">{qIndex<2?"Davom etish":saving?"Saqlanmoqda…":"Natijani ko‘rish"}</button>}
        </div>}
        {passed&&<div className="py-7 text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-success-50 text-success-600 dark:bg-success-500/10"><Trophy size={40}/></div><h4 className="mt-4 text-2xl font-black">{saved?"Vazifa saqlandi!":"Ajoyib natija!"}</h4><p className="mt-2 text-sm text-slate-500">{correct}/3 to‘g‘ri javob · {correct>=3?"Mukammal!":"Vazifa bajarildi."}</p>
          {saved?<div className="mt-4 rounded-2xl bg-success-50 p-4 text-sm font-bold text-success-700 dark:bg-success-500/10 dark:text-success-100"><Check className="mx-auto mb-1"/>Vazifa kunlik yo‘lga qo‘shildi. XP mukofoti bu versiyada faol emas.</div>:error?<div role="alert" className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-100">{error}<button type="button" disabled={saving} onClick={()=>saveTask(active,correct)} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-700 font-black text-white disabled:opacity-50"><RefreshCw size={16}/>Qayta saqlash</button></div>:<p className="mt-3 text-sm text-slate-500">Natija tasdiqlanmoqda…</p>}
          {saved?<button type="button" onClick={closeQuiz} className="mt-5 min-h-12 w-full rounded-xl bg-brand font-black text-white">Davom etish <ChevronRight className="ml-1 inline" size={18}/></button>:null}
        </div>}
        {!passed&&feedback&&qIndex===2&&correct<2&&<div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-400/30 dark:bg-amber-500/10"><p className="font-black text-amber-900 dark:text-amber-100">Yana bir bor urinib ko‘ring</p><p className="mt-1 text-sm text-amber-800 dark:text-amber-200">Kamida 2 ta to‘g‘ri javob kerak.</p><button type="button" onClick={retryTask} className="mt-3 min-h-11 w-full rounded-xl bg-accent-600 font-black text-white">Qayta urinish</button></div>}
      </section>
    </div>}
  </section>;
}
