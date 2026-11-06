"use client";

import { useState } from "react";
import { ArrowRight, BookOpen, Code2, Languages, ShieldCheck, Sparkles, Swords, Target, Trophy } from "lucide-react";
import SkillDuel from "./SkillDuel";
import AssessmentFlow from "./AssessmentFlow";
import type { TrackId } from "./question-bank";

const options: { id: TrackId; title: string; subtitle: string; description: string; icon: typeof BookOpen; accent: string; iconBg: string; tag?: string }[] = [
  { id:"english", title:"Ingliz tili", subtitle:"ENGLISH", description:"Lug‘at, grammatika, tinglash va erkin muloqot.", icon:Languages, accent:"from-sky-400 to-blue-600", iconBg:"bg-sky-400/10 text-[#087d70]" },
  { id:"russian", title:"Rus tili", subtitle:"РУССКИЙ", description:"Kundalik suhbat, grammatika va ruscha fikrlash.", icon:BookOpen, accent:"from-rose-400 to-pink-600", iconBg:"bg-rose-50 text-rose-300", tag:"Yangi" },
  { id:"coding", title:"Dasturlash", subtitle:"PROGRAMMING", description:"Kod yozish, algoritmlar va muammolarni yechish.", icon:Code2, accent:"from-violet-400 to-indigo-600", iconBg:"bg-[#0b9b88]/10 text-[#087d70]" },
  { id:"cyber", title:"Kiberxavfsizlik", subtitle:"CYBERSECURITY", description:"Xavfsizlik fikrlashi va real vaziyatlarni tahlil qilish.", icon:ShieldCheck, accent:"from-emerald-400 to-teal-600", iconBg:"bg-[#168a62]/10 text-[#087d70]" },
];

export default function LearningExperienceLab() {
  const [selected, setSelected] = useState<TrackId>("english");
  const [duelOpen, setDuelOpen] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const skill = options.find((item) => item.id === selected)!;
  const SelectedIcon = skill.icon;

  if (assessmentOpen) return <div className="fixed inset-0 z-[100] h-[100dvh] w-full overflow-y-auto overscroll-contain touch-pan-y bg-[#f4f8f7]"><AssessmentFlow track={selected} onClose={() => setAssessmentOpen(false)} /></div>;
  if (duelOpen) return <div className="fixed inset-0 z-[100] h-[100dvh] w-full overflow-y-auto overscroll-contain touch-pan-y bg-[#f4f8f7]"><SkillDuel skill={skill.title} onClose={() => setDuelOpen(false)} /></div>;

  return (
    <main className="relative isolate min-h-[calc(100dvh-5rem)] w-full overflow-hidden bg-[#f4f8f7] px-4 py-8 text-[#102321] sm:px-7 lg:px-10 lg:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[38rem] w-[38rem] rounded-full bg-violet-600/15 blur-[140px]"/>
        <div className="absolute -right-48 top-1/4 h-[36rem] w-[36rem] rounded-full bg-cyan-500/10 blur-[150px]"/>
        <div className="absolute inset-0 opacity-[.08] [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:56px_56px]"/>
      </div>

      <div className="mx-auto w-full max-w-[1440px]">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dce9e5] bg-white/80 px-3 py-2 text-[11px] font-black tracking-[.18em] text-slate-700"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.8)]"/> ZIKRA LEARNING ARENA</div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><span className="rounded-full border border-[#dce9e5] px-3 py-2">TEST</span><span className="rounded-full border border-[#dce9e5] px-3 py-2">AMALIYOT</span><span className="rounded-full border border-[#dce9e5] px-3 py-2">PORTFOLIO</span></div>
        </header>

        <section className="grid items-end gap-7 pb-9 pt-12 lg:grid-cols-[1.15fr_.85fr] lg:pt-16">
          <div>
            <p className="text-xs font-black uppercase tracking-[.24em] text-[#087d70]">O‘zingizga mos yo‘lni toping</p>
            <h1 className="mt-4 max-w-3xl text-[clamp(2.5rem,6vw,5.6rem)] font-black leading-[.98] tracking-[-.055em]">Bilimni sinang.<br/><span className="bg-gradient-to-r from-violet-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">Salohiyatni oching.</span></h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">Zikra sizning hozirgi darajangizni test, amaliy topshiriq va tashqi natijalar orqali aniqlashga yordam beradi. Keyingi qadam — aynan sizga mos o‘rganish yo‘li.</p>
          </div>
          <div className="relative overflow-hidden rounded-[28px] border border-[#dce9e5] bg-gradient-to-br from-white via-[#f7fbf9] to-[#eaf5f1] p-6 shadow-2xl shadow-black/20 sm:p-7">
            <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-[#0b9b88]/20 blur-3xl"/>
            <div className="relative flex items-center justify-between"><div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#dce9e5] bg-white/80 text-[#087d70]"><Target size={23}/></div><span className="rounded-full border border-[#168a62]/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#087d70]">Shaxsiy baholash</span></div>
            <h2 className="relative mt-6 text-2xl font-black">3 bosqichli diagnostika</h2>
            <div className="relative mt-5 grid grid-cols-3 gap-2">
              {[["01","Test"],["02","Amaliyot"],["03","Portfolio"]].map(([n,label])=><div key={n} className="rounded-xl border border-[#dce9e5] bg-black/15 p-3"><p className="text-[10px] font-black text-[#087d70]">{n}</p><p className="mt-1 text-xs font-bold text-slate-200">{label}</p></div>)}
            </div>
            <p className="relative mt-4 text-xs leading-5 text-slate-600">Tashqi sertifikat va portfolio havolalari ixtiyoriy. Ular tekshirilmaguncha tasdiqlangan deb hisoblanmaydi.</p>
          </div>
        </section>

        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[.2em] text-slate-500">YO‘NALISHNI TANLANG</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Qaysi ko‘nikmani rivojlantirasiz?</h2></div><span className="text-xs text-slate-500">4 ta yo‘nalish mavjud</span></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {options.map((item)=>{
              const Icon=item.icon; const active=selected===item.id;
              return <button key={item.id} type="button" onClick={()=>setSelected(item.id)} aria-pressed={active} className={"group relative min-h-[218px] overflow-hidden rounded-[26px] border p-5 text-left transition duration-300 hover:-translate-y-1 "+(active?"border-white/30 bg-white/[.095] shadow-[0_20px_65px_-30px_rgba(139,92,246,.55)]":"border-white/[.09] bg-white/85 hover:border-white/20 hover:bg-[#17212d]")}>
                <div className={"absolute -right-10 -top-12 h-36 w-36 rounded-full bg-gradient-to-br opacity-[.13] blur-2xl transition group-hover:opacity-30 "+item.accent}/>
                <div className="relative flex items-start justify-between"><div className={"grid h-12 w-12 place-items-center rounded-2xl "+item.iconBg}><Icon size={23}/></div>{item.tag&&<span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black text-rose-700">{item.tag}</span>}{active&&!item.tag&&<span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_15px_rgba(110,231,183,.8)]"/>}</div>
                <p className="relative mt-6 text-[9px] font-black tracking-[.22em] text-slate-500">{item.subtitle}</p><h3 className="relative mt-1 text-xl font-black">{item.title}</h3><p className="relative mt-2 text-xs leading-5 text-slate-600">{item.description}</p>
                <div className={"absolute bottom-5 right-5 grid h-8 w-8 place-items-center rounded-full border transition "+(active?"border-white/20 bg-white/10 text-[#102321]":"border-[#dce9e5] text-slate-500 group-hover:translate-x-1 group-hover:text-[#102321]")}><ArrowRight size={15}/></div>
                {active&&<div className={"absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r "+item.accent}/>}
              </button>;
            })}
          </div>
        </section>

        <section className="mt-7 grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="rounded-[26px] border border-[#dce9e5] bg-white/90 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-3"><div className={"grid h-11 w-11 place-items-center rounded-xl "+skill.iconBg}><SelectedIcon size={21}/></div><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500">TANLANGAN YO‘NALISH</p><h3 className="mt-0.5 text-lg font-extrabold">{skill.title}</h3></div></div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">Avval bilimingizni aniqlaymiz, so‘ng amaliy topshiriq va mavjud tashqi natijalaringizni qo‘shib, sizga mos tavsiyalarni shakllantiramiz.</p>
            <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-slate-700">10 ta diagnostik savol</span><span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-slate-700">Amaliy vazifa</span><span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-slate-700">Portfolio ixtiyoriy</span></div>
          </div>
          <div className="flex flex-col gap-3 lg:w-[300px]">
            <button type="button" onClick={()=>setAssessmentOpen(true)} className="flex min-h-[62px] items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#087d70] to-[#0b9b88] px-6 text-sm font-black shadow-[0_14px_38px_-15px_rgba(124,58,237,.8)] transition hover:brightness-110 active:scale-[.99]"><Sparkles size={19}/> DARAJAMNI ANIQLASH</button>
            <button type="button" onClick={()=>setDuelOpen(true)} className="flex min-h-[62px] items-center justify-center gap-3 rounded-2xl border border-[#d2e3de] bg-white/90 px-6 text-sm font-black text-slate-100 transition hover:border-[#0b9b88]/40 hover:bg-white/10 active:scale-[.99]"><Swords size={19}/> DUELNI BOSHLASH</button>
          </div>
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.08] pt-5 text-xs text-slate-500"><span className="inline-flex items-center gap-2"><Trophy size={14} className="text-amber-300"/> Har bir natija — rivojlanish uchun yangi boshlanish.</span><span>XP va mavjud Duel ma’lumotlari saqlanadi.</span></footer>
      </div>
    </main>
  );
}
