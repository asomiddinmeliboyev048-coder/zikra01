"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Code2, Clock3, Compass, Languages, PlayCircle, ShieldCheck, Sparkles, Target } from "lucide-react";
import type { AssessmentTrack } from "./assessment-bank";

export type LearningPlanInput = {
  trackId: AssessmentTrack;
  purpose: string;
  currentLevel: string;
  targetLevel: string;
  dailyMinutes: number;
  targetDate: string;
  learningStyle: "video" | "practice" | "reading" | "mixed";
  interests: string[];
};

type Props = { onStart: (track: AssessmentTrack, plan: LearningPlanInput) => void };
const tracks: {id:AssessmentTrack;title:string;desc:string;icon:typeof BookOpen;tag:string}[] = [
  {id:"english",title:"Ingliz tili",desc:"Muloqot, grammatika, tinglash va lug‘at",icon:Languages,tag:"ENGLISH"},
  {id:"russian",title:"Rus tili",desc:"Kundalik suhbat va ruscha fikrlash",icon:BookOpen,tag:"РУССКИЙ"},
  {id:"coding",title:"Dasturlash",desc:"Kod, algoritmlar va real loyihalar",icon:Code2,tag:"PROGRAMMING"},
  {id:"cyber",title:"Kiberxavfsizlik",desc:"Xavfsizlik, tahlil va himoya",icon:ShieldCheck,tag:"CYBERSECURITY"},
];
const levels: Record<AssessmentTrack,string[]> = {
  english:["A1 · Beginner","A2 · Elementary","B1 · Intermediate","B2 · Upper-intermediate","C1 · Advanced","C2 · Proficient"],
  russian:["A1 · Начальный","A2 · Элементарный","B1 · Средний","B2 · Выше среднего","C1 · Продвинутый","C2 · В совершенстве"],
  coding:["Boshlang‘ich","Asosiy","O‘rta","Yaxshi","Ilg‘or","Ekspert"],
  cyber:["Boshlang‘ich","Asosiy","O‘rta","Yaxshi","Ilg‘or","Ekspert"],
};
const goals = [
  {id:"career",label:"Kasb va karyera",desc:"Ish, amaliyot yoki yangi kasb"},
  {id:"study",label:"O‘qish va ta’lim",desc:"Universitet yoki mustaqil ta’lim"},
  {id:"certificate",label:"Sertifikat olish",desc:"Imtihon va xalqaro daraja"},
  {id:"personal",label:"Shaxsiy rivojlanish",desc:"O‘zim uchun yangi bilim"},
];
const styles = [
  {id:"mixed",label:"Aralash usul",desc:"Video + amaliyot + matn",icon:Sparkles},
  {id:"practice",label:"Amaliy mashqlar",desc:"Ko‘proq bajarib o‘rganaman",icon:Target},
  {id:"video",label:"Video darslar",desc:"Ko‘rib va tinglab o‘rganaman",icon:PlayCircle},
  {id:"reading",label:"Matn va qo‘llanmalar",desc:"O‘qib, yozib o‘rganaman",icon:BookOpen},
] as const;

export default function LearningOnboarding({onStart}:Props) {
  const [step,setStep]=useState(0);
  const [track,setTrack]=useState<AssessmentTrack>("english");
  const [purpose,setPurpose]=useState("career");
  const [currentLevel,setCurrentLevel]=useState("A1 · Beginner");
  const [targetLevel,setTargetLevel]=useState("B1 · Intermediate");
  const [dailyMinutes,setDailyMinutes]=useState(30);
  const [learningStyle,setLearningStyle]=useState<LearningPlanInput["learningStyle"]>("mixed");
  const [targetDate,setTargetDate]=useState("");
  const [interests,setInterests]=useState<string[]>([]);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const trackInfo=tracks.find(x=>x.id===track)!;
  const trackLevels=levels[track];
  const currentIndex=trackLevels.findIndex(x=>x===currentLevel);
  const targetIndex=trackLevels.findIndex(x=>x===targetLevel);
  const availableTargets=trackLevels.filter((_,i)=>i>=Math.max(0,currentIndex));
  const interestOptions=useMemo(()=>track==="english"||track==="russian"?["Speaking","Listening","Reading","Writing","Grammar","Vocabulary"]:track==="coding"?["Frontend","Backend","Python","JavaScript","Algorithms","Projects"]:["Network security","Web security","Linux","SOC / SIEM","Ethical hacking","Cryptography"],[track]);

  const changeTrack=(id:AssessmentTrack)=>{setTrack(id);setCurrentLevel(levels[id][0]);setTargetLevel(levels[id][Math.min(2,levels[id].length-1)]);setInterests([]);};
  const next=()=>{setError("");if(step===1&&targetIndex<currentIndex){setError("Maqsad darajasi hozirgi taxminiy darajadan past bo‘lmasligi kerak.");return;}setStep(s=>Math.min(3,s+1));};
  const submit=async()=>{
    setSaving(true);setError("");
    const plan:LearningPlanInput={trackId:track,purpose,currentLevel,targetLevel,dailyMinutes,learningStyle,targetDate,interests};
    try{
      const response=await fetch("/api/learning/plan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(plan)});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"O‘quv maqsadini saqlab bo‘lmadi.");
      onStart(track,plan);
    }catch(e){setError(e instanceof Error?e.message:"Tarmoq xatosi. Qayta urinib ko‘ring.");}
    finally{setSaving(false);}
  };

  const steps=["Yo‘nalish","Maqsad","Reja","Tayyor"];
  return <main className="relative min-h-[calc(100dvh-5rem)] w-full overflow-hidden bg-[#f4f8f7] px-4 py-7 text-[#102321] sm:px-7 sm:py-10 lg:px-12">
    <div aria-hidden className="pointer-events-none absolute -left-40 top-0 -z-0 h-[34rem] w-[34rem] rounded-full bg-[#d9d1ff]/55 blur-[110px]"/>
    <div aria-hidden className="pointer-events-none absolute -right-40 top-1/3 -z-0 h-[34rem] w-[34rem] rounded-full bg-[#b8eee1]/60 blur-[110px]"/>
    <div className="relative mx-auto w-full max-w-[1320px]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#dce9e5] bg-white/80 px-4 py-2 text-[10px] font-black tracking-[.18em] text-[#087d70]"><Compass size={15}/> ZIKRA · SHAXSIY O‘QUV YO‘LI</div>
        <span className="text-xs font-semibold text-slate-500">Bir marta sozlang — o‘z yo‘lingizda rivojlaning</span>
      </header>
      <section className="mt-9 grid items-center gap-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
        <div className="max-w-xl">
          <p className="text-xs font-black uppercase tracking-[.22em] text-[#087d70]">Siz uchun maxsus reja</p>
          <h1 className="mt-4 text-[clamp(2.65rem,6vw,5.5rem)] font-black leading-[.98] tracking-[-.06em]">O‘rganish yo‘lingizni <span className="bg-gradient-to-r from-violet-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">birgalikda</span> quramiz.</h1>
          <p className="mt-6 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">Zikra sizni tayyor, hammaga bir xil kursga joylamaydi. Maqsadingiz, vaqtingiz va hozirgi bilimingizni o‘rganib, sizga mos bilim xaritasini tuzadi.</p>
          <div className="mt-7 grid grid-cols-3 gap-3">
            {[["01","Sizni taniymiz"],["02","Darajani tekshiramiz"],["03","Xaritani tuzamiz"]].map(([n,t])=><div key={n} className="border-l-2 border-[#0b9b88]/35 pl-3"><p className="text-[10px] font-black text-[#087d70]">{n}</p><p className="mt-1 text-xs font-bold text-slate-700">{t}</p></div>)}
          </div>
        </div>
        <section className="overflow-hidden rounded-[30px] border border-white bg-white/90 shadow-[0_30px_90px_-45px_rgba(16,35,33,.28)] backdrop-blur-xl">
          <div className="border-b border-[#e6efeb] px-5 pb-5 pt-5 sm:px-8">
            <div className="flex items-center justify-between gap-3"><p className="text-xs font-black uppercase tracking-[.16em] text-slate-500">Shaxsiy sozlash</p><span className="text-xs font-bold text-[#087d70]">{step+1} / 4</span></div>
            <div className="mt-4 grid grid-cols-4 gap-2">{steps.map((s,i)=><div key={s}><div className={"h-1.5 rounded-full "+(i<=step?"bg-[#0b9b88]":"bg-[#e7efec]")}/><p className={"mt-2 text-[10px] font-bold "+(i===step?"text-[#087d70]":"text-slate-400")}>{s}</p></div>)}</div>
          </div>
          <div className="min-h-[390px] px-5 py-6 sm:px-8 sm:py-8">
            {step===0&&<><h2 className="text-2xl font-black">Nimani o‘rganmoqchisiz?</h2><p className="mt-2 text-sm text-slate-500">Birinchi shaxsiy xaritangiz uchun yo‘nalishni tanlang.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{tracks.map(item=>{const Icon=item.icon;const active=track===item.id;return <button key={item.id} onClick={()=>changeTrack(item.id)} className={"flex min-h-[105px] items-start gap-3 rounded-2xl border p-4 text-left transition "+(active?"border-[#0b9b88] bg-[#eaf7f3] ring-2 ring-[#0b9b88]/10":"border-[#e4ece8] bg-white hover:border-[#b9d8ce]")}><span className={"grid h-10 w-10 shrink-0 place-items-center rounded-xl "+(active?"bg-[#0b9b88] text-white":"bg-[#edf4f1] text-[#087d70]")}><Icon size={20}/></span><span><span className="block font-extrabold">{item.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{item.desc}</span></span>{active&&<Check className="ml-auto shrink-0 text-[#087d70]" size={18}/>}</button>})}</div></>}
            {step===1&&<><h2 className="text-2xl font-black">Maqsadingiz qanday?</h2><p className="mt-2 text-sm text-slate-500">Taxminiy hozirgi darajangiz va erishmoqchi bo‘lgan pog‘onangizni belgilang. Test keyin tekshiradi.</p><div className="mt-5 grid gap-2 sm:grid-cols-2">{goals.map(g=><button key={g.id} onClick={()=>setPurpose(g.id)} className={"rounded-xl border p-3 text-left "+(purpose===g.id?"border-[#0b9b88] bg-[#eaf7f3]":"border-[#e4ece8] bg-white")}><span className="block text-sm font-extrabold">{g.label}</span><span className="mt-1 block text-xs text-slate-500">{g.desc}</span></button>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">Hozirgi taxminiy darajangiz<select value={currentLevel} onChange={e=>{setCurrentLevel(e.target.value);if(trackLevels.indexOf(targetLevel)<trackLevels.indexOf(e.target.value))setTargetLevel(trackLevels[Math.min(trackLevels.length-1,trackLevels.indexOf(e.target.value)+1)]);}} className="mt-2 min-h-12 w-full rounded-xl border border-[#dce9e5] bg-white px-3 text-sm text-[#102321]">{trackLevels.map(l=><option key={l}>{l}</option>)}</select></label><label className="text-xs font-bold text-slate-600">Qaysi darajaga chiqmoqchisiz?<select value={targetLevel} onChange={e=>setTargetLevel(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#dce9e5] bg-white px-3 text-sm text-[#102321]">{availableTargets.map(l=><option key={l}>{l}</option>)}</select></label></div></>}
            {step===2&&<><h2 className="text-2xl font-black">Sizga mos jadval tuzamiz.</h2><p className="mt-2 text-sm text-slate-500">O‘rganish sur’ati va sizga qulay usulni tanlang.</p><p className="mt-6 text-xs font-bold text-slate-600">Kuniga qancha vaqt ajratasiz?</p><div className="mt-3 grid grid-cols-4 gap-2">{[15,30,45,60].map(n=><button key={n} onClick={()=>setDailyMinutes(n)} className={"rounded-xl border py-3 text-sm font-black "+(dailyMinutes===n?"border-[#0b9b88] bg-[#eaf7f3] text-[#087d70]":"border-[#e4ece8] bg-white text-slate-600")}>{n} daq.</button>)}</div><p className="mt-6 text-xs font-bold text-slate-600">Qanday o‘rganish sizga qulay?</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{styles.map(s=>{const Icon=s.icon;const active=learningStyle===s.id;return <button key={s.id} onClick={()=>setLearningStyle(s.id)} className={"flex items-center gap-3 rounded-xl border p-3 text-left "+(active?"border-[#0b9b88] bg-[#eaf7f3]":"border-[#e4ece8] bg-white")}><Icon className="shrink-0 text-[#087d70]" size={19}/><span><span className="block text-sm font-bold">{s.label}</span><span className="block text-xs text-slate-500">{s.desc}</span></span></button>})}</div><label className="mt-5 block text-xs font-bold text-slate-600">Maqsad sanasi (ixtiyoriy)<input type="date" value={targetDate} onChange={e=>setTargetDate(e.target.value)} min={new Date().toISOString().slice(0,10)} className="mt-2 min-h-12 w-full rounded-xl border border-[#dce9e5] bg-white px-3 text-sm"/></label><p className="mt-5 text-xs font-bold text-slate-600">Qaysi mavzular sizni qiziqtiradi? (ixtiyoriy)</p><div className="mt-3 flex flex-wrap gap-2">{interestOptions.map(v=>{const active=interests.includes(v);return <button key={v} onClick={()=>setInterests(old=>active?old.filter(x=>x!==v):[...old,v])} className={"rounded-full border px-3 py-2 text-xs font-bold "+(active?"border-[#0b9b88] bg-[#eaf7f3] text-[#087d70]":"border-[#dce9e5] bg-white text-slate-600")}>{v}</button>})}</div></>}
            {step===3&&<><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e6f7f1] text-[#087d70]"><Sparkles size={25}/></div><h2 className="mt-4 text-center text-2xl font-black">Shaxsiy xaritangizga tayyormiz.</h2><p className="mx-auto mt-2 max-w-md text-center text-sm text-slate-500">Avval qisqa diagnostika o‘tkazamiz. Natijadan so‘ng maqsadingizga mos bosqichlar va mashqlar xaritasi tuziladi.</p><div className="mt-6 rounded-2xl border border-[#dce9e5] bg-[#f7fbf9] p-4"><div className="flex items-center justify-between"><span className="text-xs text-slate-500">Yo‘nalish</span><strong className="text-sm">{trackInfo.title}</strong></div><div className="mt-3 flex items-center justify-between"><span className="text-xs text-slate-500">Maqsad</span><strong className="text-sm">{goals.find(x=>x.id===purpose)?.label}</strong></div><div className="mt-3 flex items-center justify-between"><span className="text-xs text-slate-500">Daraja</span><strong className="text-right text-xs">{currentLevel.split(" · ")[0]} → {targetLevel.split(" · ")[0]}</strong></div><div className="mt-3 flex items-center justify-between"><span className="text-xs text-slate-500">Kunlik vaqt</span><strong className="text-sm">{dailyMinutes} daqiqa</strong></div><div className="mt-3 flex items-center justify-between"><span className="text-xs text-slate-500">O‘rganish usuli</span><strong className="text-sm">{styles.find(x=>x.id===learningStyle)?.label}</strong></div></div></>}
            {error&&<p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[#e6efeb] bg-[#fbfdfc] px-5 py-4 sm:px-8"><button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0||saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-slate-500 disabled:opacity-30"><ArrowLeft size={16}/> Orqaga</button>{step<3?<button onClick={next} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#087d70] px-6 text-sm font-black text-white shadow-lg shadow-[#087d70]/20">Davom etish <ArrowRight size={16}/></button>:<button onClick={submit} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#087d70] to-[#0b9b88] px-6 text-sm font-black text-white shadow-lg shadow-[#087d70]/20 disabled:opacity-50">{saving?"Saqlanmoqda…":"Diagnostikani boshlash"} <ArrowRight size={16}/></button>}</div>
        </section>
      </section>
      <p className="mt-7 text-center text-[11px] text-slate-500">Sizning javoblaringiz shaxsiy o‘quv rejangizni tuzish uchun ishlatiladi. Rejangizni keyin o‘zgartirishingiz mumkin.</p>
    </div>
  </main>;
}
