"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Bot, ChevronDown, MessageCircle, Plus, Send, Sparkles, UserRound, Video, GraduationCap, Loader2 } from "lucide-react";

type Conversation = { id: string; title: string; created_at: string; updated_at: string };
type Message = { role: "user" | "assistant"; content: string };
type Mentor = { id: string; full_name: string; username: string | null; avatar_url: string | null; bio: string | null; skills: string[]; skillIds: string[] };
type RecommendedVideo = { id: string; title: string; thumbnail_url: string | null; skill_id: string | null };

const starters = [
  "Zikra qanday ishlaydi?",
  "Menga ingliz tilini o‘rgatadigan mentor top",
  "Video darslarni qayerdan topsam bo‘ladi?",
  "Ziyo AI bilan Zikra AI farqi nima?",
];

export default function ZikraAIChat({ userName }: { userName: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [videos, setVideos] = useState<RecommendedVideo[]>([]);
  const [requestStates, setRequestStates] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const response = await fetch("/api/zikra-ai", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Suhbatlar yuklanmadi.");
    setConversations(payload.conversations || []);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/zikra-ai", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Zikra AI yuklanmadi.");
        if (active) setConversations(payload.conversations || []);
      })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Ulanishda xatolik."); })
      .finally(() => { if (active) setBooting(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function openConversation(id: string) {
    setError("");
    setConversationId(id);
    setMentors([]);
    setVideos([]);
    try {
      const response = await fetch("/api/zikra-ai?conversationId=" + encodeURIComponent(id), { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Suhbat ochilmadi.");
      setMessages(payload.messages || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Suhbat ochilmadi."); }
  }

  async function requestMentor(mentor: Mentor) {
    const skillId = mentor.skillIds[0];
    if (!skillId) return;
    const approved = window.confirm(`${mentor.full_name} ga mentorlik so‘rovini yuborishni tasdiqlaysizmi?`);
    if (!approved) return;
    setRequestStates((current) => ({ ...current, [mentor.id]: "sending" }));
    try {
      const response = await fetch("/api/zikra-ai/mentor-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId: mentor.id, skillId, message: "Salom! Zikra AI tavsiyasi orqali sizdan ushbu ko‘nikmani o‘rganmoqchiman." }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "So‘rov yuborilmadi.");
      setRequestStates((current) => ({ ...current, [mentor.id]: payload.alreadySent ? "pending" : "sent" }));
    } catch (e) {
      setRequestStates((current) => ({ ...current, [mentor.id]: "error" }));
      setError(e instanceof Error ? e.message : "Mentor so‘rovini yuborib bo‘lmadi.");
    }
  }

  function newConversation() {
    setConversationId("");
    setMessages([]);
    setMentors([]);
    setVideos([]);
    setError("");
  }

  async function sendMessage(event?: FormEvent, override?: string) {
    event?.preventDefault();
    const text = (override ?? input).trim();
    if (!text || loading) return;
    setInput("");
    setError("");
    setMessages((current) => [...current, { role: "user", content: text }]);
    setLoading(true);
    try {
      const response = await fetch("/api/zikra-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId: conversationId || undefined }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Javob olishda xatolik.");
      setConversationId(payload.conversationId);
      setMessages((current) => [...current, { role: "assistant", content: payload.reply }]);
      setMentors(payload.recommendations?.mentors || []);
      setVideos(payload.recommendations?.videos || []);
      await loadConversations();
    } catch (e) {
      setMessages((current) => current.slice(0, -1));
      setInput(text);
      setError(e instanceof Error ? e.message : "AI bilan aloqa uzildi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="zikra-ai-shell grid h-full min-h-0 w-full flex-1 overflow-hidden lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden border-r border-slate-200/70 bg-white/55 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/25 lg:flex lg:flex-col">
        <div className="mb-5 flex items-center gap-3 px-1">
          <div className="zikra-ai-mark grid h-11 w-11 place-items-center rounded-2xl text-white"><Bot size={22}/></div>
          <div><p className="font-bold text-slate-900 dark:text-white">Zikra AI</p><p className="text-xs text-slate-500">Platforma yordamchisi</p></div>
        </div>
        <button onClick={newConversation} className="zikra-ai-new flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition"><Plus size={17}/> Yangi suhbat</button>
        <p className="mb-2 mt-6 px-1 text-[11px] font-bold uppercase tracking-[.16em] text-slate-400">Suhbatlar tarixi</p>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {conversations.map((item) => <button key={item.id} onClick={() => void openConversation(item.id)} className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${conversationId === item.id ? "bg-cyan-100 text-cyan-950 dark:bg-cyan-400/15 dark:text-cyan-100" : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-white/5"}`}><span className="block truncate">{item.title}</span></button>)}
          {!conversations.length && <p className="px-2 py-3 text-xs text-slate-400">Hozircha suhbatlar yo‘q.</p>}
        </div>
        <div className="zikra-ai-side-note mt-4 rounded-2xl p-3"><div className="mb-1 flex items-center gap-2 text-cyan-800 dark:text-cyan-200"><Sparkles size={15}/><b className="text-xs">Platforma bo‘yicha yordam</b></div><p className="text-xs leading-relaxed text-cyan-900/70 dark:text-cyan-100/60">Mentorlar, video darslar va Zikra imkoniyatlarini toping.</p></div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-col bg-transparent">
        <header className="zikra-ai-header flex items-center justify-between border-b px-4 py-3 sm:px-6">
          <div className="zikra-ai-result-card flex items-center gap-3 rounded-xl p-2.5">
            <div className="zikra-ai-mark grid h-10 w-10 place-items-center rounded-2xl text-white lg:hidden"><Bot size={20}/></div>
            <div><h1 className="font-bold text-slate-900 dark:text-white">Zikra AI</h1><p className="text-xs text-slate-500">Salom, {userName.split(" ")[0]}! Platforma yordamchingiz</p></div>
          </div>
          <button onClick={newConversation} className="zikra-ai-new inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold lg:hidden"><Plus size={15}/> Yangi</button>
        </header>

        <div ref={scrollRef} className="zikra-ai-messages min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5 pb-8 sm:px-8 lg:px-12">
          {booting ? <div className="flex h-full items-center justify-center text-sm text-slate-400"><Loader2 className="mr-2 animate-spin" size={18}/> Zikra AI tayyorlanmoqda…</div> : null}
          {!messages.length && !booting && <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center py-8 sm:py-12">
            <div className="zikra-ai-hero-icon mx-auto mb-5 grid h-14 w-14 place-items-center rounded-[20px] text-white sm:h-16 sm:w-16"><Sparkles size={30}/></div>
            <h2 className="zikra-ai-gradient-text text-center text-2xl font-bold tracking-tight sm:text-3xl">Zikra’da nimani izlayapsiz?</h2>
            <p className="mx-auto mb-6 mt-2 max-w-lg text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:mb-8">Men sizga platformani tushuntiraman, mos mentorlar va video darslarni topishga yordam beraman.</p>
            <div className="grid gap-2.5 sm:grid-cols-2">{starters.map((item) => <button key={item} onClick={() => void sendMessage(undefined, item)} className="zikra-ai-prompt rounded-2xl p-4 text-left text-sm font-semibold transition sm:p-5">{item}<span className="mt-2 block text-xs font-normal text-slate-400">So‘rash uchun bosing →</span></button>)}</div>
          </div>}
          {messages.map((item, index) => <div key={index} className={`flex gap-3 ${item.role === "user" ? "justify-end" : "justify-start"}`}>
            {item.role === "assistant" && <div className="zikra-ai-mark mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white"><Bot size={17}/></div>}
            <div className={`zikra-ai-bubble max-w-[min(88%,760px)] whitespace-pre-wrap px-4 py-3 text-sm leading-7 sm:px-5 sm:py-4 ${item.role === "user" ? "zikra-ai-user-bubble" : "zikra-ai-assistant-bubble"}`}>{item.content}</div>
            {item.role === "user" && <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-slate-300/70 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"><UserRound size={16}/></div>}
          </div>)}
          {loading && <div className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white"><Bot size={17}/></div><div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500 dark:bg-white/[0.06]"><span className="inline-flex items-center gap-2"><Loader2 size={15} className="animate-spin"/> Zikra AI javob tayyorlamoqda…</span></div></div>}
          {!!mentors.length && <div className="zikra-ai-recommendation ml-11 max-w-2xl rounded-2xl p-4"><div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200"><GraduationCap size={17}/> Sizga mos mentorlar</div><div className="space-y-3">{mentors.map((mentor) => <div key={mentor.id} className="flex items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-100">{mentor.avatar_url ? <img src={mentor.avatar_url} alt="" className="h-full w-full object-cover"/> : mentor.full_name.slice(0,1)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{mentor.full_name}</p><p className="truncate text-xs text-slate-500">{mentor.skills.join(" · ")}</p></div><div className="flex shrink-0 items-center gap-1.5"><Link href={`/profile/${mentor.id}`} className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-400/20 dark:text-emerald-200">Profil</Link><button onClick={() => void requestMentor(mentor)} disabled={!mentor.skillIds.length || ["sending", "sent", "pending"].includes(requestStates[mentor.id])} className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50">{requestStates[mentor.id] === "sending" ? "Yuborilmoqda…" : requestStates[mentor.id] === "sent" || requestStates[mentor.id] === "pending" ? "So‘rov yuborildi" : "So‘rov yuborish"}</button></div></div>)}</div></div>}
          {!!videos.length && <div className="zikra-ai-recommendation ml-11 max-w-2xl rounded-2xl p-4"><div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200"><Video size={17}/> Mos video darslar</div><div className="space-y-2">{videos.map((video) => <Link key={video.id} href="/videos" className="zikra-ai-result-card flex items-center gap-3 rounded-xl p-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100">{video.thumbnail_url ? <img src={video.thumbnail_url} alt="" className="h-12 w-16 rounded-lg object-cover"/> : <div className="grid h-12 w-16 place-items-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200"><Video size={18}/></div>}<span className="min-w-0 flex-1 truncate">{video.title}</span><ChevronDown className="-rotate-90 text-slate-400" size={16}/></Link>)}</div></div>}
          {error && <p role="alert" className="ml-11 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">{error}</p>}
        </div>

        <form onSubmit={(event) => void sendMessage(event)} className="zikra-ai-composer shrink-0 border-t p-3 sm:px-6 sm:py-4">
          <div className="mx-auto flex max-w-4xl items-end gap-2 rounded-[22px] border p-2 shadow-lg focus-within:ring-4 focus-within:ring-slate-400/10">
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} rows={1} maxLength={5000} placeholder="Zikra haqida so‘rang yoki mentor qidiring…" className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100" />
            <button type="submit" disabled={!input.trim() || loading} aria-label="Xabar yuborish" className="zikra-ai-send grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"><Send size={18}/></button>
          </div>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-slate-400">Zikra AI xatolanishi mumkin. Muhim ma’lumotlarni platformadagi rasmiy sahifalardan tekshiring.</p>
        </form>
      </div>
    </section>
  );
}
