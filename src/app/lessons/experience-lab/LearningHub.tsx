"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Search, Volume2, Mic, Swords, Target, Trophy, Clock3, Flame, ChevronRight, CheckCircle2, Play, Headphones, PenLine, ArrowLeft, CalendarDays, Sparkles, Send, Home, Flag, UserRound } from "lucide-react";
import type { LearningPlanInput } from "./LearningOnboarding";
import type { AssessmentTrack } from "./assessment-bank";
import LearningPathProgress from "./LearningPathProgress";

type Activity = { id: string; track_id: string; skill_name: string; activity_type: string; item_key: string | null; score: number | null; duration_seconds: number; completed_at: string; details: Record<string, unknown> };
type Assessment = { score: number; total: number; level: string; practical_passed: boolean; assessed_at: string } | null;
type Props = { plan: LearningPlanInput; assessment: Assessment; onEdit: () => void; onAssess: () => void; onDuel: (track: AssessmentTrack) => void };
type PracticeMode = "listening" | "speaking" | "writing" | null;

const tracks: Record<AssessmentTrack, string> = { english: "Ingliz tili", russian: "Rus tili", coding: "Dasturlash", cyber: "Kiberxavfsizlik" };
const languageMeta: Record<AssessmentTrack, { label: string; speech: string; sample: string[] }> = {
  english: { label: "Inglizcha", speech: "en-US", sample: ["achieve", "improve", "although", "reliable", "opportunity", "confident", "environment", "experience", "decision", "challenge", "curious", "discover", "journey", "patient", "success"] },
  russian: { label: "Ruscha", speech: "ru-RU", sample: ["возможность", "уверенность", "развитие", "окружающая среда", "опыт", "решение", "достижение", "навык", "обучение", "цель", "любопытство", "открывать", "путешествие", "терпеливый", "успех"] },
  coding: { label: "Dasturlash", speech: "en-US", sample: ["variable", "function", "array", "component", "database", "algorithm", "security", "network", "interface", "testing", "repository", "deployment", "debugging", "framework", "commit"] },
  cyber: { label: "Kiberxavfsizlik", speech: "en-US", sample: ["authentication", "encryption", "firewall", "phishing", "vulnerability", "network", "access", "session", "incident", "security", "malware", "encryption key", "breach", "monitoring", "patch"] },
};
const translations: Record<AssessmentTrack, string[]> = {
  english: ["erishmoq", "yaxshilamoq", "garchi", "ishonchli", "imkoniyat", "o‘ziga ishongan", "atrof-muhit", "tajriba", "qaror", "qiyinchilik", "qiziquvchan", "kashf qilmoq", "sayohat", "sabrli", "muvaffaqiyat"],
  russian: ["imkoniyat", "ishonch", "rivojlanish", "atrof-muhit", "tajriba", "qaror", "yutuq", "ko‘nikma", "ta’lim", "maqsad", "qiziquvchanlik", "ochmoq", "sayohat", "sabrli", "muvaffaqiyat"],
  coding: ["o‘zgaruvchi", "funksiya", "massiv", "komponent", "ma’lumotlar bazasi", "algoritm", "xavfsizlik", "tarmoq", "interfeys", "sinov", "kod ombori", "ishga joylash", "xatoni tuzatish", "freymvork", "o‘zgarishlar to‘plami"],
  cyber: ["autentifikatsiya", "shifrlash", "tarmoq ekrani", "fishing", "zaiflik", "tarmoq", "ruxsat", "sessiya", "hodisa", "xavfsizlik", "zararli dastur", "shifrlash kaliti", "ma’lumotlar buzilishi", "kuzatuv", "xavfsizlik yangilanishi"],
};
const writingPrompts: Record<AssessmentTrack, string> = {
  english: "Write 3–5 sentences about a skill you want to improve and why it matters to you.",
  russian: "Напишите 3–5 предложений о навыке, который вы хотите развить, и почему он важен.",
  coding: "Tanlagan texnologiyangizda kichik funksiya yozing va u nima qilishini izohlang.",
  cyber: "Fishing xatini aniqlash uchun tekshiradigan 3 ta belgini yozing.",
};
const listeningPrompts: Record<AssessmentTrack, string> = {
  english: "I practise a little every day because consistency helps me improve.",
  russian: "Я занимаюсь каждый день, потому что постоянство помогает мне развиваться.",
  coding: "A function receives input, processes data, and returns a result.",
  cyber: "Use strong authentication and keep your software up to date.",
};
const todayKey = () => new Date().toLocaleDateString("en-CA");
const progressiveVocabulary: Record<AssessmentTrack, Array<{ word: string; translation: string }>> = {
  english: [
    {word:"ambitious",translation:"intiluvchan"},{word:"contribute",translation:"hissa qo‘shmoq"},{word:"essential",translation:"muhim"},{word:"efficient",translation:"samarali"},{word:"maintain",translation:"saqlab turmoq"},
    {word:"perspective",translation:"nuqtayi nazar"},{word:"significant",translation:"sezilarli"},{word:"circumstance",translation:"vaziyat"},{word:"consequence",translation:"oqibat"},{word:"determine",translation:"aniqlamoq"},
    {word:"accomplish",translation:"amalga oshirmoq"},{word:"sustainable",translation:"barqaror"},{word:"comprehensive",translation:"batafsil"},{word:"inevitable",translation:"muqarrar"},{word:"resilience",translation:"chidamlilik"}
  ],
  russian: [
    {word:"вдохновение",translation:"ilhom"},{word:"привычка",translation:"odat"},{word:"возможность",translation:"imkoniyat"},{word:"достижение",translation:"yutuq"},{word:"ответственность",translation:"mas’uliyat"},
    {word:"окружающий",translation:"atrofdagi"},{word:"исследование",translation:"tadqiqot"},{word:"преимущество",translation:"ustunlik"},{word:"последовательность",translation:"izchillik"},{word:"самостоятельность",translation:"mustaqillik"},
    {word:"целеустремлённость",translation:"maqsadga intiluvchanlik"},{word:"взаимодействие",translation:"o‘zaro ta’sir"},{word:"усовершенствование",translation:"takomillashtirish"},{word:"предприимчивость",translation:"tadbirkorlik"},{word:"осведомлённость",translation:"xabardorlik"}
  ],
  coding: [
    {word:"recursion",translation:"rekursiya"},{word:"middleware",translation:"oraliq dasturiy qatlam"},{word:"abstraction",translation:"abstraksiya"},{word:"inheritance",translation:"meros olish"},{word:"polymorphism",translation:"polimorfizm"},
    {word:"asynchronous",translation:"asinxron"},{word:"optimization",translation:"optimallashtirish"},{word:"dependency",translation:"bog‘liqlik"},{word:"architecture",translation:"arxitektura"},{word:"encapsulation",translation:"inkapsulyatsiya"},
    {word:"concurrency",translation:"bir vaqtda bajarilish"},{word:"serialization",translation:"serializatsiya"},{word:"observability",translation:"kuzatuvchanlik"},{word:"idempotency",translation:"takroriy xavfsiz bajarilish"},{word:"orchestration",translation:"jarayonlarni muvofiqlashtirish"}
  ],
  cyber: [
    {word:"cryptography",translation:"kriptografiya"},{word:"zero-day",translation:"nol kunlik zaiflik"},{word:"intrusion",translation:"ruxsatsiz kirish"},{word:"privilege",translation:"imtiyoz"},{word:"exfiltration",translation:"ma’lumotni yashirin olib chiqish"},
    {word:"mitigation",translation:"xavfni kamaytirish"},{word:"forensics",translation:"raqamli kriminalistika"},{word:"obfuscation",translation:"kodni chalkashtirish"},{word:"credential",translation:"hisob ma’lumoti"},{word:"sandboxing",translation:"izolyatsiyalangan muhitda ishga tushirish"},
    {word:"persistence",translation:"tizimda yashirin saqlanib qolish"},{word:"escalation",translation:"huquqni oshirish"},{word:"exploitation",translation:"zaiflikdan foydalanish"},{word:"attestation",translation:"ishonchlilikni tasdiqlash"},{word:"segmentation",translation:"tarmoqqa ajratish"}
  ],
};
const offlineDictionary: Record<string, { translation: string; definition: string; example: string }> = {
  hello:{translation:"salom",definition:"A greeting used when meeting someone.",example:"Hello, how are you?"},
  achieve:{translation:"erishmoq",definition:"To succeed in reaching a goal.",example:"You can achieve your goals with practice."},
  improve:{translation:"yaxshilamoq",definition:"To make or become better.",example:"Daily practice helps you improve."},
  although:{translation:"garchi",definition:"Used to introduce a contrast or unexpected fact.",example:"Although it was late, we continued."},
  reliable:{translation:"ishonchli",definition:"Able to be trusted or depended on.",example:"This is a reliable source."},
  opportunity:{translation:"imkoniyat",definition:"A situation that makes it possible to do something.",example:"This is a great opportunity."},
  confident:{translation:"o‘ziga ishongan",definition:"Feeling sure about your abilities.",example:"She feels confident before the exam."},
  environment:{translation:"atrof-muhit",definition:"The surroundings or conditions in which people live.",example:"We should protect the environment."},
  experience:{translation:"tajriba",definition:"Knowledge or skill gained by doing something.",example:"Experience helps us learn."},
  decision:{translation:"qaror",definition:"A choice made after thinking about something.",example:"It was a difficult decision."},
  challenge:{translation:"qiyinchilik",definition:"A difficult task that tests someone's ability.",example:"Every challenge can teach us something."},
  curious:{translation:"qiziquvchan",definition:"Eager to know or learn something.",example:"Curious people ask questions."},
  discover:{translation:"kashf qilmoq",definition:"To find something for the first time.",example:"We discover new ideas every day."},
  journey:{translation:"sayohat",definition:"An act of travelling from one place to another.",example:"Learning is a lifelong journey."},
  patient:{translation:"sabrli",definition:"Able to wait calmly without becoming upset.",example:"Be patient with yourself."},
  success:{translation:"muvaffaqiyat",definition:"The achievement of a desired result.",example:"Hard work can lead to success."},
  apple:{translation:"olma",definition:"A round fruit with red, green, or yellow skin.",example:"I eat an apple every morning."},
  book:{translation:"kitob",definition:"A set of written or printed pages bound together.",example:"This book is interesting."},
  network:{translation:"tarmoq",definition:"A group of connected computers or people.",example:"The network is secure."},
  security:{translation:"xavfsizlik",definition:"The state of being protected from danger or attack.",example:"Security matters online."},
  authentication:{translation:"autentifikatsiya",definition:"The process of verifying a user's identity.",example:"Use multi-factor authentication."},
  encryption:{translation:"shifrlash",definition:"The process of protecting information by converting it into code.",example:"Encryption protects private data."},
  firewall:{translation:"tarmoqlararo ekran",definition:"A security system that controls incoming and outgoing network traffic.",example:"The firewall blocks suspicious traffic."},
  phishing:{translation:"fishing hujumi",definition:"A scam that tricks people into revealing private information.",example:"Never click a suspicious phishing link."},
  array:{translation:"massiv",definition:"A data structure that stores a collection of values.",example:"The array contains five numbers."},
  function:{translation:"funksiya",definition:"A reusable block of code that performs a task.",example:"This function returns a result."},
  computer:{translation:"kompyuter",definition:"An electronic device that processes and stores information.",example:"My computer is fast."},
  "привет":{translation:"salom",definition:"A common informal Russian greeting.",example:"Привет, как дела?"},
  "спасибо":{translation:"rahmat",definition:"A polite expression of gratitude.",example:"Спасибо за помощь."},
  "пожалуйста":{translation:"iltimos; marhamat",definition:"A polite word used when making a request or responding to thanks.",example:"Пожалуйста, помогите мне."},
  "сегодня":{translation:"bugun",definition:"On this day; at the present time.",example:"Сегодня хорошая погода."},
  "работа":{translation:"ish",definition:"An activity involving mental or physical effort.",example:"У меня много работы."},
  "дом":{translation:"uy",definition:"A building where people live.",example:"Я иду домой."},
  "книга":{translation:"kitob",definition:"A written or printed work consisting of pages.",example:"Я читаю интересную книгу."},
};


export default function LearningHub({ plan, assessment, onEdit, onAssess, onDuel }: Props) {
  const [tab, setTab] = useState("home");
  const [tabDirection, setTabDirection] = useState<"left" | "right">("left");
  const [practiceMode, setPracticeMode] = useState<PracticeMode>(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [spoken, setSpoken] = useState("");
  const [status, setStatus] = useState("");
  const [writingAnswer, setWritingAnswer] = useState("");
  const [writingSaved, setWritingSaved] = useState(false);
  const [listeningDone, setListeningDone] = useState(false);
  const [listeningHeard, setListeningHeard] = useState(false);
  const [celebration, setCelebration] = useState(false);

  const [rewardXP, setRewardXP] = useState(0);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [celebrationTranslation, setCelebrationTranslation] = useState("");
  const tabTouch = useRef<{x:number;y:number;ignored:boolean}|null>(null);
  const tabOrder = ["home","vocab","rating","practice","games","stats"];
  const selectTab = (nextTab: string) => {
    const currentIndex = tabOrder.indexOf(tab);
    const nextIndex = tabOrder.indexOf(nextTab);
    setTabDirection(nextIndex >= currentIndex ? "left" : "right");
    setTab(nextTab);
    setPracticeMode(null);
  };
  const beginTabSwipe = (event: React.TouchEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const ignored = Boolean(target.closest('input,textarea,select,[data-swipe-ignore],[data-horizontal-scroll],.hide-scrollbar'));
    const touch = event.touches[0];
    tabTouch.current = {x:touch.clientX,y:touch.clientY,ignored};
  };
  const endTabSwipe = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = tabTouch.current; tabTouch.current = null;
    if (!start || start.ignored) return;
    const touch = event.changedTouches[0], dx = touch.clientX-start.x, dy = touch.clientY-start.y;
    if (Math.abs(dx)<70 || Math.abs(dx)<Math.abs(dy)*1.3) return;
    event.preventDefault();
    event.stopPropagation();
    const current = tabOrder.indexOf(tab);
    const next = Math.max(0,Math.min(tabOrder.length-1,current+(dx<0?1:-1)));
    if (next!==current) { setTabDirection(next > current ? "left" : "right"); setTab(tabOrder[next]); setPracticeMode(null); }
  };

  const meta = languageMeta[plan.trackId];
  const completedStages = activities.filter((item) => ["listening", "speaking", "writing", "game"].includes(item.activity_type) && (item.score ?? 0) >= 45).length;
  const vocabularyCatalog = useMemo(() => [
    ...meta.sample.map((word, index) => ({ word, translation: translations[plan.trackId][index], level: index < 5 ? 1 : index < 10 ? 2 : 3 })),
    ...progressiveVocabulary[plan.trackId].map((item, index) => ({ ...item, level: index < 5 ? 4 : index < 10 ? 5 : 6 })),
  ], [meta.sample, plan.trackId]);
  const usedVocabulary = useMemo(() => new Set(activities.filter((item) => item.activity_type === "vocabulary").map((item) => String(item.item_key || "").split(":")[0].toLocaleLowerCase())), [activities]);
  const nextVocabulary = vocabularyCatalog.filter((item) => !usedVocabulary.has(item.word.toLocaleLowerCase()) && !done.includes(item.word)).slice(0, 5);
  const words = nextVocabulary.map((item) => item.word);
  const currentDoneCount = words.filter((word) => done.includes(word) || usedVocabulary.has(word.toLocaleLowerCase())).length;
  const currentVocabularyLevel = nextVocabulary[0]?.level || (vocabularyCatalog.length ? vocabularyCatalog[vocabularyCatalog.length - 1].level + 1 : 1);
  const date = plan.targetDate ? new Date(plan.targetDate + "T12:00:00").toLocaleDateString("uz-UZ") : "Belgilanmagan";
  const logActivity = async (activityType: string, itemKey: string, score?: number, details: Record<string, unknown> = {}, completed = false) => {
    try {
      const response = await fetch("/api/learning/activity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trackId: plan.trackId, skillName: plan.skillName, activityType, itemKey, score, details, completed }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Faoliyat saqlanmadi");
      const history = await fetch("/api/learning/activity?track=" + plan.trackId, { cache: "no-store" });
      if (history.ok) { const data = await history.json(); setActivities(data.activities || []); }
      return payload;
    } catch (e) { console.error("[learning-activity]", e); setStatus(e instanceof Error ? e.message : "Mashqni saqlab bo‘lmadi."); return null; }
  };

  const finishPractice = async (activityType: string, itemKey: string, score = 100, details: Record<string, unknown> = {}) => {
    const payload = await logActivity(activityType, `${itemKey}:${todayKey()}:${completedStages + 1}`, score, details, true);
    if (payload?.reward?.awarded) { setRewardXP(payload.reward.xp); if (details.evaluator !== "gemini") { setCelebrationMessage(""); setCelebrationTranslation(""); } setCelebration(true); }
    else if (payload?.reward && !payload.reward.awarded) setStatus(payload.reward.daily_limit ? "Bugungi ushbu mashq uchun XP limiti tugadi." : "Bu mashq uchun XP avval berilgan.");
  };

  useEffect(() => {
    let alive = true;
    try { setDone(JSON.parse(localStorage.getItem("zikra-words-" + todayKey()) || "[]")); } catch { setDone([]); }
    fetch("/api/learning/activity?track=" + plan.trackId, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (alive && data?.activities) setActivities(data.activities); })
      .catch(() => {});
    return () => { alive = false; };
  }, [plan.trackId]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const source = plan.trackId === "russian" ? "ru" : "en";
      const response = await fetch("/api/learning/dictionary?word=" + encodeURIComponent(query.trim()) + "&from=" + source, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Lug‘atga ulanib bo‘lmadi.");
      setResult(data);
    } catch (e) {
      const fallback = offlineDictionary[query.trim().toLowerCase()];
      if (fallback) {
        setResult({ word: query.trim(), phonetic: "", translation: fallback.translation, meanings: [{ partOfSpeech: "meaning", definition: fallback.definition, example: fallback.example }], audio: "", source: "offline" });
        setError("");
      } else {
        setError("Lug‘at serveriga ulanib bo‘lmadi. Internetni tekshiring yoki hozircha boshqa so‘z kiriting.");
      }
    }
    finally { setLoading(false); }
  }

  function speak(text: string, lang = meta.speech) {
    if (!("speechSynthesis" in window)) { setStatus("Bu brauzer ovozli o‘qishni qo‘llamaydi."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const languageCode = lang.split("-")[0].toLowerCase();
    const preferredVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith(languageCode));
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.88;
    utterance.onend = () => { setStatus("Tinglash yakunlandi."); if (practiceMode === "listening") setListeningHeard(true); };
    window.speechSynthesis.speak(utterance);
    setStatus("Ovoz ijro etilmoqda…");
  }

  function testVoice() {
    const w = window as any, Recognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Recognition) { setStatus("Brauzeringiz nutqni avtomatik tanishni qo‘llamaydi. Chrome yoki Edge’da sinab ko‘ring."); return; }
    const recognition = new Recognition();
    recognition.lang = meta.speech;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = async (event: any) => {
      const value = event.results?.[0]?.[0]?.transcript || "";
      setSpoken(value);
      const expected = practiceMode === "speaking" ? listeningPrompts[plan.trackId] : (result?.word || "");
      if (!value.trim() || !expected.trim()) { setStatus("Ovoz aniqlanmadi. Qayta urinib ko‘ring."); return; }
      setStatus("AI nutqingizni tekshirmoqda…");
      try {
        const response = await fetch("/api/learning/speech-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expected, transcript: value, trackId: plan.trackId }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "AI tekshiruvi bajarilmadi.");
        setStatus(payload.feedback || "Tekshiruv yakunlandi.");
        if (payload.passed) {
          setCelebrationMessage(payload.praise || "Well done!");
          setCelebrationTranslation(payload.praiseUz || "Ajoyib ish!");
          await finishPractice("speaking", expected.slice(0, 100), payload.score, { transcript: value, evaluator: "gemini", feedback: payload.feedback });
        }
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "AI tekshiruvi bajarilmadi.");
      }
    };
    recognition.onerror = (event: any) => setStatus(event.error === "not-allowed" ? "Mikrofonga ruxsat bering." : "Ovoz aniqlanmadi. Qayta urinib ko‘ring.");
    setStatus("Tinglayapman… Mikrofon orqali gapiring.");
    recognition.start();
  }

  function toggleWord(word: string) {
    const next = done.includes(word) ? done.filter(x => x !== word) : [...done, word];
    setDone(next);
    try { localStorage.setItem("zikra-words-" + todayKey(), JSON.stringify(next)); } catch {}
    if (!done.includes(word)) void finishPractice("vocabulary", word, 100, { markedLearned: true });
  }

  const dayStats = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(); day.setDate(day.getDate() - (6 - index));
    const key = day.toLocaleDateString("en-CA");
    const count = activities.filter(a => new Date(a.completed_at).toLocaleDateString("en-CA") === key).length;
    return { label: day.toLocaleDateString("uz-UZ", { weekday: "short" }), date: key, count };
  });
  const practiceCards = [
    { id: "listening" as const, icon: Headphones, title: "Tinglab o‘rganish", desc: "Matnni tinglang, qayta eshiting va eslab qoling." },
    { id: "speaking" as const, icon: Mic, title: "Speaking mashqi", desc: "Mikrofonga gapiring va tanilgan matnni tekshiring." },
    { id: "writing" as const, icon: PenLine, title: "Yozish mashqi", desc: "Mavzu bo‘yicha fikringizni yozib, mashqni yakunlang." },
  ];

  return <div className="learning-hub min-h-[100dvh] bg-[#f4f8f7] px-3 pb-[max(110px,calc(88px+env(safe-area-inset-bottom)))] pt-4 text-slate-900 sm:px-6 sm:pt-6 lg:px-10" onTouchStart={beginTabSwipe} onTouchEnd={endTabSwipe} style={{ touchAction: "pan-y" }}>
    <div className="mx-auto max-w-[1380px]">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-2xl font-black text-[#078777] shadow">Z</span><div className="min-w-0"><b className="block truncate text-lg sm:text-xl">Zikra <span className="text-[#078777]">Rivojlanish</span></b><p className="text-xs text-slate-500">Shaxsiy bilim makoningiz</p></div></div>
        <span className="hidden rounded-full border border-white bg-white/75 px-4 py-2 text-[10px] font-black tracking-widest text-[#087d70] sm:inline-flex">YOUR LEARNING JOURNEY</span>
      </header>

      <div className="mt-5 grid gap-3 xl:grid-cols-[1.3fr_.7fr]">
        <section className="relative overflow-hidden rounded-[26px] border border-white bg-white/90 p-5 shadow-lg sm:rounded-[30px] sm:p-8">
          <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-emerald-100 blur-3xl"/>
          <div className="relative"><p className="text-[10px] font-black tracking-[.2em] text-[#078777]">SIZNING SHAXSIY YO‘LINGIZ</p><h1 className="mt-2 text-[clamp(1.6rem,5vw,2.6rem)] font-black leading-tight">{plan.skillName} bo‘yicha rivojlanish</h1><p className="mt-2 text-sm text-slate-500">{tracks[plan.trackId]} · {plan.dailyMinutes} daqiqa/kun · Maqsad: {date}</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">{assessment ? assessment.level : "Diagnostika kutilmoqda"}</span><span className="rounded-full bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700">{plan.learningStyle === "mixed" ? "Aralash usul" : plan.learningStyle === "video" ? "Video dars" : plan.learningStyle === "practice" ? "Amaliyot" : "O‘qish"}</span></div><div className="mt-5 flex flex-col gap-2 sm:flex-row"><button onClick={onAssess} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#087d70] px-5 text-sm font-bold text-white"><Target size={17}/>{assessment ? "Qayta diagnostika" : "Darajani aniqlash"}</button><button onClick={onEdit} className="min-h-12 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold">Yo‘l xaritasini tahrirlash</button></div></div>
        </section>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">{[[Flame,"Kunlik ritm",plan.dailyMinutes+" daq."],[Trophy,"Diagnostika",assessment ? assessment.score+"/"+assessment.total : "—"],[Clock3,"Maqsad sanasi",date],[CheckCircle2,"Bugungi so‘zlar",currentDoneCount+"/5"]].map(([Icon,label,value]:any)=><div key={label} className="min-w-0 rounded-[20px] border border-white bg-white/90 p-3 shadow-sm sm:rounded-[24px] sm:p-4"><Icon size={19} className="text-[#0b9b88]"/><p className="mt-2 text-[11px] text-slate-500 sm:mt-3 sm:text-xs">{label}</p><b className="mt-1 block break-words text-base font-black sm:text-lg">{value}</b></div>)}</div>
      </div>

      <nav aria-label="Rivojlanish bo‘limlari" className="mt-5 hidden gap-1 overflow-x-auto rounded-2xl border border-white bg-white/85 p-1.5 shadow-sm sm:mt-7 sm:flex sm:gap-2 sm:p-2">{[["home","Umumiy",Target],["vocab","Lug‘at",BookOpen],["practice","Mashqlar",PenLine],["games","O‘yinlar",Swords],["stats","Natijalar",Trophy]].map(([id,label,Icon]:any)=><button key={id} onClick={()=>selectTab(id)} className={"flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold sm:min-h-11 sm:gap-2 sm:px-4 sm:text-sm "+(tab===id?"bg-[#087d70] text-white":"text-slate-500 hover:bg-emerald-50")}><Icon size={15}/>{label}</button>)}</nav>

      <div key={tab} className="learning-screen-transition" data-direction={tabDirection}>
      {tab === "home" && <div className="mt-4 space-y-4 lg:mt-6"><LearningPathProgress activities={activities} trackId={plan.trackId} /><div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[24px] border border-white bg-white/95 p-4 shadow-sm sm:rounded-[28px] sm:p-7"><div className="relative mb-4 h-28 overflow-hidden rounded-2xl sm:h-36"><img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=85" alt="" className="h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-r from-emerald-950/75 to-transparent"/><span className="absolute bottom-4 left-4 text-lg font-black text-white sm:text-xl">Bugun o‘zingizga yangi imkoniyat oching</span></div><p className="text-[10px] font-black tracking-widest text-[#078777]">BUGUNGI REJA</p><h2 className="mt-1 text-xl font-black sm:text-2xl">Har kuni 5 ta yangi {plan.trackId === "russian" ? "so‘z" : "atama"}</h2><p className="mt-1 text-xs font-semibold text-slate-500">Bosqich {currentVocabularyLevel} · Avval o‘rganilgan so‘zlar qayta berilmaydi</p><div className="mt-4 space-y-2">{words.length ? words.map((word,i)=><button key={word} onClick={()=>toggleWord(word)} className="flex min-h-[60px] w-full items-center gap-3 rounded-2xl border border-slate-100 bg-[#fbfdfc] p-3 text-left"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">{done.includes(word)?<CheckCircle2 size={19}/>:<BookOpen size={19}/>}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm">{word}</b><small className="text-xs text-slate-500">{vocabularyCatalog.find(item=>item.word===word)?.translation || "Tarjima keyinroq qo‘shiladi"}</small></span><small className="shrink-0 font-bold text-emerald-700">{done.includes(word)?"Yodlandi":"Belgilash"}</small></button>) : <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Ushbu lug‘atdagi so‘zlar tugadi. Keyingi so‘zlar to‘plami tayyorlanmoqda.</p>}</div></section>
        <section className="rounded-[24px] border border-white bg-gradient-to-br from-[#f1f7ff] to-[#effaf5] p-5 sm:rounded-[28px] sm:p-7"><h2 className="text-xl font-black sm:text-2xl">Keyingi qadam</h2><p className="mt-2 text-sm leading-6 text-slate-500">Tanlagan ko‘nikmangiz bo‘yicha mashq qiling, bilimni mustahkamlang va natijangizni kuzating.</p><div className="mt-5 space-y-2">{[["Lug‘atni ochish",BookOpen,"vocab"],["Mashqlarni boshlash",Mic,"practice"],["O‘yinlarni ko‘rish",Swords,"games"]].map(([label,Icon,id]:any)=><button key={id} onClick={()=>setTab(id)} className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-white bg-white px-4 text-sm font-bold text-slate-700"><Icon size={17} className="text-emerald-700"/>{label}<ChevronRight className="ml-auto"/></button>)}</div></section>
      </div></div>}

      {tab === "vocab" && <section className="mt-4 rounded-[24px] border border-white bg-white/95 p-4 shadow-sm sm:mt-6 sm:rounded-[28px] sm:p-8"><div className="flex items-center gap-3"><BookOpen className="shrink-0 text-sky-600" size={26}/><div className="min-w-0"><h2 className="text-xl font-black sm:text-2xl">{meta.label} lug‘ati</h2><p className="text-xs text-slate-500 sm:text-sm">So‘zni qidiring, ma’nosini ko‘ring va talaffuzini tinglang.</p></div></div><form onSubmit={search} className="mt-5 flex flex-col gap-2 sm:flex-row"><div className="relative min-w-0 flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={plan.trackId === "russian" ? "Ruscha so‘zni kiriting..." : "Inglizcha so‘zni kiriting..."} className="h-12 w-full rounded-2xl border border-slate-200 bg-[#f9fbfa] pl-11 pr-4 text-base outline-none focus:border-emerald-600 sm:h-14 sm:text-sm"/></div><button disabled={loading||!query.trim()} className="min-h-12 rounded-2xl bg-[#087d70] px-5 text-sm font-bold text-white disabled:opacity-50">{loading?"Qidirilmoqda…":"Qidirish"}</button></form>{error&&<p role="alert" className="mt-4 text-sm text-rose-600">{error}</p>}{result&&<article className="mt-5 rounded-3xl border border-emerald-100 bg-[#f2fbf7] p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-2xl font-black sm:text-3xl">{result.word}</h3><p className="text-sm text-slate-500">{result.phonetic}</p>{result.translation&&<p className="mt-1 text-sm font-bold text-emerald-800">Tarjimasi: {result.translation}</p>}</div><button onClick={()=>result.audio?new Audio(result.audio.startsWith("//")?"https:"+result.audio:result.audio).play().catch(()=>speak(result.word)):speak(result.word)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#087d70] px-4 text-sm font-bold text-white"><Volume2 size={18}/> Aytilishi</button></div><ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-slate-700">{result.meanings.map((m:any,i:number)=><li key={i}><span className="font-semibold text-slate-500">{m.partOfSpeech}</span> {m.definition}</li>)}</ol>{result.example&&<div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Namunaviy gap</p><p className="mt-2 text-sm font-semibold text-slate-800">“{result.example}”</p><p className="mt-2 text-sm text-emerald-800">Tarjimasi: {result.exampleTranslation || "Tarjima hozircha topilmadi."}</p><button type="button" onClick={()=>speak(result.example,meta.speech)} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-slate-600"><Volume2 size={14}/> Gapni tinglash</button></div>}<button onClick={()=>void logActivity("vocabulary",result.word,100,{lookedUp:true})} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-800"><CheckCircle2 size={16}/> O‘rgandim</button></article>}<p className="mt-4 text-xs text-slate-400">Lug‘at server orqali olinadi. Ovozli o‘qish brauzer imkoniyatiga bog‘liq.</p></section>}

      {tab === "practice" && !practiceMode && <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 xl:grid-cols-3">{practiceCards.map(({id,icon:Icon,title,desc})=><button key={id} onClick={()=>{setPracticeMode(id);setStatus("");setSpoken("");setWritingAnswer("");setWritingSaved(false);setListeningDone(false);setListeningHeard(false)}} className="min-h-[190px] rounded-[24px] border border-white bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-[26px] sm:p-6"><div className="relative -mx-5 -mt-5 mb-4 h-28 overflow-hidden rounded-t-[24px] sm:-mx-6 sm:-mt-6 sm:h-36 sm:rounded-t-[26px]"><img src={id === "listening" ? "https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=900&q=85" : id === "speaking" ? "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=85" : "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=85"} alt="" className="h-full w-full object-cover"/><span className="absolute inset-0 bg-gradient-to-t from-slate-900/55 to-transparent"/><span className="absolute bottom-3 left-4 grid h-10 w-10 place-items-center rounded-xl bg-white/90 text-emerald-700"><Icon size={23}/></span></div><b className="block text-lg">{title}</b><p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-black text-emerald-700">Mashqni boshlash <ChevronRight size={15}/></span></button>)}<button onClick={onAssess} className="min-h-[190px] rounded-[24px] border border-white bg-gradient-to-br from-emerald-50 to-sky-50 p-5 text-left sm:rounded-[26px] sm:p-6"><Target size={25} className="text-emerald-700"/><b className="mt-4 block text-lg">Bilim diagnostikasi</b><p className="mt-2 text-sm leading-6 text-slate-500">Bilimingizni tekshiring va kuchli hamda rivojlantirish kerak bo‘lgan mavzularni aniqlang.</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-black text-emerald-700">Diagnostikani boshlash <ChevronRight size={15}/></span></button></div>}

      {tab === "practice" && practiceMode && <section className="mt-4 rounded-[24px] border border-white bg-white p-4 shadow-sm sm:mt-6 sm:rounded-[28px] sm:p-8"><button onClick={()=>setPracticeMode(null)} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500"><ArrowLeft size={16}/> Mashqlarga qaytish</button>
        {practiceMode === "listening" && <><Headphones size={28} className="text-emerald-700"/><h2 className="mt-3 text-2xl font-black">Tinglab o‘rganish</h2><p className="mt-2 text-sm text-slate-500">Matnni tinglang, keyin o‘zingiz qayta aytib ko‘ring.</p><blockquote className="mt-5 rounded-2xl bg-emerald-50 p-4 text-base leading-7 text-slate-800">{listeningPrompts[plan.trackId]}</blockquote><button onClick={()=>speak(listeningPrompts[plan.trackId])} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#087d70] px-5 font-bold text-white"><Play size={17}/> Tinglash</button><button disabled={!listeningHeard||listeningDone} onClick={()=>{setListeningDone(true);void finishPractice("listening","daily-listening",100)}} className="ml-2 mt-4 min-h-12 rounded-xl border px-5 font-bold">{!listeningHeard?"Avval tinglang":"Bajardim"}</button>{listeningDone&&<p className="mt-3 text-sm font-semibold text-emerald-700">Mashq kundalik tarixingizga qo‘shildi.</p>}</>}
        {practiceMode === "speaking" && <><Mic size={28} className="text-emerald-700"/><h2 className="mt-3 text-2xl font-black">Speaking mashqi</h2><p className="mt-2 text-sm text-slate-500">Gapni avval tinglang, keyin mikrofon orqali takrorlang.</p><blockquote className="mt-5 rounded-2xl bg-sky-50 p-4 text-base leading-7 text-slate-800">{listeningPrompts[plan.trackId]}</blockquote><div className="mt-4 flex flex-wrap gap-2"><button onClick={()=>speak(listeningPrompts[plan.trackId])} className="inline-flex min-h-12 items-center gap-2 rounded-xl border px-4 font-bold"><Volume2 size={17}/> Namunani tinglash</button><button onClick={testVoice} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#087d70] px-4 font-bold text-white"><Mic size={17}/> Gapirishni boshlash</button></div>{spoken&&<p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">Tanilgan nutq: <b>{spoken}</b></p>}{status&&<p role="status" className="mt-3 text-sm font-semibold text-emerald-700">{status}</p>}<p className="mt-3 text-xs text-slate-400">Brauzer ovozni matnga aylantiradi, Gemini AI esa tanilgan matnni namuna bilan solishtiradi. Bu hozircha akustik fonetik tahlil emas.</p></>}
        {practiceMode === "writing" && <><PenLine size={28} className="text-emerald-700"/><h2 className="mt-3 text-2xl font-black">Yozish mashqi</h2><p className="mt-2 text-sm text-slate-500">Mavzuga mos ravishda fikringizni yozing.</p><blockquote className="mt-5 rounded-2xl bg-violet-50 p-4 text-sm leading-7 text-slate-800">{writingPrompts[plan.trackId]}</blockquote><textarea value={writingAnswer} onChange={e=>{setWritingAnswer(e.target.value);setWritingSaved(false)}} rows={6} placeholder="Javobingizni shu yerga yozing…" className="mt-4 w-full rounded-2xl border border-slate-200 p-4 text-base outline-none focus:border-emerald-600"/><div className="mt-2 flex items-center justify-between gap-3"><span className="text-xs text-slate-400">{writingAnswer.trim().split(/\s+/).filter(Boolean).length} ta so‘z</span><button disabled={writingAnswer.trim().length<20||writingSaved} onClick={async()=>{const score=Math.min(100,Math.round(writingAnswer.trim().split(/\s+/).filter(Boolean).length/35*100));setWritingSaved(true);await finishPractice("writing",writingPrompts[plan.trackId],score,{responseLength:writingAnswer.length})}} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#087d70] px-5 font-bold text-white disabled:opacity-40"><Send size={16}/> Mashqni saqlash</button></div>{writingSaved&&<p className="mt-3 text-sm font-semibold text-emerald-700">Yozish mashqi saqlandi. To‘liq grammatik baholash uchun keyingi bosqichda AI tekshiruvini ulash mumkin.</p>}</>}
      </section>}

      {tab === "games" && <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2"><button onClick={()=>onDuel(plan.trackId)} className="rounded-[24px] border border-white bg-gradient-to-br from-violet-100 to-emerald-50 p-5 text-left shadow-sm sm:rounded-[28px] sm:p-7"><div className="relative -mx-5 -mt-5 mb-4 h-36 overflow-hidden rounded-t-[24px] sm:-mx-7 sm:-mt-7 sm:h-48 sm:rounded-t-[28px]"><img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1100&q=85" alt="" className="h-full w-full object-cover"/><span className="absolute inset-0 bg-gradient-to-t from-violet-950/75 via-violet-900/10 to-transparent"/></div><Swords size={28} className="text-violet-700"/><b className="mt-3 block text-xl">So‘nggi harf</b><p className="mt-2 text-sm text-slate-600">Tanlangan yo‘nalish va o‘yin tilida raqib bilan bellashing.</p><span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#087d70] px-4 py-3 text-xs font-black text-white">O‘ynash <Play size={14}/></span></button><button onClick={()=>onDuel(plan.trackId)} className="rounded-[24px] border border-white bg-gradient-to-br from-sky-50 to-violet-100 p-5 text-left shadow-sm sm:rounded-[28px] sm:p-7"><div className="relative -mx-5 -mt-5 mb-4 h-36 overflow-hidden rounded-t-[24px] sm:-mx-7 sm:-mt-7 sm:h-48 sm:rounded-t-[28px]"><img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1100&q=85" alt="" className="h-full w-full object-cover"/><span className="absolute inset-0 bg-gradient-to-t from-sky-950/70 to-transparent"/></div><Sparkles size={28} className="text-sky-700"/><b className="mt-3 block text-xl">Bilim dueli</b><p className="mt-2 text-sm text-slate-600">Bilim va tezkor fikrlash bo‘yicha 1 ga 1 o‘yin.</p><span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#087d70] px-4 py-3 text-xs font-black text-white">O‘ynash <Play size={14}/></span></button></div>}

      {tab === "rating" && <div className="mt-4 space-y-4 sm:mt-6"><section className="overflow-hidden rounded-[28px] bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-500 p-5 text-white shadow-lg sm:p-7"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-black tracking-[.2em] text-white/75">ZIKRA · HAFTALIK LIGA</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Reytingga ko‘tariling!</h2><p className="mt-2 max-w-sm text-sm text-white/85">Har bir mashq va yangi so‘z sizning o‘sishingizga xizmat qiladi.</p></div><img src="/zikra-mascot.webp" alt="Zikra mushukchasi" className="h-28 w-28 shrink-0 object-contain sm:h-36 sm:w-36"/></div></section><section className="grid grid-cols-2 gap-3"><div className="rounded-[24px] border border-white bg-white p-4 shadow-sm"><Trophy className="text-amber-500" size={24}/><p className="mt-3 text-xs text-slate-500">Oxirgi diagnostika</p><b className="mt-1 block text-2xl font-black text-slate-900">{assessment ? assessment.score+"/"+assessment.total : "—"}</b></div><div className="rounded-[24px] border border-white bg-white p-4 shadow-sm"><Flame className="text-orange-500" size={24}/><p className="mt-3 text-xs text-slate-500">Bajarilgan mashqlar</p><b className="mt-1 block text-2xl font-black text-slate-900">{activities.length}</b></div></section><section className="rounded-[24px] border border-white bg-white p-4 shadow-sm sm:p-6"><h3 className="text-lg font-black">Haftalik faollik reytingi</h3><p className="mt-1 text-sm text-slate-500">So‘nggi 7 kun ichidagi o‘quv faolligingiz</p><div className="mt-5 grid grid-cols-7 gap-2">{dayStats.map(day=><div key={day.date} className="min-w-0 text-center"><div className="flex h-24 items-end justify-center rounded-xl bg-violet-50 p-1"><div className="w-full rounded-lg bg-gradient-to-t from-violet-600 to-sky-400" style={{height:Math.max(6,Math.min(100,day.count*22))+"%"}}/></div><p className="mt-2 text-[10px] text-slate-500">{day.label}</p><b className="text-xs text-slate-800">{day.count}</b></div>)}</div></section></div>}
      {tab === "stats" && <div className="mt-4 space-y-4 sm:mt-6"><section className="overflow-hidden rounded-[26px] border border-white bg-gradient-to-r from-violet-100 via-white to-emerald-100 p-5 shadow-sm sm:rounded-[30px] sm:p-7"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-black tracking-[.2em] text-violet-700">ZIKRA · HAFTALIK NATIJA</p><h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">Shaxsiy natijalar</h2><p className="mt-2 text-sm text-slate-600">Har kuni o‘rgangan bilimlaringiz sizni yuqoriga olib chiqadi.</p></div><img src="/zikra-mascot.webp" alt="Zikra mushukchasi" className="h-24 w-24 shrink-0 object-contain sm:h-32 sm:w-32"/></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-2xl bg-white/90 p-3"><span className="text-xs text-slate-500">Bajarilgan mashqlar</span><b className="mt-1 block text-2xl font-black text-slate-900">{activities.length}</b></div><div className="rounded-2xl bg-white/90 p-3"><span className="text-xs text-slate-500">Bugun o‘rganilgan so‘zlar</span><b className="mt-1 block text-2xl font-black text-slate-900">{currentDoneCount}/5</b></div></div></section><section className="rounded-[24px] border border-white bg-white p-4 sm:rounded-[28px] sm:p-7"><div className="flex items-center gap-2"><CalendarDays className="text-emerald-700"/><h2 className="text-xl font-black">Haftalik faollik</h2></div><div className="mt-5 grid grid-cols-7 gap-2">{dayStats.map(day=><div key={day.date} className="min-w-0 text-center"><div className="flex h-20 items-end justify-center rounded-xl bg-slate-50 p-1"><div className="w-full rounded-lg bg-emerald-500" style={{height:Math.max(6,Math.min(100,day.count*22))+"%"}}/></div><p className="mt-2 text-[10px] text-slate-500">{day.label}</p><b className="text-xs">{day.count}</b></div>)}</div></section><section className="rounded-[24px] border border-white bg-white p-4 sm:rounded-[28px] sm:p-7"><h2 className="text-xl font-black">O‘sish ko‘rsatkichlari</h2><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{[[Trophy,"Diagnostika",assessment?assessment.score+"/"+assessment.total:"—"],[CheckCircle2,"Bugungi so‘zlar",currentDoneCount+"/5"],[Clock3,"Kunlik reja",plan.dailyMinutes+" daq."],[Flame,"Bajarilgan mashq",String(activities.length)]].map(([Icon,label,value]:any)=><div key={label} className="rounded-2xl bg-emerald-50 p-3"><Icon size={19} className="text-emerald-700"/><p className="mt-2 text-xs text-slate-500">{label}</p><b className="text-lg font-black">{value}</b></div>)}</div><h3 className="mt-6 font-bold">Oxirgi faoliyatlar</h3><div className="mt-3 space-y-2">{activities.slice(0,8).map(item=><div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div className="min-w-0"><b className="block truncate text-sm">{item.item_key || item.activity_type}</b><small className="text-xs text-slate-500">{new Date(item.completed_at).toLocaleString("uz-UZ")}</small></div><span className="shrink-0 text-xs font-bold text-emerald-700">{item.score===null?"Bajarildi":Math.round(item.score)+"%"}</span></div>)}</div>{assessment&&<p className="mt-4 text-xs text-slate-500">Oxirgi diagnostika: {new Date(assessment.assessed_at).toLocaleDateString("uz-UZ")} · Amaliy topshiriq: {assessment.practical_passed?"bajarilgan":"yana mashq kerak"}.</p>}</section></div>}
      </div>
      <nav aria-label="O‘quv navigatsiyasi" className="fixed inset-x-0 bottom-0 z-[80] grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-[0_-12px_36px_-20px_rgba(15,65,55,.24)] backdrop-blur-xl sm:hidden">
        {[
          ["home","Asosiy",Home],
          ["vocab","O‘rganish",BookOpen],
          ["rating","Reyting",Trophy],
          ["games","O‘yinlar",Swords],
          ["stats","Profil",UserRound],
        ].map(([id,label,Icon]:any)=>{
          const active=tab===id;
          return <button key={id} onClick={()=>selectTab(id)} className={"flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[10px] transition "+(active?"text-[#087d70]":"text-slate-500")}>
            <span className={"grid h-8 w-10 place-items-center rounded-xl "+(active?"bg-emerald-50":"")}><Icon size={21} strokeWidth={active?2.6:2}/></span>
            <span className={active?"font-black":"font-medium"}>{label}</span>
          </button>;
        })}
      </nav>
      {celebration && <div className="fixed inset-0 z-[160] grid place-items-center bg-black/75 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="zikra-success-title">
        <div className="zikra-success-pop relative w-full max-w-sm overflow-hidden rounded-[30px] border border-white/10 bg-white p-6 text-center shadow-2xl">
          <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl"/>
          <div className="relative mx-auto mb-3 h-28 w-28 animate-bounce"><img src="/zikra-mascot.webp" alt="Zikra mushukchasi" className="h-full w-full object-contain"/></div>
          <p className="text-xs font-black tracking-[.22em] text-emerald-700">ZIKRA · YUTUQ</p>
          <h2 id="zikra-success-title" className="mt-2 text-2xl font-black text-slate-900">{plan.trackId === "english" ? "You did it!" : plan.trackId === "russian" ? "Вы справились!" : "Ajoyib natija!"}</h2>
          <p className="mt-2 text-sm text-slate-600">{celebrationMessage ? celebrationMessage : (plan.trackId === "english" ? "You completed the exercise successfully!" : plan.trackId === "russian" ? "Вы успешно выполнили упражнение!" : "Siz mashqni muvaffaqiyatli bajardingiz!")}</p>
          <p className="mt-1 text-xs text-slate-500">{celebrationTranslation || (plan.trackId === "english" || plan.trackId === "russian" ? "Tarjimasi: Mashqni muvaffaqiyatli bajardingiz!" : "Har bir kichik qadam katta natijaga olib boradi.")}</p>
          <div className="my-5 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-5 py-3 text-lg font-black text-amber-600"><Sparkles size={19}/> +{rewardXP} XP</div>
          <p className="mb-5 text-xs text-slate-500">Mushukcha siz bilan faxrlanadi! Keyingi mashqda yangi bilimlar kutmoqda 🐾</p>
          <button onClick={()=>{setCelebration(false);setStatus("Keyingi mashqqa tayyorsiz!");}} className="min-h-12 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-sm font-black text-white">Davom etish</button>
        </div>
      </div>}
    </div>
  </div>;
}
