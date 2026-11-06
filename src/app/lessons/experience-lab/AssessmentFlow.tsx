"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { assessmentBank, assessmentTracks, type AssessmentTrack } from "./assessment-bank";

type Props = { track: AssessmentTrack; onClose: () => void };
type SavedAssessment = { id: number; track_id: string; score: number; total: number; level: string; assessed_at: string };

export default function AssessmentFlow({ track, onClose }: Props) {
  const questions = useMemo(() => assessmentBank[track], [track]);
  const [answers, setAnswers] = useState<number[]>(Array(10).fill(-1));
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<SavedAssessment | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const current = questions[index];
  const selected = answers[index];
  const complete = answers.every((answer) => answer >= 0);

  const submit = async () => {
    if (!complete || saving) return;
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/learning/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track, answers }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Natijani saqlab bo‘lmadi.");
      setResult(payload.assessment);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tarmoq xatosi. Qayta urinib ko‘ring.");
    } finally { setSaving(false); }
  };

  if (result) {
    const score = result.score;
    return (
      <main className="min-h-[100dvh] w-full overflow-y-auto bg-[#0b0d12] px-4 py-8 text-white sm:px-8">
        <div className="mx-auto max-w-4xl">
          <button onClick={onClose} className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft size={17}/> Orqaga</button>
          <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[.045]">
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-indigo-700 to-[#0d7668] px-6 py-10 text-center sm:px-12 sm:py-14">
              <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"/>
              <Sparkles className="relative mx-auto h-10 w-10 text-violet-100"/>
              <p className="relative mt-4 text-xs font-black uppercase tracking-[.25em] text-white/65">Diagnostika yakunlandi</p>
              <h1 className="relative mt-3 text-3xl font-black sm:text-5xl">{assessmentTracks[track].title}</h1>
              <div className="relative mx-auto mt-7 flex h-32 w-32 flex-col items-center justify-center rounded-full border-[7px] border-white/20 bg-white/10 shadow-2xl">
                <strong className="text-4xl font-black">{score}<span className="text-lg text-white/55">/10</span></strong>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/65">Natija</span>
              </div>
              <p className="relative mt-6 text-sm font-bold text-white/65">Sizning hozirgi darajangiz</p>
              <p className="relative mt-1 text-2xl font-black sm:text-3xl">{result.level}</p>
            </div>
            <div className="p-5 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-xl font-extrabold">Javoblar tahlili</h2><p className="mt-1 text-sm text-slate-400">Xato javoblarni ko‘rib chiqing va bilimni mustahkamlang.</p></div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">{score} ta to‘g‘ri</span>
              </div>
              <div className="mt-6 space-y-3">
                {questions.map((question, i) => {
                  const ok = answers[i] === question.answer;
                  return <article key={question.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start gap-3">
                      {ok ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-400"/> : <XCircle className="mt-0.5 shrink-0 text-rose-400"/>}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">{i+1}. {question.prompt}</p>
                        {!ok && <p className="mt-2 text-xs text-rose-300">Sizning javobingiz: {question.choices[answers[i]]}</p>}
                        <p className="mt-1 text-xs font-bold text-emerald-300">To‘g‘ri javob: {question.choices[question.answer]}</p>
                        <p className="mt-2 text-xs leading-5 text-slate-400">{question.explanation}</p>
                      </div>
                    </div>
                  </article>;
                })}
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => { setAnswers(Array(10).fill(-1)); setIndex(0); setResult(null); setError(""); }} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-extrabold hover:bg-white/10"><RotateCcw size={16}/> Qayta test topshirish</button>
                <button onClick={onClose} className="min-h-12 flex-1 rounded-xl bg-violet-600 px-5 text-sm font-extrabold hover:bg-violet-500">Yakunlash</button>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] w-full overflow-y-auto bg-[#0b0d12] px-4 py-6 text-white sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <button onClick={onClose} className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft size={17}/> Chiqish</button>
          <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1.5 text-xs font-bold text-violet-200">{assessmentTracks[track].title}</span>
        </div>
        <div className="mt-8">
          <div className="flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-violet-300">ZIKRA · DARAJA ANIQLASH</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Bilimingizni sinaymiz.</h1></div><span className="text-sm font-bold tabular-nums text-slate-400">{index+1} / {questions.length}</span></div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all" style={{width:`${((index+1)/questions.length)*100}%`}}/></div>
        </div>
        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[.045] p-5 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><CircleHelp size={15}/> Savol {index+1}</div>
          <h2 className="mt-5 text-xl font-extrabold leading-relaxed sm:text-2xl">{current.prompt}</h2>
          <div className="mt-7 grid gap-3">
            {current.choices.map((choice, choiceIndex) => {
              const active = selected === choiceIndex;
              return <button key={choice} onClick={() => setAnswers((prev) => prev.map((value, i) => i === index ? choiceIndex : value))} className={"flex min-h-14 items-center gap-4 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition " + (active ? "border-violet-300 bg-violet-400/15 text-white ring-2 ring-violet-400/20" : "border-white/10 bg-black/20 text-slate-300 hover:border-white/25 hover:bg-white/[.06]")}>
                <span className={"grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-black " + (active ? "bg-violet-500 text-white" : "bg-white/10 text-slate-400")}>{String.fromCharCode(65+choiceIndex)}</span>{choice}
              </button>;
            })}
          </div>
          {error && <p role="alert" className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
          <div className="mt-8 flex items-center justify-between gap-3">
            <button disabled={index===0} onClick={() => setIndex((v)=>Math.max(0,v-1))} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-bold text-slate-300 disabled:opacity-30"><ArrowLeft size={16}/> Oldingi</button>
            {index < questions.length-1
              ? <button disabled={selected<0} onClick={() => setIndex((v)=>Math.min(questions.length-1,v+1))} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-35">Keyingi <ArrowRight size={16}/></button>
              : <button disabled={!complete||saving} onClick={submit} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-extrabold text-[#06271e] disabled:cursor-not-allowed disabled:opacity-35">{saving ? "Saqlanmoqda…" : "Natijani aniqlash"} <Sparkles size={16}/></button>}
          </div>
        </section>
        <p className="mt-5 text-center text-xs leading-6 text-slate-500">Bu boshlang‘ich diagnostika testi. Natija sizning yo‘nalish bo‘yicha dastlabki darajangizni belgilaydi; keyingi bosqichlarda test va amaliy topshiriqlar bilan aniqlashtiriladi.</p>
      </div>
    </main>
  );
}
