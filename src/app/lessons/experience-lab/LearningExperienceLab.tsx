"use client";

import { useState } from "react";
import SkillDuel from "./SkillDuel";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Flame,
  Gamepad2, ShieldCheck, Sparkles, Target, Trophy, Zap,
} from "lucide-react";

type Question = {
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
};

const tracks = [
  { id: "english", name: "Ingliz tili", caption: "Lug‘at · grammatika", icon: BookOpen, tone: "from-sky-500 to-blue-600" },
  { id: "coding", name: "Dasturlash", caption: "JavaScript · mantiq", icon: Gamepad2, tone: "from-violet-500 to-fuchsia-600" },
  { id: "cyber", name: "Kiberxavfsizlik", caption: "Xavfsiz fikrlash", icon: ShieldCheck, tone: "from-emerald-500 to-teal-600" },
];

const questionSets: Record<string, Question[]> = {
  english: [
    { prompt: "“Improve” so‘zining ma’nosi qaysi?", choices: ["Yaxshilamoq", "Unutmoq", "Kutmoq", "Yashirmoq"], answer: 0, explanation: "Improve — yaxshilamoq yoki takomillashtirmoq. I want to improve my English." },
    { prompt: "Choose the correct sentence.", choices: ["She go to class.", "She goes to class.", "She going to class.", "She gone to class."], answer: 1, explanation: "Present Simple’da he/she/it bilan fe’lga odatda -s yoki -es qo‘shiladi." },
    { prompt: "“Reliable” nimani anglatadi?", choices: ["Qimmat", "Ishonchli", "Shovqinli", "Murakkab"], answer: 1, explanation: "Reliable — ishonchli, suyanish mumkin bo‘lgan." },
    { prompt: "Choose the best word: “I ___ English every day.”", choices: ["practice", "practices", "practicing", "practiced"], answer: 0, explanation: "I bilan Present Simple’da fe’lning asosiy shakli ishlatiladi." },
    { prompt: "“Carefully” qaysi ma’noda ishlatiladi?", choices: ["Ehtiyotkorlik bilan", "Kamdan-kam", "Birdaniga", "Baland ovozda"], answer: 0, explanation: "Carefully — diqqat bilan, ehtiyotkorlik bilan." },
    { prompt: "Choose the opposite of “increase”.", choices: ["Improve", "Reduce", "Include", "Repeat"], answer: 1, explanation: "Reduce — kamaytirmoq; increase — oshirmoq." },
    { prompt: "Which is a question?", choices: ["You are ready.", "Are you ready?", "You ready are.", "Ready you are."], answer: 1, explanation: "Yes/no savolda to be fe’li egadan oldin keladi." },
    { prompt: "“Achieve a goal” nimani anglatadi?", choices: ["Maqsadni unutish", "Maqsadga erishish", "Rejani kechiktirish", "Savol berish"], answer: 1, explanation: "Achieve a goal — maqsadga erishmoq." },
  ],
  coding: [
    { prompt: "JavaScript’da qat’iy tenglik operatori qaysi?", choices: ["=", "==", "===", "!="], answer: 2, explanation: "=== qiymatni ham, ma’lumot turini ham tekshiradi." },
    { prompt: "Massiv oxiriga element qo‘shish metodi?", choices: ["push()", "shift()", "slice()", "pop()"], answer: 0, explanation: "push() massivning oxiriga yangi element qo‘shadi." },
    { prompt: "const bilan e’lon qilingan massivni o‘zgartirish mumkinmi?", choices: ["Yo‘q, umuman mumkin emas", "Ha, elementlarini o‘zgartirish mumkin", "Faqat sonlarni", "Faqat bo‘sh bo‘lsa"], answer: 1, explanation: "const qayta tayinlashni cheklaydi, lekin massiv ichini mutatsiya qilish mumkin." },
    { prompt: "Array uzunligini qaysi xususiyat qaytaradi?", choices: ["size", "count", "length", "total"], answer: 2, explanation: "Massiv elementlari soni array.length orqali olinadi." },
    { prompt: "Funksiya natijasini qaytarish uchun nima ishlatiladi?", choices: ["break", "return", "yielding", "send"], answer: 1, explanation: "return qiymatni chaqiruvchi kodga qaytaradi." },
    { prompt: "Boolean qiymat qaysi juftlikdan iborat?", choices: ["yes/no", "on/off", "true/false", "1/2"], answer: 2, explanation: "Boolean ikki qiymatga ega: true va false." },
    { prompt: "DOM nimani anglatadi?", choices: ["Document Object Model", "Data Order Method", "Digital Output Mode", "Document Oriented Map"], answer: 0, explanation: "DOM veb-hujjatni obyektlar daraxti sifatida ifodalaydi." },
    { prompt: "Shart bajarilishini tekshirish uchun nima ishlatiladi?", choices: ["if", "import", "type", "export"], answer: 0, explanation: "if shart rost bo‘lganda kod blokini bajaradi." },
  ],
  cyber: [
    { prompt: "Xat parolingizni shoshilinch havola orqali so‘radi. Nima qilasiz?", choices: ["Parolni yuboraman", "Linkni tekshirmay ochaman", "Mustaqil kanal orqali tekshiraman", "Xatni hammaga jo‘nataman"], answer: 2, explanation: "Parolni havolaga kiritmang. Xizmatga rasmiy manzil orqali o‘zingiz kiring." },
    { prompt: "Kuchli parolning yaxshi xususiyati qaysi?", choices: ["Ism va tug‘ilgan sana", "Har saytga bitta parol", "Uzun va noyob bo‘lishi", "Faqat 123 raqamlari"], answer: 2, explanation: "Uzun, noyob parol ishlating; parol menejeri yordam beradi." },
    { prompt: "MFA nima uchun foydali?", choices: ["Qo‘shimcha kirish himoyasi", "Internetni tezlashtiradi", "Fayllarni siqadi", "Reklamani yashiradi"], answer: 0, explanation: "Ko‘p omilli autentifikatsiya paroldan tashqari yana bir tasdiq talab qiladi." },
    { prompt: "Umumiy Wi-Fi’da eng to‘g‘ri odat?", choices: ["Har qanday sertifikatni qabul qilish", "Maxfiy ishda ehtiyot bo‘lish", "Fayl almashishni yoqish", "Barcha akkauntdan chiqish shart emas"], answer: 1, explanation: "Tarmoqqa ehtiyotkor yondashing, HTTPS’dan foydalaning va nozik amallarni himoyalangan tarmoqda bajaring." },
    { prompt: "Kutilmagan fayl ilovasi keldi. Nima qilasiz?", choices: ["Darhol ishga tushiraman", "Yuboruvchini tekshirib, xavfsizlikka xabar beraman", "Boshqalarga yuboraman", "Himoyani o‘chiraman"], answer: 1, explanation: "Kutilmagan ilovani ochmang; yuboruvchini boshqa kanal orqali tasdiqlang." },
    { prompt: "Dasturiy ta’minotni yangilash nima uchun muhim?", choices: ["Zaifliklarni tuzatishi mumkin", "Faqat ranglarni almashtiradi", "Parolni bekor qiladi", "Har doim internetni o‘chiradi"], answer: 0, explanation: "Yangilanishlar xavfsizlik tuzatishlari va barqarorlik yaxshilanishlarini olib kelishi mumkin." },
    { prompt: "Maxfiy kodni kimga yuborish kerak?", choices: ["Qo‘llab-quvvatlashga", "Hech kimga", "Do‘stga", "Xat jo‘natuvchiga"], answer: 1, explanation: "Bir martalik kodlarni ham hech kim bilan bo‘lishmang." },
    { prompt: "Fishing xabarining ehtimoliy belgisi?", choices: ["Kutilmagan shoshiltirish", "Tanish rasmiy ilova", "Siz boshlagan aloqa", "Odatdagi xavfsiz ish oqimi"], answer: 0, explanation: "Shoshiltirish, g‘alati domen va maxfiy ma’lumot so‘rashi — ogohlantiruvchi belgilar." },
  ],
};


const extraQuestions: Record<string, Question[]> = {
 english:[
 {prompt:"Choose the correct past form: “I ___ my homework yesterday.”",choices:["finish","finished","finishing","finishes"],answer:1,explanation:"Yesterday o‘tgan vaqtni bildiradi; finish fe’lining Past Simple shakli finished."},
 {prompt:"“Although” gapda qanday vazifa bajaradi?",choices:["Qarama-qarshilikni bog‘laydi","Sababni bildiradi","Joyni bildiradi","Buyruq beradi"],answer:0,explanation:"Although — garchi ma’nosida zid fikrlarni bog‘laydi."},
 {prompt:"Choose the natural phrase.",choices:["Make a decision","Do a decision","Take a decisioning","Made decisioning"],answer:0,explanation:"Ingliz tilida odatiy birikma — make a decision."},
 {prompt:"“I have lived here ___ 2022.”",choices:["for","since","during","from"],answer:1,explanation:"Since aniq boshlanish nuqtasi bilan ishlatiladi; 2022 — boshlanish nuqtasi."}
 ],
 coding:[
 {prompt:"JavaScript’da yangi o‘zgartirilgan massiv qaytaradigan metod?",choices:["map()","push()","pop()","alert()"],answer:0,explanation:"map() har bir elementga callback qo‘llab, yangi massiv qaytaradi."},
 {prompt:"JavaScript’da Boolean(0) natijasi?",choices:["true","false","0","undefined"],answer:1,explanation:"0 falsy qiymat; Boolean(0) false qaytaradi."},
 {prompt:"Async funksiyada Promise natijasini kutish uchun nima ishlatiladi?",choices:["await","defer","yieldNow","hold"],answer:0,explanation:"await Promise yakunlanishini kutadi va natijasini oladi."},
 {prompt:"Obyekt xususiyatini nuqta orqali olish usuli?",choices:["user.name","user->name","user::name","user/name"],answer:0,explanation:"Dot notation: user.name."}
 ],
 cyber:[
 {prompt:"Brauzer sayt sertifikati haqida ogohlantirdi. Eng xavfsiz qadam?",choices:["Baribir davom etish","Ogohlantirishni chetlab o‘tmaslik","Parolni sinash","VPN’ni o‘chirib qayta kirish"],answer:1,explanation:"Ogohlantirishni chetlab o‘tmang; manzilni tekshirib, rasmiy kanal orqali xabar bering."},
 {prompt:"Bir xil parolni ko‘p saytda ishlatish xavfi?",choices:["Bitta sizib chiqish boshqa akkauntlarni ham xavfga qo‘yadi","Hisoblar tezroq ishlaydi","MFA avtomatik yoqiladi","Xavfsizlik oshadi"],answer:0,explanation:"Bir xizmatdagi parol oshkor bo‘lsa, boshqa akkauntlar ham buzilishi mumkin."},
 {prompt:"Kutilmagan faylni ochishdan oldin nimani tekshirasiz?",choices:["Yuboruvchi va fayl kutilganmi","Faqat fayl rangini","Nomining uzunligini","Kompyuter ovozini"],answer:0,explanation:"Kutilmagan faylni ochmang; yuboruvchini mustaqil kanal orqali tasdiqlang."},
 {prompt:"Dasturiy ta’minotni qayerdan olish ma’qul?",choices:["Rasmiy sayt yoki ishonchli store","Tasodifiy fayl havolasi","Noma’lum chatdagi APK","Pop-up reklama"],answer:0,explanation:"Dasturlarni ishlab chiquvchining rasmiy manbasi yoki ishonchli do‘kondan oling."}
 ]
};

const missions = [
  { title: "Birinchi qadam", detail: "Bitta o‘yinni yakunlang", reward: "+10 XP", icon: Target },
  { title: "Aniqlik ustasi", detail: "Kamida 80% to‘g‘ri javob", reward: "+15 XP", icon: Sparkles },
  { title: "Ikki karra mashq", detail: "Ikki xil o‘yinni yakunlang", reward: "+20 XP", icon: Trophy },
];

export default function LearningExperienceLab() {
  const [trackId, setTrackId] = useState("english");
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [roundQuestions, setRoundQuestions] = useState<Question[]>(questionSets.english);
  const [finished, setFinished] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  const [duelOpen, setDuelOpen] = useState(false);

  const track = tracks.find((item) => item.id === trackId)!;
  const questions = roundQuestions;
  const correctCount = answers.filter((value, i) => value === questions[i]?.answer).length;
  const accuracy = answers.length ? Math.round((correctCount / answers.length) * 100) : 0;
  const current = questions[index];

  function startGame() {
    const pool = [...questionSets[trackId], ...(extraQuestions[trackId] ?? [])];
    const randomized = [...pool].sort(() => Math.random() - 0.5).slice(0, 8).map((question) => {
      const options = question.choices.map((choice, i) => ({ choice, originalIndex: i })).sort(() => Math.random() - 0.5);
      return { ...question, choices: options.map((option) => option.choice), answer: options.findIndex((option) => option.originalIndex === question.answer) };
    });
    setRoundQuestions(randomized);
    setIndex(0);
    setPicked(null);
    setAnswers([]);
    setFinished(false);
    setPlaying(true);
  }

  function submitAnswer() {
    if (picked === null) return;
    const nextAnswers = [...answers, picked];
    setAnswers(nextAnswers);
    if (index === questions.length - 1) {
      const correct = nextAnswers.filter((value, i) => value === questions[i].answer).length;
      setFinished(true);
      setDone((old) => Array.from(new Set([
        ...old,
        "Birinchi qadam",
        ...(correct / questions.length >= 0.8 ? ["Aniqlik ustasi"] : []),
      ])));
    } else {
      setIndex((value) => value + 1);
      setPicked(null);
    }
  }

  if (playing) {
    return (
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 text-slate-900 dark:bg-[#0a1020] dark:text-white sm:px-6 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <button onClick={() => setPlaying(false)} className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-white hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white">
            <ArrowLeft size={17} /> Learning markaziga qaytish
          </button>
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-[#111a2b]">
            {!finished ? <>
              <header className="border-b border-slate-100 p-5 dark:border-white/10 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">{track.name} · MASHQ</p><h1 className="mt-1 text-lg font-black sm:text-xl">Bilimingizni sinang</h1></div>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">{index + 1}/{questions.length}</span>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-500 transition-all duration-500" style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
              </header>
              <div className="p-5 sm:p-8">
                <div className="py-5 text-center sm:py-8"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">TO‘G‘RI JAVOBNI TANLANG</p><h2 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">{current.prompt}</h2></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {current.choices.map((choice, i) => {
                    const revealed = picked !== null;
                    const isRight = i === current.answer;
                    const isPicked = picked === i;
                    const styles = revealed && isRight ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200" : isPicked ? "border-violet-500 bg-violet-50 text-violet-900 dark:bg-violet-500/10 dark:text-violet-100" : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50 dark:border-white/10 dark:bg-white/[.03] dark:hover:bg-white/[.06]";
                    return <button key={choice} disabled={revealed} onClick={() => setPicked(i)} className={`flex min-h-[66px] items-center gap-3 rounded-2xl border-2 p-4 text-left font-semibold transition ${styles}`}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-black text-slate-500 dark:bg-white/10">{String.fromCharCode(65 + i)}</span><span className="flex-1">{choice}</span>{revealed && isRight && <Check size={19} className="text-emerald-600" />}</button>;
                  })}
                </div>
                {picked !== null && <div aria-live="polite" className={`mt-5 rounded-2xl border p-4 ${picked === current.answer ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10" : "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10"}`}><p className="font-extrabold">{picked === current.answer ? "Ajoyib, to‘g‘ri!" : "Yaxshi urinish — birga o‘rganamiz."}</p><p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{current.explanation}</p></div>}
                <div className="mt-6 flex justify-end"><button disabled={picked === null} onClick={submitAnswer} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-6 font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-900">{index === questions.length - 1 ? "Natijani ko‘rish" : "Davom etish"} <ArrowRight size={17}/></button></div>
              </div>
            </> : <div className="p-6 text-center sm:p-12">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-amber-50 text-amber-500 dark:bg-amber-400/10"><Trophy size={38}/></div>
              <p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-violet-600">RAUND YAKUNLANDI</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Zo‘r harakat!</h1><p className="mt-2 text-slate-500 dark:text-slate-400">Mashq natijangiz tayyor.</p>
              <div className="mx-auto mt-7 grid max-w-md grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-50 p-5 dark:bg-white/[.05]"><p className="text-xs font-bold text-slate-500">TO‘G‘RI JAVOB</p><p className="mt-1 text-3xl font-black">{correctCount}<span className="text-lg text-slate-400">/{questions.length}</span></p></div><div className="rounded-2xl bg-slate-50 p-5 dark:bg-white/[.05]"><p className="text-xs font-bold text-slate-500">ANIQLIK</p><p className="mt-1 text-3xl font-black">{accuracy}%</p></div></div>
              <p className="mx-auto mt-4 max-w-md rounded-2xl border border-dashed border-slate-300 p-4 text-left text-sm text-slate-600 dark:border-white/15 dark:text-slate-300">{accuracy >= 80 ? "Ajoyib natija! Shu ritmda davom eting." : "Yaxshi urinish. Izohlarni takrorlab, yana urinib ko‘ring."} Bu demo raund: XP yoki profilingizga ma’lumot yozilmadi.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-3"><button onClick={startGame} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 font-bold text-white hover:bg-violet-700 dark:bg-white dark:text-slate-900"><Zap size={17}/> Yana mashq qilish</button><button onClick={() => setPlaying(false)} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-5 font-bold hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5">Markazga qaytish</button></div>
            </div>}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f8f7] px-3 py-3 text-slate-900 dark:bg-[#101716] dark:text-white sm:px-5 sm:py-5 xl:px-8">
      <div className="mx-auto w-full max-w-[1680px]">
        <div className="grid items-start gap-4 lg:grid-cols-[218px_minmax(0,1fr)] 2xl:grid-cols-[236px_minmax(0,1fr)_300px]">
          <aside className="hidden lg:block lg:sticky lg:top-24"><nav aria-label="O‘rganish navigatsiyasi" className="space-y-1 rounded-3xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#111a2b]"><p className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[.16em] text-slate-400">O‘QUV MARKAZI</p><a href="#journey" className="flex items-center gap-3 rounded-xl bg-emerald-50 px-3 py-3 text-sm font-extrabold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200"><span>🧭</span> Mening yo‘lim</a><a href="#games" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"><span>🎮</span> Mashq o‘yinlari</a><a href="#duel" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"><span>⚔️</span> Do‘st bilan duel</a><a href="#missions" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"><span>🏆</span> Missiyalar</a><div className="my-2 border-t border-slate-100 dark:border-white/10"/><p className="px-3 py-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-400">YO‘NALISHLAR</p>{tracks.map((t)=>{const I=t.icon;return <button key={t.id} onClick={()=>setTrackId(t.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${trackId===t.id?"bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white":"text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5"}`}><I size={18}/>{t.name}</button>})}</nav><div className="mt-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-4 text-white"><Sparkles size={18}/><p className="mt-2 text-sm font-black">Bugun ham ozgina.</p><p className="mt-1 text-xs leading-relaxed text-emerald-50/85">Muntazam mashq katta natija beradi.</p></div></aside>
          <div className="space-y-7">
            <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-800 p-5 text-white shadow-xl sm:p-8">
              <div className="pointer-events-none absolute -right-8 -top-12 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl"/>
              <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-200">BUGUNGI MAQSAD · BIR QADAM OLDINGA</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Bugun o‘zingdan bir qadam oldinda bo‘l.</h2><p className="mt-3 text-sm text-slate-300">Bir ko‘nikmani tanlang, qisqa mashqni bajaring va bilimni amalda mustahkamlang.</p><button onClick={startGame} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 text-sm font-extrabold text-emerald-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-50">Mashqni boshlash <ArrowRight size={17}/></button></div>
                <div className="grid grid-cols-2 gap-3 sm:min-w-56"><div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3"><p className="text-xs text-slate-300">Missiyalar</p><p className="mt-1 text-2xl font-black">{done.length}<span className="text-sm text-slate-300">/3</span></p></div><div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3"><p className="text-xs text-slate-300">Raund</p><p className="mt-1 text-2xl font-black text-amber-300">8 <span className="text-sm text-slate-300">savol</span></p></div></div>
              </div>
            </section>
            <section><div id="tracks" className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-600">O‘RGANISH YO‘NALISHI</p><h2 className="mt-1 text-xl font-black sm:text-2xl">Ko‘nikmalaringiz</h2></div><span className="text-xs font-semibold text-slate-400">3 yo‘nalish · prototip</span></div>
              <div className="grid gap-3 sm:grid-cols-3">{tracks.map((item) => { const Icon = item.icon; const active = item.id === trackId; return <button key={item.id} onClick={() => setTrackId(item.id)} className={`group rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${active ? "border-violet-400 bg-white shadow-lg shadow-violet-950/5 ring-2 ring-violet-500/10 dark:bg-[#111a2b]" : "border-slate-200 bg-white/75 hover:border-slate-300 dark:border-white/10 dark:bg-white/[.025]"}`}><div className="flex items-center justify-between"><span className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${item.tone} text-white shadow-md`}><Icon size={22}/></span>{active ? <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[9px] font-black tracking-wide text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">TANLANDI</span> : <ChevronRight size={17} className="text-slate-300"/>}</div><h3 className="mt-4 font-extrabold">{item.name}</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.caption}</p><p className="mt-4 text-[10px] font-bold text-slate-400">{active ? "Faol yo‘nalish" : "Yo‘nalishni tanlash"}</p></button>;})}</div><p className="mt-2 text-[10px] text-slate-400">Tanlovlar faqat shu sahifa demo holatiga ta’sir qiladi; profilingizga saqlanmaydi.</p></section>
            <section><div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-600">DAILY QUESTS</p><h2 className="mt-1 text-xl font-black sm:text-2xl">Bugungi missiyalar</h2></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{done.length}/3 bajarildi</span></div>
              <div className="space-y-2.5">{missions.map((mission) => { const Icon = mission.icon; const completed = done.includes(mission.title); return <article key={mission.title} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition dark:border-white/10 dark:bg-[#111a2b] sm:gap-4"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${completed ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-slate-100 text-slate-500 dark:bg-white/[.06]"}`}>{completed ? <Check size={20}/> : <Icon size={20}/>}</div><div className="min-w-0 flex-1"><h3 className="text-sm font-extrabold">{mission.title}</h3><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{mission.detail}</p></div><div className="text-right"><p className={`text-sm font-black ${completed ? "text-emerald-600" : "text-amber-600"}`}>{completed ? "Bajarildi" : mission.reward}</p>{completed && <p className="text-[10px] font-semibold text-emerald-600">✓ Tamom</p>}</div></article>;})}</div>
            </section>
            <section id="games"><div className="mb-3"><p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-600">PLAY · PRACTICE · GROW</p><h2 className="mt-1 text-xl font-black sm:text-2xl">O‘yinlar maydoni</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{track.name} uchun mashqlar.</p></div>
              <div className="grid gap-3 md:grid-cols-2"><article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-[#111a2b]"><div className="flex items-start justify-between"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-2xl dark:from-amber-500/15 dark:to-orange-500/15">⚡</div><span className="rounded-full bg-violet-50 px-2.5 py-1 text-[9px] font-black text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">QUICK PLAY</span></div><h3 className="mt-4 text-lg font-black">{trackId === "english" ? "Word Sprint" : trackId === "coding" ? "Bug Hunter" : "Phishing detektori"}</h3><p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{trackId === "english" ? "So‘zlar, ma’nolar va kontekst. Tez fikrlang, yaxshiroq eslab qoling." : trackId === "coding" ? "Kod mantig‘i va JavaScript asoslarini sinang." : "Raqamli xavflarni tanib, xavfsiz qarorlar qabul qiling."}</p><div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400"><span>8 savol</span><span>·</span><span>3–5 daqiqa</span><span>·</span><span>Practice</span></div><button onClick={startGame} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-extrabold text-white transition hover:bg-violet-700 dark:bg-white dark:text-slate-950 dark:hover:bg-violet-200">O‘yinni boshlash <ArrowRight size={16}/></button></article>
                <article id="duel" className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/70 p-5 dark:border-emerald-400/20 dark:from-[#111a2b] dark:to-emerald-950/20"><div className="flex items-start justify-between"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-2xl dark:bg-emerald-500/15">⚔️</div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-[9px] font-black text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">DUEL · REJALASHTIRILMOQDA</span></div><h3 className="mt-4 text-lg font-black">So‘z zanjiri — 1v1</h3><p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Bitta ko‘nikma tanlang. Raqib bilan navbatma-navbat shu mavzuga oid, oldingi so‘zning oxirgi harfidan boshlanadigan yangi so‘z toping.</p><div className="mt-3 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-white/80 p-2 dark:bg-white/5"><p className="text-lg font-black">60s</p><p className="text-[10px] text-slate-500">Jami</p></div><div className="rounded-xl bg-white/80 p-2 dark:bg-white/5"><p className="text-lg font-black">15s</p><p className="text-[10px] text-slate-500">Har navbat</p></div><div className="rounded-xl bg-white/80 p-2 dark:bg-white/5"><p className="text-lg font-black">1v1</p><p className="text-[10px] text-slate-500">Raqib</p></div></div><p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Onlayn juftlash, mavzu bo‘yicha so‘z tekshiruvi, taklifni chatga yuborish va server taymeri hali ulanmagan. Ishlamaydigan matchmaking tugmasini ko‘rsatmaymiz.</p><button onClick={() => setDuelOpen(true)} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-extrabold text-white transition hover:bg-emerald-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400">Duel o‘ynash <ArrowRight size={16}/></button></article>
              </div>
            </section>
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-4 text-xs leading-relaxed text-slate-500 dark:border-white/15 dark:bg-white/[.02]">Prototip eslatmasi: mashqlar interaktiv. XP, streak va progress ko‘rsatkichlari haqiqiy profilingizga yozilmaydi. Haqiqiy mukofotlar xavfsiz backend bosqichida ulanadi.</p>
          </div>
          <aside className="hidden space-y-4 xl:block"><section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#111a2b]"><div className="flex items-center justify-between"><p className="text-xs font-extrabold text-slate-500">SIZNING PROGRESSINGIZ</p><Trophy size={19} className="text-amber-500"/></div><div className="mt-5 flex items-end gap-2"><span className="text-3xl font-black">Profilga ulanish</span></div><p className="mt-2 text-sm leading-relaxed text-slate-500">Hozircha mashq natijalari akkauntga saqlanmaydi. Haqiqiy daraja va XP backend integratsiyasidan keyin ko‘rsatiladi.</p></section>
            <section className="rounded-3xl border border-dashed border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#111a2b]"><div className="flex items-center gap-2"><Flame size={19} className="text-orange-500"/><h3 className="font-extrabold">Haftalik faollik</h3></div><p className="mt-2 text-sm leading-relaxed text-slate-500">Kunlar kesimidagi haqiqiy faollik hali ulanmagan. Mashqlar yakunlari profilingizda saqlanadigan tizim navbatdagi bosqichda qo‘shiladi.</p></section>
            <section className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white"><div className="flex items-center gap-2"><Sparkles size={18}/><p className="text-xs font-black uppercase tracking-wider">SMART TIP</p></div><h3 className="mt-3 text-lg font-black">Oz-ozdan, muntazam.</h3><p className="mt-2 text-sm leading-relaxed text-emerald-50/85">Yangi bilimni bugun o‘rganib, ertaga yana takrorlang.</p></section>
          </aside>
        </div>
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 text-[10px] text-slate-400 dark:border-white/10"><span>ZIKRA</span><span>O‘quv interfeysi · progress integratsiyasi kutilmoqda</span></footer>
        {duelOpen && <SkillDuel onClose={() => setDuelOpen(false)} skill={track.name} /> }
      </div>
    </main>
  );
}
