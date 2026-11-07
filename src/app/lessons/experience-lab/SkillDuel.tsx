"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bot, Clock3, Search, Send, Swords, Trophy, UserRound, Wifi, WifiOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = { onClose: () => void; skill: string; vocabulary?: string[] };
type Stage = "setup" | "search" | "play" | "result";
type Player = { id: string; name: string; avatar: string | null; joinedAt: number; skill: string; language?: string };
type ChatLine = { id: string; userId: string; name: string; text: string; kind: "chat" | "word"; at: number };
const norm = (s: string) => s.toLocaleLowerCase().normalize("NFKC").trim().replace(/[^\p{L}]/gu, "");
const extra = ("about above accept account across act action activity actually add address admit adult advice afraid after again age ago agree air all allow almost alone along already also although always amazing among amount ancient animal another answer any anyone anything appear apple area arm around arrive art article artist as ask at attack attempt attention aunt autumn available avoid away baby back bad bag balance ball bank basic beautiful because become bed before begin behind believe benefit best better between beyond big bird birthday black blood blue board body book born both bottle box boy brain branch brave bread break breakfast bring brother build business busy but buy by call camera can capital car card care careful carefully carry case catch cause celebrate center century certain chair chance change character charge check child choice choose city class clean clear clever close cloud club coach cold collect college color come comfortable common community company compare complete computer concern condition connect consider continue control cook cool correct cost could country course create culture cup current customer cut daily dance danger dark data date daughter day dead deal dear death decide decision deep degree delay delicious deliver demand depend describe design despite detail develop development dictionary die difference different difficult dinner direct discover discuss disease do doctor dog door down draw dream dress drink drive during each early earth easy eat education effect effort egg eight either elder electric elephant else email end energy enjoy enough enter entire environment equal especially even evening event ever every everyone everything example excellent except exercise exist expect experience explain express eye face fact fail fair fall family famous far fast father fear feature feel few field fight figure fill final find fine finger finish fire first fish fit five fix flag flat fly focus follow food foot for force forest forget form forward four free friend from front full fun future game garden gas general gentle get girl give glass go goal god gold good government great green ground group grow guess guide habit hair half hand happen happy hard has have head health hear heart heat help here hero high history hit hobby hold home hope horse hospital hot hotel hour house how however human hundred hungry hunt hurry husband idea if imagine improve in include increase indeed industry information inside instead interest into introduce invite island issue it item itself job join joke journey joy judge jump just keep key kid kind king kitchen knee know knowledge language large last late laugh law lazy learn least leave left leg less lesson let letter level library life light like likely line listen little live local long look lose lot love low lucky machine main make man manage many map market marriage material matter may maybe mean measure meet member memory mention message method middle might mile mind minute miss model modern moment money month moon more morning most mother mountain mouth move movie much music must name natural nature near necessary need network never new next nice night nine nobody noise none normal north nose note nothing notice now number object obvious occasion ocean offer office often oil okay old once one online only open operate opinion opportunity opposite orange order ordinary organize other out outside over own page pain paint pair paper parent part particular party pass past patient pay peace people per perfect perhaps person phone photo physical pick picture piece place plan plant play please point police policy poor popular position possible power practice prepare present pressure pretty prevent price primary print problem process produce product professional progress promise protect proud prove provide public pull purpose push put quality question quick quickly quiet quite race radio rain raise range rate rather reach read ready real realize really reason receive recent recognize record reduce refer reflect region regular relate relationship release remain remember remove repeat replace reply report represent require research resource respect responsible rest result return reveal review rich right risk road role room rule run safe same save say school science score sea season seat second secret section secure security see seek seem sell send sense serious serve service set seven several share shift shine ship shirt shoe shop short should show side sign signal simple since sing single sister sit situation six size skill skin sleep slow small smart smile social society soft solution some someone something sometimes son song soon sort sound source south space speak special specific speed spend sport spring stand standard start state stay step still stop story strategy street strong student study subject success successful such sudden suffer suggest summer sun supply support sure surface system table take talk target task taste teach teacher team technology tell ten term test than thank the their them themselves then theory there these they thing think third this though thought thousand three through time tiny title to today together tomorrow too tool topic total touch tough toward town trade tradition train travel treat tree trip true try turn two type under understand unit universe university until up update us use user usual value various version very video view visit voice wait wake walk want war warm was watch water way web website week weight welcome well west what whatever when where whether which while white who whole why wide wife wild will win window wish with without woman wonder word work world worry worth would write wrong year yellow yes yesterday yet young your yourself").split(/\\s+/);
const defaults: Record<string,string[]> = {
 "Ingliz tili": [...extra,"apple","elephant","tree","energy","yellow","window","orange","engine","eagle","earth","happy","young","garden","night","teacher","river","road","dream","mouse","easy","year","robot","table","enjoy","yesterday","yogurt"],
 "Dasturlash": ["array","yield","dom","module","event","type","endpoint","promise","exception","node","editor","router","react","typescript","python","network","webpack","keyword","database","encryption","null","loop","package","element","terminal"],
 "Kiberxavfsizlik": ["authentication","network","key","yield","data","access","session","nonce","encryption","nmap","phishing","hash","hardening","gpg","gateway","yara","audit","token","endpoint","password","domain"]
};
const languageWords: Record<string, string[]> = { en: ["apple","elephant","tree","energy","yellow","window","orange","engine","eagle","earth","happy","young","garden","night","teacher","river","road","dream","mouse","easy","year","robot","table","enjoy","yesterday"], ru: ["арбуз","зима","автобус","солнце","ежедневно","облако","озеро","дом","море","еда","автор","работа","ананас","спорт","телефон","ночь","человек","город","друг"], uz: ["anor","rang","gul","lola","ruchka","asal","limon","non","nok","kitob","bola","aka","arpa","atlas","suv","vatan","nonushta","adabiyot","tarix"] };
const shortId = () => Math.random().toString(36).slice(2, 10);
export default function SkillDuel({ onClose, skill, vocabulary = [] }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [stage, setStage] = useState<Stage>("setup");
  const [gameLanguage, setGameLanguage] = useState<"uz" | "ru" | "en">(skill === "Rus tili" ? "ru" : "en");
  const [remaining, setRemaining] = useState(15);
  const [total, setTotal] = useState(60);
  const [turn, setTurn] = useState<string>("");
  const [words, setWords] = useState<ChatLine[]>([]);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [entry, setEntry] = useState("");
  const [chatEntry, setChatEntry] = useState("");
  const [message, setMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [me, setMe] = useState<Player | null>(null);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [won, setWon] = useState(false);
  const [queueSeconds, setQueueSeconds] = useState(15);
  const [roomChannel, setRoomChannel] = useState<any>(null);
  const queueRef = useRef<any>(null);
  const roomRef = useRef<any>(null);
  const matchRef = useRef(false);
  const gameStarted = useRef(false);
  const rewardSent = useRef(false);
  const [gameXP, setGameXP] = useState(0);
  const lastWordAt = useRef(0);
  const bank = useMemo(() => Array.from(new Set([...(languageWords[gameLanguage] || languageWords.en), ...(gameLanguage === "en" ? (defaults[skill] || defaults["Ingliz tili"]) : []), ...vocabulary.map(norm).filter(w => w.length >= 2)])), [skill, vocabulary, gameLanguage]);
  const validWord = (value: string) => gameLanguage === "ru" ? /^[а-яё]+$/i.test(value) : gameLanguage === "uz" ? /^[a-zʻʼ’']+$/i.test(value) : /^[a-z]+$/i.test(value);
  const languageLabel = gameLanguage === "ru" ? "Русский" : gameLanguage === "uz" ? "O‘zbekcha" : "English";
  const profileLabel = (user: any): Player => ({
    id: user.id,
    name: String(user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.username || user.email?.split("@")[0] || "Zikra foydalanuvchisi").slice(0, 48),
    avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    joinedAt: Date.now(),
    skill
  });
  const finish = useCallback((result: boolean) => {
    setWon(result); setStage("result"); setTyping(false);
    if (result && !rewardSent.current) {
      rewardSent.current = true;
      const trackId = skill === "Rus tili" ? "russian" : skill === "Dasturlash" ? "coding" : skill === "Kiberxavfsizlik" ? "cyber" : "english";
      void fetch("/api/learning/activity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trackId, skillName: skill, activityType: "game", itemKey: "word-duel-" + Date.now(), score: 100, details: { game: "word-duel", words: words.length }, completed: true }) })
        .then((response) => response.json()).then((payload) => { if (payload?.reward?.awarded) setGameXP(payload.reward.xp); })
        .catch((error) => console.error("[word-duel-xp]", error));
    }
  }, [skill, words.length]);
  const stopChannels = useCallback(async () => {
    if (queueRef.current) { await supabase.removeChannel(queueRef.current); queueRef.current = null; }
    if (roomRef.current) { await supabase.removeChannel(roomRef.current); roomRef.current = null; }
    setRoomChannel(null);
  }, [supabase]);
  useEffect(() => () => { void stopChannels(); }, [stopChannels]);
  const start = useCallback(async () => {
    await stopChannels();
    matchRef.current = false; gameStarted.current = false; rewardSent.current = false; setGameXP(0); lastWordAt.current = 0;
    setOpponent(null); setWords([]); setChat([]); setEntry(""); setTyping(false); setMessage("Hisob tekshirilmoqda…");
    setQueueSeconds(15); setRemaining(15); setTotal(60); setTurn(""); setStage("search"); setOnline(false);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) { setMessage("Duel uchun Zikra hisobingizga kiring."); setStage("setup"); return; }
    const self = profileLabel(user); setMe(self);
    const topic = "skill-duel-queue-" + norm(skill || "english") + "-" + gameLanguage;
    const channel = supabase.channel(topic, { config: { presence: { key: user.id }, broadcast: { self: false } } });
    queueRef.current = channel;
    channel.on("presence", { event: "sync" }, async () => {
      setOnline(true);
      if (matchRef.current) return;
      const presence = channel.presenceState() as Record<string, any[]>;
      const people = Object.entries(presence).flatMap(([id, metas]) => {
        const item = metas[0] || {};
        return [{ id, name: String(item.name || "Zikra foydalanuvchisi"), avatar: item.avatar || null, joinedAt: Number(item.joinedAt || 0), skill: String(item.skill || ""), language: String(item.language || "en") } as Player];
      }).filter(p => p.skill === skill && p.language === gameLanguage).sort((a,b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id));
      // Pair the two oldest queued accounts. Both clients derive the same pair and room.
      if (people.length >= 2 && people[0].id !== people[1].id && people.slice(0,2).some(p => p.id === user.id)) {
        const pair = people.slice(0,2);
        const rival = pair.find(p => p.id !== user.id);
        if (!rival) return;
        matchRef.current = true; setOpponent(rival); setMessage("Raqib topildi! Duel ulanmoqda…");
        const roomId = pair.map(p => p.id).sort().join("-");
        const room = supabase.channel("skill-duel-room-" + roomId, { config: { broadcast: { self: false }, presence: { key: user.id } } });
        roomRef.current = room;
        room.on("broadcast", { event: "game" }, ({ payload }: any) => {
          if (!payload || payload.from === user.id) return;
          if (payload.type === "start" && !gameStarted.current) {
            gameStarted.current = true; setStage("play"); setOnline(true); setTurn(pair[0].id); setRemaining(15); setTotal(60); setMessage("Jonli raqib bilan ulandingiz!");
          }
          if (payload.type === "word") {
            const line: ChatLine = payload.line; setWords(prev => prev.some(x=>x.id===line.id)?prev:[...prev,line]); setChat(prev=>[...prev,line]); setTurn(user.id); setRemaining(15); setEntry(""); setTyping(false);
          }
          if (payload.type === "chat") setChat(prev=>[...prev,payload.line]);
          if (payload.type === "typing") setTyping(Boolean(payload.value));
          if (payload.type === "timeout") finish(payload.winner === user.id);
          if (payload.type === "leave") { setMessage("Raqib duelni tark etdi."); finish(true); }
        });
        const status = await room.subscribe(async (state: string) => {
          if (state !== "SUBSCRIBED" || gameStarted.current) return;
          setOnline(true);
          // Brief handshake allows both paired peers to subscribe before the first state event.
          window.setTimeout(async () => {
            if (!roomRef.current || gameStarted.current) return;
            gameStarted.current = true; setStage("play"); setTurn(pair[0].id); setRemaining(15); setTotal(60); setMessage("Jonli raqib bilan duel boshlandi.");
            await room.send({ type: "broadcast", event: "game", payload: { type: "start", from: user.id, first: pair[0].id, at: Date.now() } });
            // Leave the skill queue after pairing so later arrivals can form new pairs.
            await supabase.removeChannel(channel);
            if (queueRef.current === channel) queueRef.current = null;
          }, 650);
        });
        void status;
      }
    });
    channel.subscribe(async (state: string) => {
      if (state !== "SUBSCRIBED") { setOnline(false); return; }
      await channel.track({ id: user.id, name: self.name, avatar: self.avatar, skill, language: gameLanguage, joinedAt: Date.now() });
      setOnline(true); setMessage("Bir xil ko‘nikmadagi raqib qidirilmoqda…");
    });
  }, [skill, gameLanguage, stopChannels, supabase, finish]);
  useEffect(() => {
    if (stage !== "search") return;
    const timer = window.setInterval(() => setQueueSeconds(n => {
      if (n <= 1) {
        window.clearInterval(timer);
        if (!matchRef.current) {
          setMessage("15 soniyada jonli raqib topilmadi. Bot bilan boshlaymiz.");
          void stopChannels();
          setOpponent(null); setWords([]); setChat([]); setTurn("you"); setRemaining(15); setTotal(60); setStage("play");
        }
        return 0;
      }
      return n - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [stage, stopChannels]);
  useEffect(() => {
    if (stage !== "play" || !turn) return;
    const interval = window.setInterval(() => {
      setTotal(t => { if (t <= 1) { window.clearInterval(interval); const mine=words.filter(w=>w.userId===me?.id).length; const rival=words.filter(w=>w.userId!==(me?.id||"")).length; finish(mine>=rival); return 0; } return t - 1; });
      setRemaining(t => { if (t <= 1) { window.clearInterval(interval); if (opponent) { void roomRef.current?.send({type:"broadcast",event:"game",payload:{type:"timeout",from:me?.id,winner:(turn==="you"||turn===me?.id)?opponent.id:me?.id}}); } finish(turn !== "you"); return 0; } return t - 1; });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [stage, turn, opponent, finish, me]);
  useEffect(() => {
    if (stage !== "play" || opponent || turn !== "bot") return;
    const timeout = window.setTimeout(() => {
      const last = words.length ? norm(words[words.length-1].text).slice(-1) : "";
      const used = new Set(words.map(w => norm(w.text)));
      const answer = bank.find(w => norm(w).startsWith(last) && !used.has(norm(w)));
      if (!answer) { finish(true); return; }
      const line: ChatLine = {id:shortId(),userId:"bot",name:"Zikra Bot",text:answer,kind:"word",at:Date.now()};
      setWords(prev=>[...prev,line]); setChat(prev=>[...prev,line]); setTurn("you"); setRemaining(15);
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [stage, opponent, turn, words, bank, finish]);
  const sendTyping = (value: string) => {
    setEntry(value);
    if (opponent && me) void roomRef.current?.send({type:"broadcast",event:"game",payload:{type:"typing",from:me.id,value:!!value}});
  };
  const submitWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (turn !== "you" && turn !== me?.id) return;
    const raw=entry.trim(), word=norm(raw), last=words.length?norm(words[words.length-1].text).slice(-1):"";
    if(raw.length<2||raw.length>24||!validWord(raw)){setMessage(gameLanguage==="ru"?"2–24 ta kirill harfidan iborat ruscha so‘z kiriting.":gameLanguage==="uz"?"2–24 ta o‘zbek lotin harfidan iborat so‘z kiriting.":"2–24 ta ingliz harfidan iborat so‘z kiriting.");return;}
    if(words.some(x=>norm(x.text)===word)){setMessage("Bu so‘z avval ishlatilgan.");return;}
    if(last&&!word.startsWith(last)){setMessage("So‘z "+last.toUpperCase()+" harfidan boshlanishi kerak.");return;}
    const line:ChatLine={id:shortId(),userId:me?.id||"me",name:me?.name||"Siz",text:word,kind:"word",at:Date.now()};
    setWords(prev=>[...prev,line]);setChat(prev=>[...prev,line]);setEntry("");setMessage(opponent?"Javob yuborildi. Raqib navbati.":"Javob qabul qilindi.");setTurn(opponent?.id||"bot");setRemaining(15);
    if(opponent&&me) await roomRef.current?.send({type:"broadcast",event:"game",payload:{type:"word",from:me.id,line}});
  };
  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault(); const text=chatEntry.trim(); if(!text||!me)return;
    const line:ChatLine={id:shortId(),userId:me.id,name:me.name,text:text.slice(0,300),kind:"chat",at:Date.now()};
    setChat(prev=>[...prev,line]);setEntry("");
    if(opponent) await roomRef.current?.send({type:"broadcast",event:"game",payload:{type:"chat",from:me.id,line}});
  };
  const card="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#19211f] sm:p-7";
  return <div role="dialog" aria-modal="true" className="dark fixed inset-0 z-[100] flex h-[100dvh] flex-col overflow-hidden bg-[#101716] px-3 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-white sm:px-6">
    <header className="mx-auto flex w-full max-w-5xl shrink-0 items-center justify-between gap-2 py-3"><button onClick={()=>{void stopChannels();onClose();}} className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold dark:border-white/10"><ArrowLeft size={17}/> Orqaga</button><b className="flex items-center gap-2"><Swords className="text-emerald-600"/> Skill Duel</b><span className="max-w-[35vw] truncate rounded-full bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-900">{skill}</span></header>
    <main className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col justify-center overflow-hidden">
      {stage==="setup"&&<section className={card+" text-center"}><div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-100 text-emerald-800"><Swords size={32}/></div><p className="mt-4 text-xs font-black uppercase tracking-widest text-emerald-700">1 VS 1 · WORD CHAIN</p><h1 className="mt-2 text-3xl font-black sm:text-5xl">So‘nggi harf</h1><p className="mt-3 text-sm leading-6 text-slate-500">O‘yin tilini tanlang. Keyingi so‘z avvalgisining oxirgi harfi bilan boshlanishi kerak.</p><div className="mt-5 grid grid-cols-3 gap-2">{([{id:"uz",label:"O‘zbekcha"},{id:"ru",label:"Русский"},{id:"en",label:"English"}] as const).map(option=><button key={option.id} type="button" onClick={()=>setGameLanguage(option.id)} className={"rounded-xl border px-2 py-3 text-xs font-bold "+(gameLanguage===option.id?"border-emerald-500 bg-emerald-50 text-emerald-800":"border-slate-200 bg-white text-slate-500")}>{option.label}</button>)}</div><p className="mt-2 text-xs text-slate-400">Tanlangan til: {languageLabel}</p><div className="mt-7 grid grid-cols-3 gap-2">{[["60s","O‘yin"],["15s","Har navbat"],["1v1","Format"]].map(([v,l])=><div key={l} className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-white/5"><p className="text-3xl font-black">{v}</p><p className="text-xs text-slate-500">{l}</p></div>)}</div><button onClick={()=>void start()} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 font-black text-white"><Search size={19}/> Raqib qidirish</button><p className="mt-3 text-center text-xs text-slate-400">Avval jonli raqib qidiriladi, keyin bot.</p></section>}
      {stage==="search"&&<section className={card+" text-center"}><div className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50"><span className="absolute inset-0 animate-ping rounded-full border-2 border-emerald-400/40"/><Search size={36} className="text-emerald-600"/></div><h1 className="mt-5 text-2xl font-black">Raqib qidirilmoqda…</h1><p className="mt-2 text-sm text-slate-500">{skill} · {languageLabel} · {online?"Queue'ga ulandingiz":"Ulanmoqda…"}</p><p className="mt-3 text-4xl font-black tabular-nums text-emerald-700">00:{String(queueSeconds).padStart(2,"0")}</p><p className="mt-2 text-sm text-slate-500">{message}</p><button onClick={()=>{void stopChannels();setStage("setup");}} className="mt-5 rounded-xl border px-5 py-3 font-bold">Bekor qilish</button></section>}
      {stage==="play"&&<section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#19211f]">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b p-3"><div className="min-w-0"><p className="flex items-center gap-1 text-xs font-bold text-emerald-700"><Wifi size={14}/>{opponent?"JONLI DUEL":"BOT DUEL"}</p><p className="truncate font-black">{skill} · {languageLabel}</p></div><div className="rounded-xl bg-slate-900 px-3 py-1.5 text-white"><small>QOLGAN</small><p className="text-xl font-black">00:{String(total).padStart(2,"0")}</p></div></div>
        <div className="grid shrink-0 grid-cols-2 gap-2 border-b p-2">
          {[{p:me,active:turn==="you"||turn===me?.id,label:"Siz"},{p:opponent,active:turn==="bot"&&!!opponent||turn===opponent?.id,label:opponent?.name||"Zikra Bot"}].map((x,i)=><div key={i} className={"flex min-w-0 items-center gap-2 rounded-xl border p-2 "+(x.active?"border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40":"border-slate-200 dark:border-white/10")}>{x.p?.avatar?<img src={x.p.avatar} alt="" className="h-10 w-10 rounded-full object-cover"/>:<span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100"><UserRound size={18}/></span>}<div className="min-w-0"><p className="truncate text-sm font-bold">{x.p?.name||x.label}</p><p className="truncate text-xs text-slate-500">{x.active?"Navbat":i===1&&typing?"Yozmoqda…":i===1&&opponent?"Kutyapti":"Zikra"}</p></div></div>)}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3" aria-live="polite"><div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-400"><span>DUEL CHAT</span><span>{online?<Wifi size={14}/>:<WifiOff size={14}/>}</span></div>{chat.map(line=><div key={line.id} className={"mb-2 flex "+(line.userId===me?.id?"justify-end":"justify-start")}><div className={"max-w-[88%] rounded-2xl px-3 py-2 "+(line.userId===me?.id?"bg-emerald-700 text-white":"bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white")}><p className="mb-1 text-[10px] font-bold opacity-70">{line.name} · {line.kind==="word"?"So‘z":"Xabar"}</p><p className="break-words text-sm">{line.text}</p></div></div>)}{typing&&<p className="text-xs italic text-slate-400">{opponent?.name||"Raqib"} yozmoqda…</p>}</div>
        <div className="shrink-0 border-t p-2">
          <div className="mb-2 flex items-center justify-between text-xs"><b className={turn==="you"||turn===me?.id?"text-emerald-700":"text-slate-500"}>{turn==="you"||turn===me?.id?"Navbat sizda":"Raqib navbati"}</b><span className="flex items-center gap-1 font-black"><Clock3 size={14}/>{remaining}s</span></div>
          <form onSubmit={submitWord} className="flex gap-2"><input disabled={!!opponent&&(turn!==me?.id)} value={entry} onChange={e=>sendTyping(e.target.value)} placeholder={words.length?"So‘z: "+norm(words[words.length-1].text).slice(-1).toUpperCase()+" harfidan":"Birinchi so‘z"} className="min-w-0 flex-1 rounded-xl border px-3 py-3 text-base disabled:opacity-50"/><button type="submit" disabled={!!opponent&&(turn!==me?.id)} className="rounded-xl bg-emerald-700 px-4 font-black text-white disabled:opacity-40"><Send size={18}/></button></form>
          <form onSubmit={sendChat} className="mt-2 flex gap-2"><input value={chatEntry} onChange={e=>setChatEntry(e.target.value)} placeholder="Raqibga xabar yozish…" className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm"/><button type="submit" className="rounded-xl border px-3" aria-label="Chat xabarini yuborish"><Send size={16}/></button></form><p role="status" className="mt-1 truncate text-xs text-slate-500">{message}</p>
        </div>
      </section>}
      {stage==="result"&&<section className={card+" text-center"}><Trophy size={44} className="mx-auto text-amber-500"/><h1 className="mt-5 text-3xl font-black">{won?"G‘alaba!":"Bu safar raqib yutdi"}</h1><p className="mt-2 text-slate-500">{opponent?opponent.name:"Bot"} bilan duel yakunlandi.</p><p className="mt-4 text-4xl font-black text-emerald-700">{words.length} <small className="text-sm">so‘z</small></p>{won&&gameXP>0&&<p className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 font-black text-amber-700">✨ +{gameXP} XP</p>}<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center"><button onClick={()=>void start()} className="rounded-xl bg-emerald-700 px-6 py-3 font-black text-white">Qayta o‘ynash</button><button onClick={()=>{void stopChannels();onClose();}} className="rounded-xl border px-6 py-3 font-bold">O‘quv markaziga</button></div></section>}
    </main>
  </div>;
}
