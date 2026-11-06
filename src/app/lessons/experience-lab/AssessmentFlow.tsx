"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, ExternalLink, Link2, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { assessmentBank, assessmentTracks, practicalTasks, type AssessmentTrack } from "./assessment-bank";
import PersonalizedLearningMap from "./PersonalizedLearningMap";
import type { LearningPlanInput } from "./LearningOnboarding";

type Props = { track: AssessmentTrack; plan: LearningPlanInput; onClose: () => void };
type SavedAssessment = { id: number; track_id: string; score: number; total: number; level: string; practical_passed: boolean; evidence_url: string | null; evidence_provider: string | null; evidence_status: string; assessed_at: string };

export default function AssessmentFlow({ track, plan, onClose }: Props) {
  const questions = useMemo(() => assessmentBank[track], [track]);
  const practical = practicalTasks[track];
  const [answers, setAnswers] = useState<number[]>(Array(10).fill(-1));
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<"quiz" | "practical" | "evidence" | "result">("quiz");
  const [practicalResponse, setPracticalResponse] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceProvider, setEvidenceProvider] = useState("");
  const [result, setResult] = useState<SavedAssessment | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const current = questions[index];
  const selected = answers[index];
  const complete = answers.every((answer) => answer >= 0);

  const submit = async () => {
    if (!complete || practicalResponse.trim().length < 3 || saving) return;
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/learning/assessment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track, answers, practicalResponse, evidenceUrl, evidenceProvider }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Natijani saqlab bo‘lmadi.");
      setResult(payload.assessment); setStage("result");
    } catch (e) { setError(e instanceof Error ? e.message : "Tarmoq xatosi. Qayta urinib ko‘ring."); }
    finally { setSaving(false); }
  };

  if (stage === "result" && result) {
    if (stage === "practical") {
    return <main className="min-h-[100dvh] w-full overflow-y-auto bg-[#f4f8f7] px-4 py-6 text-[#102321] sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <button onClick={() => setStage("quiz")} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#102321]"><ArrowLeft size={17}/> Testga qaytish</button>
        <div className="mt-8"><p className="text-xs font-black uppercase tracking-[.2em] text-[#087d70]">ZIKRA · 2-QISM / AMALIYOT</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Bilimingizni amalda ko‘rsating.</h1><p className="mt-3 text-sm leading-6 text-slate-600">Bu topshiriq test natijasini real vazifada qo‘llay olishingizni tekshiradi.</p></div>
        <section className="mt-7 rounded-[28px] border border-[#dce9e5] bg-white p-5 sm:p-8">
          <span className="rounded-full bg-[#168a62]/10 px-3 py-1.5 text-xs font-bold text-[#087d70]">{practical.title}</span>
          <h2 className="mt-5 text-xl font-extrabold leading-relaxed sm:text-2xl">{practical.prompt}</h2>
          <p className="mt-3 rounded-xl border border-[#0b9b88]/20 bg-sky-300/[.06] p-3 text-sm text-[#365b55]">Maslahat: {practical.hint}</p>
          <label className="mt-6 block text-sm font-bold text-slate-700" htmlFor="practical-response">Javobingiz</label>
          <textarea id="practical-response" value={practicalResponse} onChange={(e)=>setPracticalResponse(e.target.value)} maxLength={2000} rows={4} placeholder="Javobingizni shu yerga yozing..." className="mt-2 w-full resize-y rounded-2xl border border-[#dce9e5] bg-[#f4f8f7] p-4 text-sm text-[#102321] outline-none transition placeholder:text-slate-600 focus:border-[#0b9b88]"/>
          <div className="mt-2 text-right text-xs text-slate-500">{practicalResponse.length}/2000</div>
        </section>
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button disabled={practicalResponse.trim().length<3} onClick={()=>setStage("evidence")} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#087d70] to-[#0b9b88] px-6 text-sm font-black shadow-xl shadow-[#0b9b88]/20 transition hover:brightness-110 disabled:opacity-40">3-BOSQICHGA O‘TISH <ArrowRight size={18}/></button>
      </div>
    </main>;
  }

  return <main className="min-h-[100dvh] w-full overflow-y-auto bg-[#f4f8f7] px-4 py-8 text-[#102321] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <button onClick={onClose} className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#102321]"><ArrowLeft size={17}/> Orqaga</button>
        <section className="overflow-hidden rounded-[32px] border border-[#dce9e5] bg-white shadow-2xl">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#087d70] via-[#0b9b88] to-[#075f56] px-6 py-10 text-center sm:px-12 sm:py-14">
            <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"/>
            <Sparkles className="relative mx-auto h-10 w-10 text-violet-100"/>
            <p className="relative mt-4 text-xs font-black uppercase tracking-[.25em] text-[#102321]/65">Diagnostika yakunlandi</p>
            <h1 className="relative mt-3 text-3xl font-black sm:text-5xl">{assessmentTracks[track].title}</h1>
            <div className="relative mx-auto mt-7 flex h-32 w-32 flex-col items-center justify-center rounded-full border-[7px] border-white/20 bg-white/10 shadow-2xl">
              <strong className="text-4xl font-black">{result.score}<span className="text-lg text-[#102321]/55">/10</span></strong><span className="text-[10px] font-bold uppercase tracking-wider text-[#102321]/65">Test natijasi</span>
            </div>
            <p className="relative mt-6 text-sm font-bold text-[#102321]/65">Dastlabki baholangan darajangiz</p>
            <p className="relative mt-1 text-2xl font-black sm:text-3xl">{result.level}</p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8">
            <article className="rounded-2xl border border-[#dce9e5] bg-[#f7fbf9] p-5">
              <div className="flex items-center gap-2 text-sm font-extrabold"><CheckCircle2 className={result.practical_passed ? "text-emerald-400" : "text-amber-400"}/> Amaliy topshiriq</div>
              <p className="mt-3 text-sm text-slate-700">{result.practical_passed ? "Javob namunaviy yechimlardan biriga mos keldi." : "Javob avtomatik mezonga mos kelmadi. Bu bilim yo‘q degani emas — javobni mentor tekshirishi mumkin."}</p>
            </article>
            <article className="rounded-2xl border border-[#dce9e5] bg-[#f7fbf9] p-5">
              <div className="flex items-center gap-2 text-sm font-extrabold"><Link2 className="text-[#087d70]"/> Tashqi natija</div>
              {result.evidence_url ? <><p className="mt-2 text-sm text-slate-700">{result.evidence_provider || "Taqdim etilgan manba"} · <span className="text-amber-300">Tekshirilmagan</span></p><a href={result.evidence_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#087d70] hover:text-sky-200">Havolani ochish <ExternalLink size={14}/></a></> : <p className="mt-2 text-sm text-slate-600">Tashqi sertifikat yoki portfolio havolasi kiritilmadi.</p>}
            </article>
          </div>
          <div className="px-5 pb-5 sm:px-8 sm:pb-8">
            <h2 className="text-xl font-extrabold">Javoblar tahlili</h2>
            <p className="mt-1 text-sm text-slate-600">Xato javoblarni ko‘rib chiqing va mustahkamlash kerak bo‘lgan mavzularni aniqlang.</p>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {questions.map((question, i) => {
                const ok = answers[i] === question.answer;
                return <article key={question.id} className="rounded-2xl border border-[#dce9e5] bg-[#f4f8f7] p-4">
                  <div className="flex items-start gap-3">{ok ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-400"/> : <XCircle className="mt-0.5 shrink-0 text-rose-400"/>}
                    <div className="min-w-0 flex-1"><p className="text-sm font-bold">{i+1}. {question.prompt}</p>
                      {!ok && <p className="mt-2 text-xs text-rose-300">Sizning javobingiz: {question.choices[answers[i]]}</p>}
                      <p className="mt-1 text-xs font-bold text-[#087d70]">To‘g‘ri javob: {question.choices[question.answer]}</p><p className="mt-2 text-xs leading-5 text-slate-600">{question.explanation}</p>
                    </div>
                  </div>
                </article>;
              })}
            </div>
            <PersonalizedLearningMap track={track} plan={plan} score={result.score} />
            <button onClick={() => { setAnswers(Array(10).fill(-1)); setIndex(0); setPracticalResponse(""); setEvidenceUrl(""); setEvidenceProvider(""); setResult(null); setError(""); setStage("quiz"); }} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#d2e3de] bg-white/80 px-5 text-sm font-extrabold hover:bg-white/10 sm:w-auto"><RotateCcw size={16}/> Qayta baholash</button>
          </div>
        </section>
      </div>
    </main>;
  }

  if (stage === "evidence") {
    return <main className="min-h-[100dvh] w-full overflow-y-auto bg-[#f4f8f7] px-4 py-6 text-[#102321] sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <button onClick={() => setStage("practical")} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#102321]"><ArrowLeft size={17}/> Amaliy topshiriqqa qaytish</button>
        <div className="mt-8"><p className="text-xs font-black uppercase tracking-[.2em] text-[#087d70]">ZIKRA · 3-QISM / TASHQI NATIJA</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Natijalaringizni taqdim eting.</h1><p className="mt-3 text-sm leading-6 text-slate-600">Sertifikatlaringiz, loyihalaringiz va tashqi platformalardagi natijalaringizni shu yerda biriktiring.</p></div>
        <section className="mt-7 rounded-[28px] border border-[#dce9e5] bg-white p-5 sm:p-8">
          <div className="flex items-center gap-2"><Link2 className="text-[#087d70]"/><h2 className="text-lg font-extrabold">Tashqi natija yoki portfolio</h2><span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-slate-600">Ixtiyoriy</span></div>
          <p className="mt-2 text-sm leading-6 text-slate-600">Sertifikat, GitHub, LeetCode, HackerRank yoki boshqa platformadagi profilingiz havolasini qo‘shishingiz mumkin. Havola avtomatik tasdiqlanmaydi.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-600">Platforma / manba<input value={evidenceProvider} onChange={(e)=>setEvidenceProvider(e.target.value)} maxLength={80} placeholder="Masalan: GitHub, EF SET..." className="mt-2 min-h-12 w-full rounded-xl border border-[#dce9e5] bg-[#f4f8f7] px-3 text-sm text-[#102321] outline-none focus:border-[#0b9b88]"/></label>
            <label className="text-xs font-bold text-slate-600">Natija havolasi<input type="url" value={evidenceUrl} onChange={(e)=>setEvidenceUrl(e.target.value)} placeholder="https://..." className="mt-2 min-h-12 w-full rounded-xl border border-[#dce9e5] bg-[#f4f8f7] px-3 text-sm text-[#102321] outline-none focus:border-[#0b9b88]"/></label>
          </div>
          <p className="mt-3 text-xs text-slate-500">Faqat HTTPS havolalar qabul qilinadi. Hozircha holati “tekshirilmagan” deb belgilanadi. Hech qanday havola qo‘shmasangiz ham davom etishingiz mumkin.</p>
        </section>
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button disabled={saving} onClick={submit} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#087d70] to-[#0b9b88] px-6 text-sm font-black shadow-xl shadow-[#0b9b88]/20 transition hover:brightness-110 disabled:opacity-40">{saving ? "Natija saqlanmoqda…" : "YAKUNIY NATIJANI SAQLASH"} <Sparkles size={18}/></button>
      </div>
    </main>;
  }

  return <main className="min-h-[100dvh] w-full overflow-y-auto bg-[#f4f8f7] px-4 py-6 text-[#102321] sm:px-8 sm:py-10">
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-3"><button onClick={onClose} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#102321]"><ArrowLeft size={17}/> Chiqish</button><span className="rounded-full border border-[#0b9b88]/20 bg-[#0b9b88]/10 px-3 py-1.5 text-xs font-bold text-[#087d70]">{assessmentTracks[track].title}</span></div>
      <div className="mt-8"><div className="flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#087d70]">ZIKRA · 1-QISM / DIAGNOSTIKA</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Bilimingizni sinaymiz.</h1></div><span className="text-sm font-bold tabular-nums text-slate-600">{index+1} / {questions.length}</span></div>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#087d70] to-[#c99332] transition-all" style={{width:`${((index+1)/questions.length)*100}%`}}/></div>
      </div>
      <section className="mt-8 rounded-[28px] border border-[#dce9e5] bg-white p-5 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600"><CircleHelp size={15}/> Savol {index+1}</div><h2 className="mt-5 text-xl font-extrabold leading-relaxed sm:text-2xl">{current.prompt}</h2>
        <div className="mt-7 grid gap-3">{current.choices.map((choice, choiceIndex)=>{const active=selected===choiceIndex;return <button key={choice} onClick={()=>setAnswers((prev)=>prev.map((value,i)=>i===index?choiceIndex:value))} className={"flex min-h-14 items-center gap-4 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition "+(active?"border-[#0b9b88] bg-violet-400/15 text-[#102321] ring-2 ring-[#0b9b88]/20":"border-[#dce9e5] bg-[#f4f8f7] text-slate-700 hover:border-white/25 hover:bg-white/90")}><span className={"grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-black "+(active?"bg-[#0b9b88] text-[#102321]":"bg-white/10 text-slate-600")}>{String.fromCharCode(65+choiceIndex)}</span>{choice}</button>;})}</div>
        <div className="mt-8 flex items-center justify-between gap-3"><button disabled={index===0} onClick={()=>setIndex((v)=>Math.max(0,v-1))} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#dce9e5] px-4 text-sm font-bold text-slate-700 disabled:opacity-30"><ArrowLeft size={16}/> Oldingi</button>{index<questions.length-1?<button disabled={selected<0} onClick={()=>setIndex((v)=>Math.min(questions.length-1,v+1))} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#087d70] px-5 text-sm font-extrabold disabled:opacity-35">Keyingi <ArrowRight size={16}/></button>:<button disabled={!complete} onClick={()=>setStage("practical")} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#168a62] px-5 text-sm font-extrabold text-white disabled:opacity-35">Amaliyotga o‘tish <ArrowRight size={16}/></button>}</div>
      </section>
      <p className="mt-5 text-center text-xs leading-6 text-slate-500">Test natijasi dastlabki baho hisoblanadi. Yakuniy rivojlanish xaritasi amaliy topshiriqlar va keyingi mashqlar bilan boyitiladi.</p>
    </div>
  </main>;
}
