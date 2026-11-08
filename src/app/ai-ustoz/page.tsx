"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, CircleHelp, Mic, MicOff, Send, Sparkles, Volume2, VolumeX, Waves } from "lucide-react";
import "./ai-tutor.css";
import LiveVoicePanel from "./LiveVoicePanel";

type Track = "english" | "russian" | "coding" | "cyber";
type Message = { role: "user" | "assistant"; content: string; id: string };
const tracks: { id: Track; label: string; sub: string; flag: string }[] = [
  { id: "english", label: "Ingliz tili", sub: "Speaking · Vocabulary · Grammar", flag: "🇬🇧" },
  { id: "russian", label: "Rus tili", sub: "Разговор · Словарный запас", flag: "🇷🇺" },
  { id: "coding", label: "Dasturlash", sub: "JavaScript · Python · React", flag: "⌘" },
  { id: "cyber", label: "Kiberxavfsizlik", sub: "Network · Security · Practice", flag: "⌁" },
];
const starter: Record<Track, string> = {
  english: "Bugun ingliz tilida kichik suhbat qilamiz. Avval oson savol: What do you usually do in your free time? 😊",
  russian: "Сегодня немного поговорим по-русски! Начнём с простого: Чем ты любишь заниматься в свободное время? 😊",
  coding: "Bugun kod yozamiz! 😎 Qaysi texnologiyada mashq qilamiz: JavaScript, Python yoki React? Men bugun semikolondan qo‘rqmayman, va’da! 😂",
  cyber: "Bugun kiberxavfsizlik bo‘yicha fikrlaymiz. Tasavvur qil: noma’lum email keldi va ichida havola bor. Uni ochishdan oldin nimalarni tekshirasan? 🔐",
};

function makeId() { return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now() + Math.random()); }

export default function AiTutorPage() {
  const [track, setTrack] = useState<Track>("english");
  const [level, setLevel] = useState("Boshlang‘ich");
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: starter.english, id: "welcome" }]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, sending]);

  function changeTrack(next: Track) {
    setTrack(next);
    setMessages([{ role: "assistant", content: starter[next], id: makeId() }]);
    setError("");
  }

  async function sendMessage(value = draft) {
    const content = value.trim();
    if (!content || sending) return;
    const next: Message[] = [...messages, { role: "user", content, id: makeId() }];
    setMessages(next);
    setDraft("");
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track, level, messages: next.slice(-14).map(({ role, content: text }) => ({ role, content: text })) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Javob olinmadi.");
      const answer = String(payload.reply || "");
      setMessages((current) => [...current, { role: "assistant", content: answer, id: makeId() }]);
      if (voiceEnabled) void speak(answer);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Noma’lum xatolik.");
    } finally { setSending(false); }
  }

  async function speak(text: string) {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "uz-UZ";
    utterance.rate = 0.96;
    utterance.pitch = 1.06;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function startListening() {
    type Recognition = { lang: string; interimResults: boolean; continuous: boolean; onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };
    const browser = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const SpeechRecognition = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!SpeechRecognition) { setError("Bu brauzer ovozli kiritishni qo‘llamaydi. Matn orqali yozishingiz mumkin."); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = track === "english" ? "en-US" : track === "russian" ? "ru-RU" : "uz-UZ";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const result = event.results[0]?.[0]?.transcript || "";
      setDraft((current) => current ? current + " " + result : result);
    };
    recognition.onerror = () => { setListening(false); setError("Mikrofon ishlamadi. Brauzer ruxsatini tekshiring."); };
    recognition.onend = () => setListening(false);
    try { recognition.start(); setListening(true); setError(""); } catch { setListening(false); }
  }

  return (
    <main className="zikra-ai min-h-[100svh] overflow-hidden bg-[#11151c] text-slate-100">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col px-3 pb-4 pt-3 sm:px-6 sm:pt-6">
        <header className="flex items-center justify-between gap-3">
          <Link href="/learn" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/10"><ArrowLeft size={16}/> Orqaga</Link>
          <div className="flex items-center gap-2 text-sm font-black tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-white to-slate-400 text-slate-800"><Sparkles size={17}/></span>Zikra AI Ustoz</div>
          <button onClick={() => setVoiceEnabled((value) => !value)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-slate-300" aria-label="Ovoz sozlamasi">{voiceEnabled ? <Volume2 size={17}/> : <VolumeX size={17}/>}</button>
        </header>

        <div className="mt-4"><LiveVoicePanel track={track} level={level} /></div>

        <section className="mt-4 grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex min-h-[72svh] flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(145deg,#252d39,#171d26_55%,#303947)] shadow-[0_30px_100px_-50px_rgba(0,0,0,.9)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
              <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-slate-400">Sizning shaxsiy AI murabbiyingiz</p><p className="mt-1 text-sm font-bold">O‘zbekcha tushuntiradi · Birga mashq qiladi</p></div>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300"/> Tayyor</span>
            </div>

            <div className="relative flex min-h-[245px] flex-col items-center justify-center overflow-hidden border-b border-white/10 bg-[radial-gradient(ellipse_at_center,rgba(203,213,225,.16),transparent_62%)] px-4 py-5">
              <div className={`zikra-orb ${speaking || sending || listening ? "is-active" : ""}`}>
                <div className="zikra-orb-core"><div className="zikra-orb-eyes"><i/><i/></div><div className="zikra-orb-smile"/></div>
                <span className="zikra-orb-ring ring-one"/><span className="zikra-orb-ring ring-two"/><span className="zikra-orb-ring ring-three"/>
              </div>
              <p className="mt-5 text-base font-black">Ziyo <span className="text-slate-400">· AI Ustoz</span></p>
              <p className="mt-1 text-xs text-slate-400">{listening ? "Sizni tinglayapman…" : sending ? "Javob tayyorlayapman…" : speaking ? "Gapiryapman…" : "Bugun nimani o‘rganamiz?"}</p>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
              {messages.map((message) => <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm ${message.role === "user" ? "rounded-br-md bg-slate-100 text-slate-900" : "rounded-bl-md border border-white/10 bg-white/[0.07] text-slate-100"}`}>
                  {message.role === "assistant" && <p className="mb-1 text-[9px] font-black uppercase tracking-[.18em] text-slate-400">ZIYO · USTOZ</p>}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.role === "assistant" && <button onClick={() => void speak(message.content)} className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white"><Volume2 size={13}/> Eshitish</button>}
                </div>
              </div>)}
              {sending && <div className="flex items-center gap-2 text-xs text-slate-400"><span className="flex gap-1"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300"/><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:120ms]"/><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:240ms]"/></span>Ziyo o‘ylayapti…</div>}
            </div>

            {error && <p role="alert" className="mx-4 mb-2 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs text-rose-200 sm:mx-6">{error}</p>}
            <form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="flex items-center gap-2 border-t border-white/10 bg-black/10 p-3 sm:p-4">
              <button type="button" onClick={startListening} disabled={listening || sending} aria-label="Ovoz bilan yozish" className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border transition ${listening ? "border-rose-300/30 bg-rose-300/15 text-rose-200" : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/10"}`}>{listening ? <MicOff size={19}/> : <Mic size={19}/>}</button>
              <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ziyoga xabar yozing…" className="h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0e131a] px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-slate-400/60" />
              <button type="submit" disabled={!draft.trim() || sending} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-400 text-slate-900 shadow-lg transition hover:scale-[1.03] disabled:opacity-40"><Send size={18}/></button>
            </form>
            <p className="px-4 pb-3 text-center text-[9px] text-slate-500">AI javoblari xato bo‘lishi mumkin. Ovoz AI tomonidan yaratiladi yoki qurilmangizda sintezlanadi.</p>
          </div>

          <aside className="space-y-4">
            <section className="rounded-[26px] border border-white/10 bg-gradient-to-br from-[#303a48] to-[#1a202a] p-4 shadow-xl">
              <div className="flex items-center gap-2"><Sparkles size={16} className="text-slate-300"/><h2 className="text-sm font-black">Mashg‘ulot sozlamalari</h2></div>
              <label className="mt-4 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Ko‘nikma</label>
              <div className="mt-2 space-y-2">{tracks.map((item) => <button key={item.id} onClick={() => changeTrack(item.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${track === item.id ? "border-slate-200/50 bg-slate-100 text-slate-900 shadow-lg" : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"}`}>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-400/15 text-lg">{item.flag}</span><span className="min-w-0 flex-1"><b className="block text-xs">{item.label}</b><small className={`mt-0.5 block truncate text-[9px] ${track === item.id ? "text-slate-500" : "text-slate-400"}`}>{item.sub}</small></span>{track === item.id && <Check size={16}/>}
              </button>)}</div>
              <label htmlFor="ai-level" className="mt-4 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Darajangiz</label>
              <select id="ai-level" value={level} onChange={(event) => setLevel(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#171d26] px-3 text-xs font-semibold text-slate-100 outline-none">
                {["Boshlang‘ich","O‘rta","Yuqori","Mutaxassis"].map((item) => <option key={item}>{item}</option>)}
              </select>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-3"><p className="flex items-center gap-2 text-[10px] font-bold text-slate-300"><Waves size={14}/> Ovozli suhbat</p><p className="mt-1 text-[10px] leading-5 text-slate-500">Mikrofon orqali javob bering yoki matn yozing. Ovoz imkoniyatlari brauzer va qurilmaga bog‘liq.</p></div>
            </section>
            <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
              <h2 className="flex items-center gap-2 text-xs font-black"><CircleHelp size={15}/> Qanday ishlaydi?</h2>
              <ol className="mt-3 space-y-3 text-[11px] leading-5 text-slate-400"><li><b className="mr-2 text-slate-200">01</b> Ko‘nikmani tanlang.</li><li><b className="mr-2 text-slate-200">02</b> O‘zbekcha tushuntirish va mashq oling.</li><li><b className="mr-2 text-slate-200">03</b> Javob bering, xatolaringizni birga tuzating.</li></ol>
            </section>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-[10px] leading-5 text-slate-500">Maxfiylik: suhbat matni modelga javob yaratish uchun yuboriladi. API kaliti faqat serverda saqlanadi.</div>
          </aside>
        </section>
      </div>
    </main>
  );
}
