"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Brain, Check, Clock3, Headphones, LockKeyhole, Puzzle, RotateCcw, Sparkles, Swords, Volume2, X } from "lucide-react";
import SkillDuel from "@/app/lessons/experience-lab/SkillDuel";
import type { AssessmentTrack } from "@/app/lessons/experience-lab/assessment-bank";

type Plan = { track_id: AssessmentTrack; skill_name: string; purpose: string; current_level: string; target_level: string; daily_minutes: number; updated_at: string };
const tracks: { id: AssessmentTrack; title: string; short: string }[] = [
  { id: "english", title: "Ingliz tili", short: "EN" },
  { id: "russian", title: "Rus tili", short: "RU" },
  { id: "coding", title: "Dasturlash", short: "DEV" },
  { id: "cyber", title: "Kiberxavfsizlik", short: "CYBER" },
];
const listeningQuestions = {
  english: [
    { phrase: "I usually study in the evening.", meaning: "Men odatda kechqurun o‘qiyman.", choices: ["Men odatda kechqurun o‘qiyman.", "Men ertalab ishlayman.", "Men har kuni sayr qilaman.", "Men hozir uxlayapman."] },
    { phrase: "Could you repeat that, please?", meaning: "Iltimos, buni qaytara olasizmi?", choices: ["Iltimos, buni qaytara olasizmi?", "Qayerga ketyapsiz?", "Men tushlik qildim.", "Bu mening kitobim."] },
    { phrase: "The library closes at six.", meaning: "Kutubxona soat oltida yopiladi.", choices: ["Kutubxona soat oltida yopiladi.", "Do‘kon ertalab ochiladi.", "Dars soat yettida boshlanadi.", "Avtobus kechikdi."] },
    { phrase: "Learning a little every day makes a difference.", meaning: "Har kuni ozgina o‘rganish katta farq qiladi.", choices: ["Har kuni ozgina o‘rganish katta farq qiladi.", "Bugun havo juda sovuq.", "Men yangi telefon sotib oldim.", "Ular futbol o‘ynashyapti."] },
    { phrase: "Where is the nearest bus stop?", meaning: "Eng yaqin avtobus bekati qayerda?", choices: ["Eng yaqin avtobus bekati qayerda?", "Bugun qaysi kun?", "Sizga yordam kerakmi?", "Men uyga qaytdim."] },
  ],
  russian: [
    { phrase: "Я изучаю русский язык каждый день.", meaning: "Men har kuni rus tilini o‘rganaman.", choices: ["Men har kuni rus tilini o‘rganaman.", "Men bugun ishga bormayman.", "U kitob o‘qishni yaxshi ko‘radi.", "Biz ertaga uchrashamiz."] },
    { phrase: "Повторите, пожалуйста, ещё раз.", meaning: "Iltimos, yana bir marta takrorlang.", choices: ["Iltimos, yana bir marta takrorlang.", "Bugun juda yaxshi kun.", "Men sizni kutyapman.", "Bu mening do‘stim."] },
    { phrase: "Где находится ближайшая библиотека?", meaning: "Eng yaqin kutubxona qayerda joylashgan?", choices: ["Eng yaqin kutubxona qayerda joylashgan?", "Dars qachon tugaydi?", "Siz qayerda ishlaysiz?", "Men uyda dam olyapman."] },
    { phrase: "Мне нравится учиться новому.", meaning: "Men yangi narsalarni o‘rganishni yoqtiraman.", choices: ["Men yangi narsalarni o‘rganishni yoqtiraman.", "Men bugun kech qoldim.", "Ular maktabga ketishdi.", "Bu juda qiziqarli film."] },
    { phrase: "Во сколько начинается занятие?", meaning: "Mashg‘ulot soat nechada boshlanadi?", choices: ["Mashg‘ulot soat nechada boshlanadi?", "Siz qayerdan keldingiz?", "Men choy ichmoqchiman.", "Bugun yomg‘ir yog‘adi."] },
  ],
};
const pairs = ["Kitob", "Book", "Maqsad", "Goal", "Bilim", "Knowledge", "Do‘st", "Friend", "O‘rganish", "Learning", "G‘alaba", "Victory"];
const words = [
  { q: "“Knowledge” so‘zining o‘zbekcha ma’nosi?", a: "Bilim", opts: ["Bilim", "Maqsad", "Do‘st", "G‘alaba"] },
  { q: "“Maqsad” so‘zining inglizchasi?", a: "Goal", opts: ["Skill", "Goal", "Level", "Lesson"] },
  { q: "“Practice” so‘zining ma’nosi?", a: "Amaliyot", opts: ["Dam olish", "Amaliyot", "Sayohat", "Savol"] },
  { q: "“Improve” so‘zining ma’nosi?", a: "Yaxshilamoq", opts: ["Unutmoq", "Yaxshilamoq", "Boshlamoq", "Yopmoq"] },
];

function shuffle<T,>(items: T[]) { return [...items].sort(() => Math.random() - 0.5); }

export default function LearningGamesHub() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<"duel" | "listening" | "memory" | "words" | null>(null);
  const [listenIndex, setListenIndex] = useState(0);
  const [listenAnswer, setListenAnswer] = useState("");
  const [listenChecked, setListenChecked] = useState(false);
  const [listenScore, setListenScore] = useState(0);
  const [memoryCards, setMemoryCards] = useState(() => shuffle(pairs).map((value, index) => ({ id: index, value, matched: false })));
  const [memoryOpen, setMemoryOpen] = useState<number[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [wordAnswer, setWordAnswer] = useState("");
  const [wordChecked, setWordChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all(tracks.map(async (track) => {
      const response = await fetch(`/api/learning/plan?track=${track.id}`, { cache: "no-store" });
      if (!response.ok) return null;
      const data = await response.json();
      return data.plan as Plan | null;
    })).then((plans) => {
      if (alive) setPlan(plans.filter(Boolean).sort((a, b) => +new Date(b!.updated_at) - +new Date(a!.updated_at))[0] ?? null);
    }).catch(() => { if (alive) setPlan(null); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const track = plan?.track_id ?? "english";
  const title = tracks.find((item) => item.id === track)?.title ?? "Ingliz tili";
  const listenSet = track === "russian" ? listeningQuestions.russian : listeningQuestions.english;
  const listenQuestion = listenSet[listenIndex];
  const listeningAvailable = track === "english" || track === "russian";

  const cards = [
    { id: "duel" as const, title: "So‘nggi harf", subtitle: "Haqiqiy onlayn duel", tag: "ONLAYN", icon: Swords, art: "from-violet-500 via-indigo-500 to-blue-700", artText: "A ↔ Z", action: true },
    ...(listeningAvailable ? [{ id: "listening" as const, title: "Listening", subtitle: `${title} · tinglab tushunish`, tag: "AUDIO", icon: Headphones, art: "from-cyan-400 via-teal-500 to-emerald-700", artText: "♫", action: true }] : []),
    { id: "memory" as const, title: "Eslab-mosla", subtitle: "Xotira va juftliklar", tag: "BRAIN", icon: Brain, art: "from-amber-400 via-orange-500 to-rose-600", artText: "◈ ◇", action: true },
    { id: "words" as const, title: "So‘z topish", subtitle: "Lug‘atni mustahkamlang", tag: "VOCAB", icon: BookOpen, art: "from-fuchsia-500 via-purple-500 to-indigo-700", artText: "Aa", action: true },
    { id: "grammar" as const, title: "Grammatik ziyofat", subtitle: "Qoidalarni o‘yin bilan o‘rganing", tag: "SOON", icon: Puzzle, art: "from-emerald-400 via-green-600 to-teal-800", artText: "✓ ?", action: false },
    { id: "attack" as const, title: "So‘z hujumi", subtitle: "Tezlik va bilim sinovi", tag: "SOON", icon: Sparkles, art: "from-rose-500 via-pink-600 to-purple-800", artText: "✦!", action: false },
  ];

  const openGame = (id: string) => {
    if (!plan) return;
    if (id === "duel" || id === "listening" || id === "memory" || id === "words") setActiveGame(id);
  };
  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(listenQuestion.phrase);
    utterance.lang = track === "russian" ? "ru-RU" : "en-US";
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  };
  const closeGame = () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); setActiveGame(null); };

  return <section className="rounded-[24px] border border-white bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#10231e] sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-700 dark:text-emerald-300">ZIKRA · GAMIFICATION</p><h2 className="mt-1 text-xl font-black sm:text-2xl">O‘yinlar</h2><p className="mt-1 text-xs text-slate-500">{plan ? `${title} · ${plan.skill_name} ko‘nikmangizga mos o‘yinlar` : "Shaxsiy o‘quv rejangizga mos o‘yinlarni oching."}</p></div>
      {plan && <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{plan.current_level.split(" · ")[0]} → {plan.target_level.split(" · ")[0]}</span>}
    </div>
    {!plan && <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-300/15 dark:bg-emerald-400/5"><LockKeyhole className="shrink-0 text-emerald-700 dark:text-emerald-300"/><div><b className="block text-sm">O‘yinlar shaxsiy rejangizdan keyin ochiladi</b><p className="mt-1 text-xs text-slate-500">{loading ? "O‘quv rejangiz tekshirilmoqda…" : "Avval yo‘nalish va maqsadingizni belgilang."}</p></div></div>}
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => { const Icon = card.icon; const disabled = !plan || !card.action; return <button key={card.id} disabled={disabled} onClick={() => openGame(card.id)} className={`group overflow-hidden rounded-[20px] border border-slate-100 text-left transition dark:border-white/10 ${disabled ? "cursor-not-allowed opacity-70" : "hover:-translate-y-1 hover:shadow-xl"}`}>
        <div className={`relative flex h-32 items-center justify-between overflow-hidden bg-gradient-to-br ${card.art} px-5 text-white`}><div className="absolute -right-5 -top-10 h-36 w-36 rounded-full border-[18px] border-white/10"/><div className="absolute -bottom-10 left-1/3 h-28 w-28 rounded-full bg-white/10 blur-xl"/><span className="relative grid h-14 w-14 place-items-center rounded-2xl border border-white/25 bg-white/15 shadow-xl backdrop-blur"><Icon size={29}/></span><span className="relative mr-3 text-3xl font-black tracking-tight drop-shadow-lg">{card.artText}</span><span className="absolute right-3 top-3 rounded-full bg-black/15 px-2 py-1 text-[9px] font-black tracking-widest">{card.tag}</span></div>
        <div className="flex items-center justify-between gap-2 p-4"><div><b className="block text-sm">{card.title}</b><small className="mt-1 block text-[11px] text-slate-500">{card.subtitle}</small></div><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{disabled ? <LockKeyhole size={15}/> : <span className="text-lg">›</span>}</span></div>
      </button>; })}
    </div>

    {activeGame === "duel" && <div className="fixed inset-0 z-[150] overflow-y-auto bg-[#f4f8f7] dark:bg-[#071512]"><SkillDuel skill={title} onClose={closeGame}/></div>}
    {activeGame === "listening" && listeningAvailable && <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"><section className="w-full max-w-xl rounded-t-[28px] bg-white p-5 pb-8 shadow-2xl dark:bg-[#10231e] sm:rounded-[28px] sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">{title} · LISTENING</p><h3 className="mt-1 text-xl font-black">Eshitib, to‘g‘ri javobni tanlang</h3></div><button onClick={closeGame} aria-label="Yopish"><X/></button></div><div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-900 p-5 text-center text-white"><Headphones className="mx-auto" size={30}/><p className="mt-2 text-xs text-white/70">Savol {listenIndex + 1} / {listenSet.length}</p><button onClick={speak} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 font-bold text-emerald-800"><Volume2 size={18}/> Audioni tinglash</button><p className="mt-3 text-[10px] text-white/65">Audio qurilmangiz ovoz tizimi orqali ijro etiladi.</p></div><div className="mt-5 grid gap-2">{listenQuestion.choices.map((choice) => <button key={choice} disabled={listenChecked} onClick={() => { setListenAnswer(choice); setListenChecked(true); if (choice === listenQuestion.meaning) setListenScore((v) => v + 1); }} className={`min-h-12 rounded-xl border px-4 text-left text-sm font-semibold ${listenChecked && choice === listenQuestion.meaning ? "border-emerald-500 bg-emerald-50 text-emerald-800" : listenAnswer === choice ? "border-rose-300 bg-rose-50" : "border-slate-200 dark:border-white/10"}`}>{choice}{listenChecked && choice === listenQuestion.meaning && <Check className="ml-2 inline" size={16}/>}</button>)}</div>{listenChecked && <button onClick={() => { if (listenIndex + 1 < listenSet.length) { setListenIndex((v) => v + 1); setListenAnswer(""); setListenChecked(false); } else { setListenIndex(0); setListenAnswer(""); setListenChecked(false); setActiveGame(null); } }} className="mt-5 min-h-12 w-full rounded-xl bg-emerald-700 font-black text-white">{listenIndex + 1 < listenSet.length ? "Keyingi savol" : `Yakunlash · ${listenScore}/${listenSet.length}`}</button>}</section></div>}
    {activeGame === "memory" && <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><section className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl dark:bg-[#10231e]"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">XOTIRA O‘YINI</p><h3 className="text-xl font-black">Eslab-mosla</h3></div><button onClick={closeGame} aria-label="Yopish"><X/></button></div><p className="mt-2 text-xs text-slate-500">O‘zbekcha va inglizcha so‘z juftlarini toping.</p><div className="mt-5 grid grid-cols-3 gap-2">{memoryCards.map((card) => <button key={card.id} disabled={card.matched || memoryOpen.includes(card.id)} onClick={() => { if (memoryOpen.length === 1) { const first = memoryCards.find((item) => item.id === memoryOpen[0]); const next = [...memoryOpen, card.id]; setMemoryOpen(next); if (first && ((first.value === "Kitob" && card.value === "Book") || (first.value === "Book" && card.value === "Kitob") || (first.value === "Maqsad" && card.value === "Goal") || (first.value === "Goal" && card.value === "Maqsad") || (first.value === "Bilim" && card.value === "Knowledge") || (first.value === "Knowledge" && card.value === "Bilim") || (first.value === "Do‘st" && card.value === "Friend") || (first.value === "Friend" && card.value === "Do‘st") || (first.value === "O‘rganish" && card.value === "Learning") || (first.value === "Learning" && card.value === "O‘rganish") || (first.value === "G‘alaba" && card.value === "Victory") || (first.value === "Victory" && card.value === "G‘alaba"))) setMemoryCards((old) => old.map((item) => next.includes(item.id) ? { ...item, matched: true } : item)); setTimeout(() => setMemoryOpen([]), 700); } else setMemoryOpen([card.id]); }} className={`min-h-20 rounded-xl p-2 text-xs font-black transition ${card.matched ? "bg-emerald-100 text-emerald-800" : memoryOpen.includes(card.id) ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-400 dark:bg-white/5"}`}>{card.matched || memoryOpen.includes(card.id) ? card.value : "?"}</button>)}</div><div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span>{memoryCards.filter((card) => card.matched).length / 2} / 6 juftlik</span><button onClick={() => { setMemoryCards(shuffle(pairs).map((value, index) => ({ id: index, value, matched: false }))); setMemoryOpen([]); }} className="inline-flex items-center gap-1 font-bold text-emerald-700"><RotateCcw size={14}/> Qayta boshlash</button></div>{memoryCards.every((card) => card.matched) && <p className="mt-3 text-center font-bold text-emerald-700">Ajoyib! Barcha juftliklar topildi 🎉</p>}</section></div>}
    {activeGame === "words" && <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><section className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl dark:bg-[#10231e]"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">LUG‘AT SINOVI · {wordIndex + 1}/{words.length}</p><h3 className="text-xl font-black">So‘z topish</h3></div><button onClick={closeGame} aria-label="Yopish"><X/></button></div><p className="mt-6 text-lg font-extrabold">{words[wordIndex].q}</p><div className="mt-4 grid gap-2">{words[wordIndex].opts.map((option) => <button key={option} disabled={wordChecked} onClick={() => { setWordAnswer(option); setWordChecked(true); }} className={`min-h-12 rounded-xl border px-4 text-left text-sm font-bold ${wordChecked && option === words[wordIndex].a ? "border-emerald-500 bg-emerald-50 text-emerald-800" : wordAnswer === option ? "border-rose-300 bg-rose-50" : "border-slate-200 dark:border-white/10"}`}>{option}</button>)}</div>{wordChecked && <button onClick={() => { if (wordIndex < words.length - 1) { setWordIndex((v) => v + 1); setWordAnswer(""); setWordChecked(false); } else { setWordIndex(0); setWordAnswer(""); setWordChecked(false); setActiveGame(null); } }} className="mt-5 min-h-12 w-full rounded-xl bg-emerald-700 font-black text-white">Davom etish</button>}</section></div>}
  </section>;
}
