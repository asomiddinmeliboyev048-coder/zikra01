"use client";

import { useMemo, useState } from "react";

const tracks = [
  { id: "english", name: "Ingliz tili", icon: "🌍", color: "from-sky-500 to-blue-600", level: "Boshlang‘ich", xp: 320 },
  { id: "coding", name: "Dasturlash", icon: "💻", color: "from-violet-500 to-fuchsia-600", level: "Boshlang‘ich", xp: 150 },
  { id: "cyber", name: "Kiberxavfsizlik", icon: "🛡️", color: "from-emerald-500 to-teal-600", level: "Boshlang‘ich", xp: 80 },
  { id: "logic", name: "Mantiq", icon: "🧠", color: "from-amber-500 to-orange-600", level: "Boshlang‘ich", xp: 0 },
];

const quests = [
  { id: 1, title: "Bugungi bilim sprinti", detail: "10 ta savolga javob ber", reward: 20, icon: "⚡", skill: "english" },
  { id: 2, title: "Xotirani charxla", detail: "5 ta yangi tushunchani eslab qol", reward: 25, icon: "🧩", skill: "english" },
  { id: 3, title: "Mukammallikka bir qadam", detail: "Bitta qisqa mashqni yakunla", reward: 15, icon: "🎯", skill: "english" },
  { id: 4, title: "Kod ovchisi", detail: "Koddagi 3 ta xatoni top", reward: 30, icon: "🐞", skill: "coding" },
  { id: 5, title: "Algoritm yo‘li", detail: "Amallarni to‘g‘ri tartibla", reward: 25, icon: "🧩", skill: "coding" },
  { id: 6, title: "Xavfsizlik skauti", detail: "5 ta phishing belgisini aniqlash", reward: 30, icon: "🔐", skill: "cyber" },
  { id: 7, title: "Mantiq sinovi", detail: "3 ta jumboqni yech", reward: 20, icon: "🧠", skill: "logic" },
];

const games = [
  { name: "Tezkor duel", desc: "Qisqa savollarda chaqqonlik va aniqlik", icon: "⚔️", tag: "1 ga 1", status: "Tez kunda" },
  { name: "Bilim arenasi", desc: "Bir nechta bosqichdan o‘tib, rekord o‘rnat", icon: "🏆", tag: "Solo", status: "Tez kunda" },
  { name: "Jamoaviy challenge", desc: "Do‘stlar bilan bir maqsad sari", icon: "🤝", tag: "Jamoa", status: "Tez kunda" },
];

export default function SkillMissionsHub() {
  const [selected, setSelected] = useState("english");
  const [done, setDone] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);
  const skill = tracks.find((t) => t.id === selected)!;
  const visibleQuests = useMemo(() => quests.filter((q) => q.skill === selected), [selected]);
  const earned = done.reduce((sum, id) => sum + (quests.find((q) => q.id === id)?.reward ?? 0), 0);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-5 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">ZIKRA · O‘SISH MAYDONI</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Bugun o‘zingdan<br className="hidden sm:block"/> bir qadam oldinda bo‘l.</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">Ko‘nikma tanla, missiyalarni bajar va bilimni o‘yin orqali mustahkamla.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur"><p className="text-xs text-slate-300">Bajarildi</p><p className="mt-1 text-2xl font-black">{done.length}<span className="text-sm font-medium text-slate-300">/{visibleQuests.length}</span></p></div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur"><p className="text-xs text-slate-300">Toplangan XP</p><p className="mt-1 text-2xl font-black text-amber-300">+{earned}</p></div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-wider text-violet-600">Shaxsiy yo‘nalish</p><h2 className="mt-1 text-2xl font-black text-gray-900 dark:text-white">Ko‘nikmalarim</h2></div>
          <button onClick={() => setShowAll(!showAll)} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-white/15 dark:hover:bg-white/5">{showAll ? "Yopish" : "＋ Ko‘nikma qo‘shish"}</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tracks.filter((t) => showAll || t.id === "english" || t.id === "coding" || t.id === "cyber").map((t) => {
            const active = selected === t.id;
            return <button key={t.id} onClick={() => { setSelected(t.id); setDone([]); }} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${active ? "border-violet-500 bg-violet-50 ring-2 ring-violet-500/15 dark:bg-violet-500/10" : "border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"}`}>
              <div className="flex items-start justify-between"><span className="text-3xl">{t.icon}</span>{active && <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-bold text-white">TANLANGAN</span>}</div>
              <h3 className="mt-4 font-bold text-gray-900 dark:text-white">{t.name}</h3>
              <p className="mt-1 text-xs text-gray-500">{t.level} · {t.xp} XP</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"><div className={`h-full rounded-full bg-gradient-to-r ${t.color}`} style={{width:`${Math.min(100,t.xp/10)}%`}}/></div>
            </button>;
          })}
        </div>
        <p className="mt-2 text-xs text-gray-500">Ko‘nikmani tanlang — shu yo‘nalishdagi missiyalarni ko‘rasiz.</p>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Har kuni ozgina</p><h2 className="mt-1 text-2xl font-black text-gray-900 dark:text-white">Bugungi missiyalar</h2></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{done.length}/{visibleQuests.length} bajarildi</span></div>
        <div className="space-y-3">
          {visibleQuests.map((q) => {
            const completed = done.includes(q.id);
            return <article key={q.id} className={`flex items-center gap-3 rounded-2xl border p-4 sm:gap-4 ${completed ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/5" : "border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"}`}>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gray-100 text-2xl dark:bg-white/10">{q.icon}</span>
              <div className="min-w-0 flex-1"><h3 className="font-bold text-gray-900 dark:text-white">{q.title}</h3><p className="mt-1 text-sm text-gray-500">{q.detail}</p><p className="mt-2 text-xs font-extrabold text-amber-600">✦ {q.reward} XP</p></div>
              <button disabled={completed} onClick={() => setDone((old) => [...old,q.id])} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition sm:text-sm ${completed ? "cursor-default bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-gray-900 text-white hover:bg-violet-700 dark:bg-white dark:text-gray-900"}`}>{completed ? "✓ Bajarildi" : "Bajarish"}</button>
            </article>;
          })}
        </div>
        {done.length > 0 && <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">Ajoyib! Bu sahifadagi demo sessiyada {earned} XP yig‘dingiz. Hozircha natijalar saqlanmaydi.</p>}
      </section>

      <section>
        <div className="mb-4"><p className="text-xs font-bold uppercase tracking-wider text-amber-600">Bilim bellashuvi</p><h2 className="mt-1 text-2xl font-black text-gray-900 dark:text-white">O‘yinlar & Battllar</h2><p className="mt-1 text-sm text-gray-500">Mashq qil, rekord yangila yoki do‘stlar bilan bellash.</p></div>
        <div className="grid gap-3 md:grid-cols-3">{games.map((g) => <article key={g.name} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]"><div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-2xl dark:bg-violet-500/10">{g.icon}</span><span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-500 dark:bg-white/10">{g.tag}</span></div><h3 className="mt-4 font-bold text-gray-900 dark:text-white">{g.name}</h3><p className="mt-1 min-h-10 text-sm leading-relaxed text-gray-500">{g.desc}</p><div className="mt-4 flex items-center justify-between gap-2"><span className="text-xs font-semibold text-violet-600">{g.status}</span><span className="text-xs text-gray-400">✦ {skill.name}</span></div></article>)}</div>
      </section>
      <p className="rounded-xl border border-dashed border-gray-300 p-3 text-xs leading-relaxed text-gray-500 dark:border-white/15">Dizayn prototipi: missiya belgilari faqat shu ochiq sahifa sessiyasida ishlaydi. XP, profil ko‘nikmalari, kun yangilanishi va real-time battllar keyingi backend bosqichida ulanadi.</p>
    </div>
  );
}
