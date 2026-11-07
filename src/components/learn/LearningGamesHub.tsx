"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Brain, Check, Clock3, Headphones, LockKeyhole, RotateCcw, Sparkles, Swords, Volume2, X } from "lucide-react";
import SkillDuel from "@/app/lessons/experience-lab/SkillDuel";
import { assessmentBank, checkPracticalAnswer, practicalTasks, type AssessmentTrack } from "@/app/lessons/experience-lab/assessment-bank";

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
  const [activeGame, setActiveGame] = useState<"duel" | "listening" | "memory" | "words" | "dictionary" | "daily" | "grammar" | "attack" | null>(null);
  const [vocabQuery, setVocabQuery] = useState("");
  const [vocabEntry, setVocabEntry] = useState<any>(null);
  const [vocabTranslation, setVocabTranslation] = useState("");
  const [vocabLoading, setVocabLoading] = useState(false);
  const [vocabError, setVocabError] = useState("");
  const [spokenText, setSpokenText] = useState("");
  const [savedLater, setSavedLater] = useState<string[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [challengeResult, setChallengeResult] = useState<boolean | null>(null);
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

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("zikra-vocabulary-later") || "[]");
      if (Array.isArray(saved)) setSavedLater(saved.filter((word): word is string => typeof word === "string"));
    } catch {}
  }, []);

  const track = plan?.track_id ?? "english";
  const title = tracks.find((item) => item.id === track)?.title ?? "Ingliz tili";
  const listenSet = track === "russian" ? listeningQuestions.russian : listeningQuestions.english;
  const listenQuestion = listenSet[listenIndex];
  const dailyWord = (track === "russian" ? ["привет", "спасибо", "пожалуйста", "сегодня", "работа", "встреча", "покупка"] : ["improve", "opportunity", "schedule", "comfortable", "decision", "available", "experience"])[new Date().getDate() % 7];
  const listeningAvailable = track === "english" || track === "russian";

  const languageTrack = track === "english" || track === "russian";
  const cards = [
    { id: "duel" as const, title: "So‘nggi harf", subtitle: "Haqiqiy onlayn duel", tag: "ONLAYN", image: "/learn-games/duel.svg", icon: Swords, art: "from-violet-500 via-indigo-500 to-blue-700", artText: "A ↔ Z", action: true },
    ...(listeningAvailable ? [{ id: "listening" as const, title: "Listening", subtitle: `${title} · tinglab tushunish`, tag: "AUDIO", image: "/learn-games/listening.svg", icon: Headphones, art: "from-cyan-400 via-teal-500 to-emerald-700", artText: "♫", action: true }] : []),
    { id: "memory" as const, title: "Eslab-mosla", subtitle: "Xotira va juftliklar", tag: "BRAIN", image: "/learn-games/memory.svg", icon: Brain, art: "from-amber-400 via-orange-500 to-rose-600", artText: "◈ ◇", action: true },
    { id: "words" as const, title: "So‘z topish", subtitle: "Lug‘atni mustahkamlang", tag: "VOCAB", image: "/learn-games/words.svg", icon: BookOpen, art: "from-fuchsia-500 via-purple-500 to-indigo-700", artText: "Aa", action: true },
    ...(languageTrack ? [{ id: "dictionary" as const, title: "Lug‘at", subtitle: "So‘z qidiring, tinglang va talaffuz qiling", tag: "DICTIONARY", image: "/learn-games/dictionary.svg", icon: BookOpen, art: "from-sky-400 via-cyan-500 to-teal-700", artText: "A–Z", action: true }, { id: "daily" as const, title: "Har kun yangi so‘z", subtitle: "Kundalik hayotda ishlatiladigan so‘zlar", tag: "DAILY", image: "/learn-games/daily.svg", icon: Sparkles, art: "from-amber-400 via-orange-500 to-rose-600", artText: "1 / DAY", action: true }] : [{ id: "grammar" as const, title: "Bilim sinovi", subtitle: `${title} bo‘yicha qisqa test`, tag: "QUIZ", image: "/learn-games/dictionary.svg", icon: BookOpen, art: "from-emerald-400 via-green-600 to-teal-800", artText: "✓ ?", action: true }, { id: "attack" as const, title: "Kunlik chaqiriq", subtitle: "Tanlagan ko‘nikmangiz uchun mashq", tag: "DAILY", image: "/learn-games/daily.svg", icon: Sparkles, art: "from-rose-500 via-pink-600 to-purple-800", artText: "✦!", action: true }]),
  ];

  const openGame = (id: string) => {
    if (!plan) return;
    if (id === "duel" || id === "listening" || id === "memory" || id === "words" || id === "dictionary" || id === "daily" || id === "grammar" || id === "attack") { if (id === "daily") setVocabQuery("improve"); setActiveGame(id); }
  };
  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(listenQuestion.phrase);
    utterance.lang = track === "russian" ? "ru-RU" : "en-US";
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  };
  const lookupVocabulary = async (word: string) => {
    const clean = word.trim().toLowerCase();
    if (!clean) return;
    setVocabLoading(true); setVocabError(""); setVocabEntry(null); setVocabQuery(clean); setSpokenText("");
    try {
      const lang = track === "russian" ? "ru" : "en";
      const translationRequest = fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=${lang}|uz`).then((r) => r.ok ? r.json() : null).then((d) => d?.responseData?.translatedText ?? "");
      if (lang === "en") {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`);
        if (!response.ok) throw new Error("Bu so‘z topilmadi. Boshqa yozilish bilan qidirib ko‘ring.");
        const data = await response.json();
        setVocabEntry(data[0] ?? null);
      } else {
        setVocabEntry({ word: clean, phonetic: "", phonetics: [], meanings: [] });
      }
      setVocabTranslation(await translationRequest);
    } catch (error) { setVocabError(error instanceof Error ? error.message : "Lug‘atga ulanib bo‘lmadi."); }
    finally { setVocabLoading(false); }
  };
  const pronounceWord = (word: string, audio?: string) => {
    if (audio) { const player = new Audio(audio); void player.play().catch(() => {}); return; }
    if ("speechSynthesis" in window) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(word); utterance.lang = track === "russian" ? "ru-RU" : "en-US"; utterance.rate = 0.82; window.speechSynthesis.speak(utterance); }
  };
  const tryPronunciation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setVocabError("Brauzeringiz ovoz orqali talaffuzni tekshirishni qo‘llab-quvvatlamaydi. Chrome’da urinib ko‘ring."); return; }
    const recognition = new SpeechRecognition(); recognition.lang = track === "russian" ? "ru-RU" : "en-US"; recognition.interimResults = false; recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => setSpokenText(event.results?.[0]?.[0]?.transcript ?? "");
    recognition.onerror = () => setVocabError("Mikrofonga ruxsat berilmadi yoki ovoz aniqlanmadi.");
    recognition.start();
  };
  const saveForLater = (word: string) => {
    const next = Array.from(new Set([...savedLater, word]));
    setSavedLater(next);
    try { localStorage.setItem("zikra-vocabulary-later", JSON.stringify(next)); } catch {}
  };
  useEffect(() => {
    if (activeGame === "daily") void lookupVocabulary(dailyWord);
  }, [activeGame, dailyWord]);

  const closeGame = () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); setActiveGame(null); };

  return <section className="rounded-[24px] border border-white bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#10231e] sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-700 dark:text-emerald-300">ZIKRA · GAMIFICATION</p><h2 className="mt-1 text-xl font-black sm:text-2xl">O‘yinlar</h2><p className="mt-1 text-xs text-slate-500">{plan ? `${title} · ${plan.skill_name} ko‘nikmangizga mos o‘yinlar` : "Shaxsiy o‘quv rejangizga mos o‘yinlarni oching."}</p></div>
      {plan && <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{plan.current_level.split(" · ")[0]} → {plan.target_level.split(" · ")[0]}</span>}
    </div>
    {!plan && <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-300/15 dark:bg-emerald-400/5"><LockKeyhole className="shrink-0 text-emerald-700 dark:text-emerald-300"/><div><b className="block text-sm">O‘yinlar shaxsiy rejangizdan keyin ochiladi</b><p className="mt-1 text-xs text-slate-500">{loading ? "O‘quv rejangiz tekshirilmoqda…" : "Avval yo‘nalish va maqsadingizni belgilang."}</p></div></div>}
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => { const disabled = !plan || !card.action; return <button key={card.id} disabled={disabled} onClick={() => openGame(card.id)} className={`group overflow-hidden rounded-[20px] border border-slate-100 text-left transition dark:border-white/10 ${disabled ? "cursor-not-allowed opacity-70" : "hover:-translate-y-1 hover:shadow-xl"}`}>
        <div className="relative h-36 overflow-hidden bg-gradient-to-br from-emerald-800 to-teal-600"><img src={card.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"/><span className="absolute right-3 top-3 rounded-full border border-white/25 bg-black/25 px-2.5 py-1.5 text-[9px] font-black tracking-widest text-white backdrop-blur">{card.tag}</span></div>
        <div className="flex items-center justify-between gap-2 p-4"><div><b className="block text-sm">{card.title}</b><small className="mt-1 block text-[11px] text-slate-500">{card.subtitle}</small></div><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{disabled ? <LockKeyhole size={15}/> : <span className="text-lg">›</span>}</span></div>
      </button>; })}
    </div>

    {activeGame === "grammar" && <div className="fixed inset-0 z-[150] grid place-items-center overflow-y-auto bg-[#071512]/70 p-4 backdrop-blur-md"><section className="w-full max-w-xl rounded-[28px] bg-white p-5 shadow-2xl dark:bg-[#10231e] sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">ZIKRA · QUIZ</p><h3 className="mt-1 text-xl font-black">{title} bilim sinovi</h3></div><button onClick={closeGame} aria-label="Yopish"><X/></button></div><p className="mt-5 text-xs font-bold text-slate-400">Savol {quizIndex+1} / {assessmentBank[track].length} · {quizScore} to‘g‘ri</p><h4 className="mt-2 text-lg font-extrabold">{assessmentBank[track][quizIndex].prompt}</h4><div className="mt-4 grid gap-2">{assessmentBank[track][quizIndex].choices.map((choice,i)=><button key={choice} disabled={quizAnswer!==null} onClick={()=>{setQuizAnswer(i);if(i===assessmentBank[track][quizIndex].answer)setQuizScore(v=>v+1)}} className={`min-h-12 rounded-xl border px-4 text-left text-sm font-semibold dark:border-white/10 ${quizAnswer===i?(i===assessmentBank[track][quizIndex].answer?"border-emerald-500 bg-emerald-50 text-emerald-800":"border-rose-300 bg-rose-50 text-rose-800"):"border-slate-200"}`}>{choice}</button>)}</div>{quizAnswer!==null && <button onClick={()=>{if(quizIndex+1<assessmentBank[track].length){setQuizIndex(v=>v+1);setQuizAnswer(null)}else{setQuizIndex(0);setQuizAnswer(null);setQuizScore(0);setActiveGame(null)}}} className="mt-5 min-h-12 w-full rounded-xl bg-emerald-700 font-black text-white">{quizIndex+1<assessmentBank[track].length?"Keyingi savol":`Yakunlash · ${quizScore}/${assessmentBank[track].length}`}</button>}</section></div>}
    {activeGame === "attack" && <div className="fixed inset-0 z-[150] grid place-items-center overflow-y-auto bg-[#071512]/70 p-4 backdrop-blur-md"><section className="w-full max-w-xl rounded-[28px] bg-white p-5 shadow-2xl dark:bg-[#10231e] sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">ZIKRA · DAILY CHALLENGE</p><h3 className="mt-1 text-xl font-black">Kunlik chaqiriq</h3></div><button onClick={closeGame} aria-label="Yopish"><X/></button></div><p className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-950 dark:bg-emerald-400/10 dark:text-emerald-100">{practicalTasks[track].prompt}</p><p className="mt-3 text-xs text-slate-500">Maslahat: {practicalTasks[track].hint}</p><textarea value={challengeAnswer} onChange={e=>{setChallengeAnswer(e.target.value);setChallengeResult(null)}} rows={4} placeholder="Javobingizni yozing..." className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-white/5"/><button onClick={()=>setChallengeResult(checkPracticalAnswer(track,challengeAnswer))} disabled={challengeAnswer.trim().length<3} className="mt-3 min-h-12 w-full rounded-xl bg-emerald-700 font-black text-white disabled:opacity-40">Javobni tekshirish</button>{challengeResult!==null && <p className={`mt-3 rounded-xl p-3 text-sm font-bold ${challengeResult?"bg-emerald-50 text-emerald-800":"bg-amber-50 text-amber-800"}`}>{challengeResult?"Ajoyib! Javobingiz to‘g‘ri.":"Yana bir bor urinib ko‘ring yoki maslahatdan foydalaning."}</p>}</section></div>}
    {activeGame === "duel" && <div className="fixed inset-0 z-[150] overflow-y-auto bg-[#f4f8f7] dark:bg-[#071512]"><SkillDuel skill={title} onClose={closeGame}/></div>}
    {activeGame === "listening" && listeningAvailable && <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"><section className="w-full max-w-xl rounded-t-[28px] bg-white p-5 pb-8 shadow-2xl dark:bg-[#10231e] sm:rounded-[28px] sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">{title} · LISTENING</p><h3 className="mt-1 text-xl font-black">Eshitib, to‘g‘ri javobni tanlang</h3></div><button onClick={closeGame} aria-label="Yopish"><X/></button></div><div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-900 p-5 text-center text-white"><Headphones className="mx-auto" size={30}/><p className="mt-2 text-xs text-white/70">Savol {listenIndex + 1} / {listenSet.length}</p><button onClick={speak} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 font-bold text-emerald-800"><Volume2 size={18}/> Audioni tinglash</button><p className="mt-3 text-[10px] text-white/65">Audio qurilmangiz ovoz tizimi orqali ijro etiladi.</p></div><div className="mt-5 grid gap-2">{listenQuestion.choices.map((choice) => <button key={choice} disabled={listenChecked} onClick={() => { setListenAnswer(choice); setListenChecked(true); if (choice === listenQuestion.meaning) setListenScore((v) => v + 1); }} className={`min-h-12 rounded-xl border px-4 text-left text-sm font-semibold ${listenChecked && choice === listenQuestion.meaning ? "border-emerald-500 bg-emerald-50 text-emerald-800" : listenAnswer === choice ? "border-rose-300 bg-rose-50" : "border-slate-200 dark:border-white/10"}`}>{choice}{listenChecked && choice === listenQuestion.meaning && <Check className="ml-2 inline" size={16}/>}</button>)}</div>{listenChecked && <button onClick={() => { if (listenIndex + 1 < listenSet.length) { setListenIndex((v) => v + 1); setListenAnswer(""); setListenChecked(false); } else { setListenIndex(0); setListenAnswer(""); setListenChecked(false); setActiveGame(null); } }} className="mt-5 min-h-12 w-full rounded-xl bg-emerald-700 font-black text-white">{listenIndex + 1 < listenSet.length ? "Keyingi savol" : `Yakunlash · ${listenScore}/${listenSet.length}`}</button>}</section></div>}
    {activeGame === "memory" && <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><section className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl dark:bg-[#10231e]"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">XOTIRA O‘YINI</p><h3 className="text-xl font-black">Eslab-mosla</h3></div><button onClick={closeGame} aria-label="Yopish"><X/></button></div><p className="mt-2 text-xs text-slate-500">O‘zbekcha va inglizcha so‘z juftlarini toping.</p><div className="mt-5 grid grid-cols-3 gap-2">{memoryCards.map((card) => <button key={card.id} disabled={card.matched || memoryOpen.includes(card.id)} onClick={() => { if (memoryOpen.length === 1) { const first = memoryCards.find((item) => item.id === memoryOpen[0]); const next = [...memoryOpen, card.id]; setMemoryOpen(next); if (first && ((first.value === "Kitob" && card.value === "Book") || (first.value === "Book" && card.value === "Kitob") || (first.value === "Maqsad" && card.value === "Goal") || (first.value === "Goal" && card.value === "Maqsad") || (first.value === "Bilim" && card.value === "Knowledge") || (first.value === "Knowledge" && card.value === "Bilim") || (first.value === "Do‘st" && card.value === "Friend") || (first.value === "Friend" && card.value === "Do‘st") || (first.value === "O‘rganish" && card.value === "Learning") || (first.value === "Learning" && card.value === "O‘rganish") || (first.value === "G‘alaba" && card.value === "Victory") || (first.value === "Victory" && card.value === "G‘alaba"))) setMemoryCards((old) => old.map((item) => next.includes(item.id) ? { ...item, matched: true } : item)); setTimeout(() => setMemoryOpen([]), 700); } else setMemoryOpen([card.id]); }} className={`min-h-20 rounded-xl p-2 text-xs font-black transition ${card.matched ? "bg-emerald-100 text-emerald-800" : memoryOpen.includes(card.id) ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-400 dark:bg-white/5"}`}>{card.matched || memoryOpen.includes(card.id) ? card.value : "?"}</button>)}</div><div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span>{memoryCards.filter((card) => card.matched).length / 2} / 6 juftlik</span><button onClick={() => { setMemoryCards(shuffle(pairs).map((value, index) => ({ id: index, value, matched: false }))); setMemoryOpen([]); }} className="inline-flex items-center gap-1 font-bold text-emerald-700"><RotateCcw size={14}/> Qayta boshlash</button></div>{memoryCards.every((card) => card.matched) && <p className="mt-3 text-center font-bold text-emerald-700">Ajoyib! Barcha juftliklar topildi 🎉</p>}</section></div>}
    {(activeGame === "dictionary" || activeGame === "daily") && <div className="fixed inset-0 z-[150] overflow-y-auto bg-[#071512]/70 p-3 backdrop-blur-md sm:grid sm:place-items-center sm:p-6"><section className="mx-auto w-full max-w-2xl rounded-[28px] border border-emerald-100 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#10231e] sm:p-7"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-700 dark:text-emerald-300">ZIKRA · VOCABULARY</p><h3 className="mt-1 text-2xl font-black">{activeGame === "daily" ? "Bugungi yangi so‘z" : "Inglizcha lug‘at"}</h3></div><button onClick={closeGame} aria-label="Yopish" className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-white/10"><X/></button></div><p className="mt-2 text-sm text-slate-500">So‘zni qidiring, talaffuzini tinglang va o‘zingiz aytib ko‘ring.</p>{activeGame === "daily" && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 dark:bg-amber-400/10 dark:text-amber-100">Bugungi so‘z: {dailyWord}</p>}<form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); void lookupVocabulary(vocabQuery); }}><input value={vocabQuery} onChange={(e) => setVocabQuery(e.target.value)} placeholder="Masalan: improve, opportunity..." className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-white/5"/><button className="rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white">Qidirish</button></form>{activeGame === "daily" && <div className="mt-4 flex flex-wrap gap-2">{(track === "russian" ? ["привет","спасибо","пожалуйста","сегодня","работа"] : ["improve","opportunity","schedule","comfortable","decision"]).map((word) => <button key={word} onClick={() => void lookupVocabulary(word)} className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">{word}</button>)}</div>}{vocabLoading && <p className="mt-5 text-sm font-semibold text-slate-500">Lug‘atdan qidirilmoqda…</p>}{vocabError && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{vocabError}</p>}{vocabEntry && <article className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 dark:border-emerald-300/10 dark:bg-emerald-400/5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="text-2xl font-black">{vocabEntry.word}</h4><p className="mt-1 text-sm text-slate-500">{vocabEntry.phonetic || vocabEntry.phonetics?.find((p: any) => p.text)?.text || (track === "russian" ? "Ruscha so‘z" : "Talaffuz transkripsiyasi mavjud emas")}</p>{vocabTranslation && <p className="mt-2 text-base font-bold text-emerald-800 dark:text-emerald-200">{vocabTranslation}</p>}</div><button onClick={() => pronounceWord(vocabEntry.word, vocabEntry.phonetics?.find((p: any) => p.audio)?.audio)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white"><Volume2 size={17}/> Aytilishi</button></div><div className="mt-4 space-y-3">{(vocabEntry.meanings ?? []).slice(0,4).map((meaning: any, i: number) => <div key={i}><p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">{meaning.partOfSpeech}</p>{(meaning.definitions ?? []).slice(0,2).map((d: any,j: number)=><p key={j} className="mt-1 text-sm text-slate-700 dark:text-slate-200">{d.definition}{d.example ? <span className="mt-1 block text-xs italic text-slate-500">“{d.example}”</span> : null}</p>)}</div>)}</div><div className="mt-5 flex flex-wrap gap-2"><button onClick={tryPronunciation} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0b9b88] px-4 text-sm font-bold text-white"><Volume2 size={16}/> Talaffuz qilib ko‘rish</button><button onClick={() => saveForLater(vocabEntry.word)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 px-4 text-sm font-bold text-emerald-800 dark:border-white/10 dark:text-emerald-200">Keyinroq o‘rganish</button></div>{spokenText && <p className="mt-3 rounded-xl bg-white p-3 text-sm dark:bg-white/5">Siz aytdingiz: <b>{spokenText}</b><span className="mt-1 block text-xs font-bold text-emerald-700">{spokenText.toLocaleLowerCase().replace(/[^\p{L}]/gu, "") === String(vocabEntry.word).toLocaleLowerCase().replace(/[^\p{L}]/gu, "") ? "Ajoyib! Talaffuz mos keldi." : "Yaxshi urinish. Yana bir bor tinglab, qayta urinib ko‘ring."}</span></p>}{savedLater.includes(vocabEntry.word) && <p className="mt-2 text-xs font-bold text-emerald-700">Keyinroq o‘rganish ro‘yxatiga qo‘shildi.</p>}</article>}<p className="mt-4 text-[10px] text-slate-400">Lug‘at ma’lumotlari ochiq lug‘at va tarjima xizmatlaridan olinadi. Talaffuz ovozi mavjud bo‘lmasa, qurilmangizning ovoz tizimi ishlatiladi.</p>{savedLater.length > 0 && <div className="mt-4 border-t border-slate-100 pt-4 dark:border-white/10"><b className="text-xs">Keyinroq o‘rganaman</b><div className="mt-2 flex flex-wrap gap-2">{savedLater.map((word) => <button key={word} onClick={() => void lookupVocabulary(word)} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold dark:bg-white/5">{word}</button>)}</div></div>}</section></div>}
    {activeGame === "words" && <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><section className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl dark:bg-[#10231e]"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">LUG‘AT SINOVI · {wordIndex + 1}/{words.length}</p><h3 className="text-xl font-black">So‘z topish</h3></div><button onClick={closeGame} aria-label="Yopish"><X/></button></div><p className="mt-6 text-lg font-extrabold">{words[wordIndex].q}</p><div className="mt-4 grid gap-2">{words[wordIndex].opts.map((option) => <button key={option} disabled={wordChecked} onClick={() => { setWordAnswer(option); setWordChecked(true); }} className={`min-h-12 rounded-xl border px-4 text-left text-sm font-bold ${wordChecked && option === words[wordIndex].a ? "border-emerald-500 bg-emerald-50 text-emerald-800" : wordAnswer === option ? "border-rose-300 bg-rose-50" : "border-slate-200 dark:border-white/10"}`}>{option}</button>)}</div>{wordChecked && <button onClick={() => { if (wordIndex < words.length - 1) { setWordIndex((v) => v + 1); setWordAnswer(""); setWordChecked(false); } else { setWordIndex(0); setWordAnswer(""); setWordChecked(false); setActiveGame(null); } }} className="mt-5 min-h-12 w-full rounded-xl bg-emerald-700 font-black text-white">Davom etish</button>}</section></div>}
  </section>;
}
