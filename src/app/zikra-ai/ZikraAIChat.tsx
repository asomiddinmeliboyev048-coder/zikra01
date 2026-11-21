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
    <section className="grid min-h-[calc(100dvh-6rem)] flex-1 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-[#101a2b] dark:shadow-black/20 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden border-r border-slate-100 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.025] lg:flex lg:flex-col">
        <div className="mb-5 flex items-center gap-3 px-1">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"><Bot size={22}/></div>
          <div><p className="font-bold text-slate-900 dark:text-white">Zikra AI</p><p className="text-xs text-slate-500">Platforma yordamchisi</p></div>
        </div>
        <button onClick={newConversation} className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"><Plus size={17}/> Yangi suhbat</button>
        <p className="mb-2 mt-6 px-1 text-[11px] font-bold uppercase tracking-[.16em] text-slate-400">Suhbatlar tarixi</p>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {conversations.map((item) => <button key={item.id} onClick={() => void openConversation(item.id)} className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${conversationId === item.id ? "bg-cyan-100 text-cyan-950 dark:bg-cyan-400/15 dark:text-cyan-100" : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-white/5"}`}><span className="block truncate">{item.title}</span></button>)}
          {!conversations.length && <p className="px-2 py-3 text-xs text-slate-400">Hozircha suhbatlar yo‘q.</p>}
        </div>
        <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50 p-3 dark:border-cyan-400/10 dark:bg-cyan-400/5"><div className="mb-1 flex items-center gap-2 text-cyan-800 dark:text-cyan-200"><Sparkles size={15}/><b className="text-xs">Platforma bo‘yicha yordam</b></div><p className="text-xs leading-relaxed text-cyan-900/70 dark:text-cyan-100/60">Mentorlar, video darslar va Zikra imkoniyatlarini toping.</p></div>
      </aside>

      <div className="flex min-h-[70vh] min-w-0 flex-col">
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white lg:hidden"><Bot size={20}/></div>
            <div><h1 className="font-bold text-slate-900 dark:text-white">Zikra AI</h1><p className="text-xs text-slate-500">Salom, {userName.split(" ")[0]}! Platforma yordamchingiz</p></div>
          </div>
          <button onClick={newConversation} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 lg:hidden"><Plus size={15}/> Yangi</button>
        </header>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-7">
          {booting ? <div className="flex h-full items-center justify-center text-sm text-slate-400"><Loader2 className="mr-2 animate-spin" size={18}/> Zikra AI tayyorlanmoqda…</div> : null}
          {!messages.length && !booting && <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-[22px] bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/20"><Sparkles size={30}/></div>
            <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Zikra’da nimani izlayapsiz?</h2>
            <p className="mx-auto mb-7 mt-2 max-w-lg text-center text-sm leading-relaxed text-slate-500">Men sizga platformani tushuntiraman, mos mentorlar va video darslarni topishga yordam beraman.</p>
            <div className="grid gap-2 sm:grid-cols-2">{starters.map((item) => <button key={item} onClick={() => void sendMessage(undefined, item)} className="rounded-2xl border border-slate-200 p-4 text-left text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50/60 dark:border-white/10 dark:text-slate-200 dark:hover:border-cyan-400/30 dark:hover:bg-cyan-400/5">{item}<span className="mt-2 block text-xs font-normal text-slate-400">So‘rash uchun bosing →</span></button>)}</div>
          </div>}
          {messages.map((item, index) => <div key={index} className={`flex gap-3 ${item.role === "user" ? "justify-end" : "justify-start"}`}>
            {item.role === "assistant" && <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white"><Bot size={17}/></div>}
            <div className={`max-w-[min(88%,720px)] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 ${item.role === "user" ? "rounded-br-md bg-slate-900 text-white dark:bg-cyan-600" : "rounded-bl-md bg-slate-100 text-slate-800 dark:bg-white/[0.06] dark:text-slate-100"}`}>{item.content}</div>
            {item.role === "user" && <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300"><UserRound size={16}/></div>}
          </div>)}
          {loading && <div className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white"><Bot size={17}/></div><div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500 dark:bg-white/[0.06]"><span className="inline-flex items-center gap-2"><Loader2 size={15} className="animate-spin"/> Zikra AI javob tayyorlamoqda…</span></div></div>}
          {!!mentors.length && <div className="ml-11 max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-400/15 dark:bg-emerald-400/5"><div className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-900 dark:text-emerald-200"><GraduationCap size={17}/> Sizga mos mentorlar</div><div className="space-y-3">{mentors.map((mentor) => <div key={mentor.id} className="flex items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-100">{mentor.avatar_url ? <img src={mentor.avatar_url} alt="" className="h-full w-full object-cover"/> : mentor.full_name.slice(0,1)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{mentor.full_name}</p><p className="truncate text-xs text-slate-500">{mentor.skills.join(" · ")}</p></div><div className="flex shrink-0 items-center gap-1.5"><Link href={`/profile/${mentor.id}`} className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-400/20 dark:text-emerald-200">Profil</Link><button onClick={() => void requestMentor(mentor)} disabled={!mentor.skillIds.length || ["sending", "sent", "pending"].includes(requestStates[mentor.id])} className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50">{requestStates[mentor.id] === "sending" ? "Yuborilmoqda…" : requestStates[mentor.id] === "sent" || requestStates[mentor.id] === "pending" ? "So‘rov yuborildi" : "So‘rov yuborish"}</button></div></div>)}</div></div>}
          {!!videos.length && <div className="ml-11 max-w-2xl rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-400/15 dark:bg-blue-400/5"><div className="mb-3 flex items-center gap-2 text-sm font-bold text-blue-900 dark:text-blue-200"><Video size={17}/> Mos video darslar</div><div className="space-y-2">{videos.map((video) => <Link key={video.id} href="/videos" className="flex items-center gap-3 rounded-xl bg-white/70 p-2.5 text-sm font-semibold text-slate-800 hover:bg-white dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10">{video.thumbnail_url ? <img src={video.thumbnail_url} alt="" className="h-12 w-16 rounded-lg object-cover"/> : <div className="grid h-12 w-16 place-items-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200"><Video size={18}/></div>}<span className="min-w-0 flex-1 truncate">{video.title}</span><ChevronDown className="-rotate-90 text-slate-400" size={16}/></Link>)}</div></div>}
          {error && <p role="alert" className="ml-11 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">{error}</p>}
        </div>

        <form onSubmit={(event) => void sendMessage(event)} className="border-t border-slate-100 p-3 dark:border-white/10 sm:p-5">
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-inner focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-500/10 dark:border-white/10 dark:bg-white/[0.04]">
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} rows={1} maxLength={5000} placeholder="Zikra haqida so‘rang yoki mentor qidiring…" className="max-h-36 min-h-11 flex-1 resize-y bg-transparent px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white" />
            <button type="submit" disabled={!input.trim() || loading} aria-label="Xabar yuborish" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"><Send size={18}/></button>
          </div>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-slate-400">Zikra AI xatolanishi mumkin. Muhim ma’lumotlarni platformadagi rasmiy sahifalardan tekshiring.</p>
        </form>
      </div>
    </section>
  );
}
