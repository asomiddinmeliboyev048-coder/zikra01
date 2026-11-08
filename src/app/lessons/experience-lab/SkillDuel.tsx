"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bot, Clock3, Search, Send, Swords, Trophy, UserRound, Wifi, WifiOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createPortal } from "react-dom";

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
  const [mounted, setMounted] = useState(false);
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
  useEffect(() => {
    setMounted(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    void supabase.auth.getUser().then(({ data: { user } }) => { if (user) setMe(profileLabel(user)); }).catch(() => {});
    return () => { document.body.style.overflow = previousOverflow; };
  }, [supabase]);

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
  if (!mounted) return null;
  const silverShell = "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-slate-300/25 bg-[linear-gradient(145deg,#f8fafc_0%,#cbd5e1_42%,#eef2f7_100%)] text-slate-900 shadow-[0_24px_80px_-35px_rgba(0,0,0,.8)]";
  const silverPanel = "border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,.94),rgba(215,222,232,.88))] shadow-[inset_0_1px_0_rgba(255,255,255,.95),0_18px_44px_-30px_rgba(15,23,42,.5)]";
  const avatar = (player: Player | null, size = "h-16 w-16") => player?.avatar
    ? <img src={player.avatar} alt={player.name} className={size + " rounded-full border-2 border-white object-cover shadow-lg"} />
    : <span className={size + " grid place-items-center rounded-full border-2 border-white bg-gradient-to-br from-slate-100 to-slate-400 text-slate-600 shadow-lg"}><UserRound size={26}/></span>;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Skill Duel" className="fixed inset-0 z-[9999] flex h-[100dvh] w-full flex-col overflow-hidden bg-[radial-gradient(60rem_36rem_at_50%_-10%,#64748b_0%,#28313e_45%,#111720_100%)] px-0 pt-[env(safe-area-inset-top)] text-slate-100">
      <header className="mx-auto flex w-full max-w-4xl shrink-0 items-center justify-between gap-2 px-4 py-3">
        <button onClick={()=>{void stopChannels();onClose();}} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-300/25 bg-white/5 px-4 text-sm font-bold text-slate-100"><ArrowLeft size={17}/> Orqaga</button>
        <b className="flex items-center gap-2 text-base tracking-tight"><Swords className="text-slate-200"/> Skill Duel</b>
        <span className="max-w-[32vw] truncate rounded-full border border-white/60 bg-gradient-to-br from-slate-100 to-slate-400 px-3 py-2 text-xs font-black text-slate-800">{languageLabel}</span>
      </header>
      <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden px-0 pb-[env(safe-area-inset-bottom)] sm:px-4">
        {stage==="setup"&&<section className={silverShell+" flex-1 overflow-y-auto rounded-t-[30px] px-4 pb-5 pt-5 sm:px-7"}>
          <div className="flex items-center gap-4 border-b border-slate-400/25 pb-5">
            {avatar(me,"h-[76px] w-[76px]")}
            <div className="min-w-0 flex-1"><p className="truncate text-xl font-black text-slate-900">{me?.name||"Asomiddin"}</p><p className="truncate text-sm text-slate-500">@{me?.name?.toLowerCase().replace(/\s+/g,"_")||"zikra_user"}</p><p className="mt-1 text-xs font-bold text-slate-500">WORD BATTLES · ZIKRA</p></div>
            <div className="rounded-2xl border border-white/80 bg-white/65 px-3 py-2 text-center"><Swords className="mx-auto text-slate-600"/><b className="mt-1 block text-lg text-slate-800">1v1</b></div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[["60s","O‘yin davomiyligi"],["15s","Har bir navbat"],["1 VS 1","Format"]].map(([value,label])=><div key={label} className={silverPanel+" rounded-2xl p-3 text-center"}><b className="block text-2xl font-black text-slate-900">{value}</b><span className="mt-1 block text-[10px] font-semibold text-slate-500">{label}</span></div>)}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className={silverPanel+" overflow-hidden rounded-[24px] p-3"}><div className="flex h-24 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 to-slate-400"><span className="text-4xl font-black tracking-widest text-slate-700">A → Z</span></div><b className="mt-3 block text-sm text-slate-900">So‘nggi harf</b><p className="mt-1 text-xs text-slate-500">So‘z zanjiri orqali bellashing.</p><span className="mt-2 inline-flex rounded-full bg-slate-700/10 px-2 py-1 text-[10px] font-black text-slate-700">TANLANGAN O‘YIN</span></div>
            <div className={silverPanel+" overflow-hidden rounded-[24px] p-3 opacity-75"}><div className="flex h-24 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-300 to-slate-500"><span className="text-4xl font-black tracking-widest text-slate-700">ABC</span></div><b className="mt-3 block text-sm text-slate-900">So‘zlar jangi</b><p className="mt-1 text-xs text-slate-500">Keyingi yangilanishda.</p></div>
          </div>
          <section className={silverPanel+" mt-4 rounded-[24px] p-4"}>
            <h2 className="text-base font-black text-slate-900">O‘yin qoidalari</h2>
            <ol className="mt-3 space-y-3 text-sm text-slate-700">
              <li className="flex gap-3"><b className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-500/15">1</b><span>O‘yinchilar navbat bilan tanlangan tilda so‘z yozadi.</span></li>
              <li className="flex gap-3"><b className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-500/15">2</b><span>Har bir yangi so‘z oldingi so‘zning oxirgi harfi bilan boshlanadi.</span></li>
              <li className="flex gap-3"><b className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-500/15">3</b><span>Bir so‘zni ikki marta ishlatib bo‘lmaydi. Har navbat uchun 15 soniya beriladi.</span></li>
            </ol>
          </section>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[{id:"uz",label:"O‘zbekcha"},{id:"ru",label:"Русский"},{id:"en",label:"English"}].map(option=><button key={option.id} type="button" onClick={()=>setGameLanguage(option.id as "uz"|"ru"|"en")} className={"min-h-10 rounded-xl border text-xs font-bold "+(gameLanguage===option.id?"border-slate-500 bg-slate-700 text-white":"border-slate-400/40 bg-white/50 text-slate-600")}>{option.label}</button>)}
          </div>
          <button onClick={()=>void start()} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/70 bg-gradient-to-b from-slate-600 to-slate-800 text-base font-black text-white shadow-lg"><Search size={19}/> TASODIFIY RAQIB QIDIRISH</button>
          <p className="mt-3 text-center text-xs text-slate-500">Avval jonli raqib qidiriladi, topilmasa Zikra Bot bilan o‘ynaysiz.</p>
        </section>}
        {stage==="search"&&<section className="flex min-h-0 flex-1 flex-col items-center justify-between px-5 py-5 text-center">
          <div className="w-full text-center"><p className="text-sm font-bold text-slate-300">{languageLabel} · SO‘NGGI HARF</p><h1 className="mt-2 text-xl font-black">Raqib qidirilmoqda</h1></div>
          <div className="flex w-full flex-col items-center">
            {avatar(me,"h-28 w-28")}
            <h2 className="mt-4 text-xl font-black">{me?.name||"Siz"}</h2><p className="text-sm text-slate-400">Sizning profilingiz</p>
            <div className="my-10 flex w-full items-center"><span className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-400"/><span className="mx-3 rounded-2xl border border-slate-300 bg-gradient-to-b from-slate-100 to-slate-400 px-7 py-3 text-3xl font-black text-slate-800 shadow-xl">VS</span><span className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-400"/></div>
            <div className="relative grid h-28 w-28 place-items-center rounded-full border-4 border-slate-300/40 bg-gradient-to-br from-slate-700 to-slate-900"><span className="absolute inset-0 animate-ping rounded-full border-2 border-slate-200/30"/><Search size={38} className="text-slate-200"/></div>
            <p className="mt-5 text-lg font-black">Raqib qidirilmoqda… 00:{String(queueSeconds).padStart(2,"0")}</p>
            <p className="mt-2 text-sm text-slate-400">{message||"Yaqin orada sizga mos raqib topamiz."}</p>
          </div>
          <button onClick={()=>{void stopChannels();setStage("setup");}} className="min-h-14 w-full rounded-full border border-slate-300/20 bg-slate-700/70 text-base font-black text-white">BEKOR QILISH</button>
        </section>}
        {stage==="play"&&<section className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3 pt-2">
          <div className="shrink-0"><div className="flex items-center justify-between text-sm font-black"><span>{Math.floor((60-total)/60)}:{String((60-total)%60).padStart(2,"0")}</span><span className="text-slate-400">00:{String(total).padStart(2,"0")}</span></div><div className="mt-2 flex gap-2"><div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-gradient-to-r from-slate-100 to-slate-400" style={{width:((60-total)/60*100)+"%"}}/></div><div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-gradient-to-r from-slate-400 to-slate-200" style={{width:((60-total)/60*100)+"%"}}/></div></div>
            <div className="mt-5 flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2">{avatar(me,"h-14 w-14")}<div className="min-w-0"><b className="block max-w-28 truncate text-sm">{me?.name||"Siz"}</b><span className="text-xs text-slate-400">XP {gameXP}</span></div></div><div className="text-3xl font-black tabular-nums">{words.filter(w=>w.userId===me?.id||w.userId==="you"||w.userId==="me").length} : {words.filter(w=>w.userId!==me?.id&&w.userId!=="you"&&w.userId!=="me").length}</div><div className="flex min-w-0 items-center gap-2">{avatar(opponent,"h-14 w-14")}<div className="min-w-0 text-right"><b className="block max-w-28 truncate text-sm">{opponent?.name||"Zikra Bot"}</b><span className="text-xs text-slate-400">Raqib</span></div></div></div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto py-5" aria-live="polite">{chat.map(line=><div key={line.id} className={"mb-3 flex "+((line.userId===me?.id||line.userId==="you"||line.userId==="me")?"justify-end":"justify-start")}><div className={"max-w-[82%] rounded-[22px] px-4 py-3 shadow "+((line.userId===me?.id||line.userId==="you"||line.userId==="me")?"border border-slate-300/20 bg-gradient-to-br from-slate-500 to-slate-700 text-white":"border border-white/10 bg-slate-800 text-slate-100")}><p className="mb-1 text-[10px] font-bold opacity-60">{line.name}</p><p className="break-words text-lg">{line.text}</p></div></div>)}{typing&&<p className="text-xs italic text-slate-400">Raqib yozmoqda…</p>}{chat.length===0&&<div className="grid h-full place-items-center text-center text-sm text-slate-500"><div><Swords size={34} className="mx-auto mb-3 opacity-60"/><p>Duel boshlandi. Birinchi so‘zni yozing!</p></div></div>}</div>
          <div className="shrink-0 border-t border-slate-500/30 pt-3">
            <div className="mb-2 flex items-center justify-between text-xs"><b className={turn==="you"||turn===me?.id?"text-slate-200":"text-slate-400"}>{turn==="you"||turn===me?.id?"Navbat sizda":"Raqib navbati"}</b><span className="flex items-center gap-1 font-black"><Clock3 size={14}/>{remaining}s</span></div>
            <form onSubmit={submitWord} className="flex gap-2"><input disabled={!!opponent&&(turn!==me?.id)} value={entry} onChange={e=>sendTyping(e.target.value)} placeholder={words.length?"So‘z: "+norm(words[words.length-1].text).slice(-1).toUpperCase()+" harfidan":"So‘zingizni kiriting…"} className="min-w-0 min-h-14 flex-1 rounded-2xl border border-slate-300/30 bg-slate-100 px-4 text-base text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-50"/><button type="submit" disabled={!!opponent&&(turn!==me?.id)} className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-slate-200 to-slate-400 text-slate-900 shadow-lg disabled:opacity-40"><Send size={21}/></button></form>
            <form onSubmit={sendChat} className="mt-2 flex gap-2"><input value={chatEntry} onChange={e=>setChatEntry(e.target.value)} placeholder="Xabar yozish…" className="min-w-0 min-h-10 flex-1 rounded-xl border border-slate-500/30 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-400"/><button type="submit" className="rounded-xl border border-slate-500/40 px-3" aria-label="Chat xabarini yuborish"><Send size={16}/></button></form>
            <p role="status" className="mt-2 truncate text-xs text-slate-400">{message}</p>
          </div>
        </section>}
        {stage==="result"&&<section className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-5 py-6 text-center">
          <div className="grid h-24 w-24 place-items-center rounded-full border border-white/50 bg-gradient-to-br from-slate-100 to-slate-500 text-slate-800 shadow-2xl"><Trophy size={48}/></div>
          <h1 className={"mt-5 text-4xl font-black "+(won?"text-slate-100":"text-slate-300")}>{won?"G‘alaba!":"O‘yin yakunlandi"}</h1>
          <p className="mt-2 max-w-sm text-sm text-slate-400">{opponent?.name||"Zikra Bot"} {won?"bu safar sizdan ortda qoldi.":"bilan bellashuv yakunlandi."}</p>
          <div className="mt-7 flex w-full max-w-sm items-center justify-between rounded-[28px] border border-slate-300/20 bg-white/5 p-4">
            <div className="flex flex-col items-center gap-2">{avatar(me,"h-16 w-16")}<b className="max-w-28 truncate text-xs">{me?.name||"Siz"}</b><span className="text-xs text-slate-400">XP {gameXP}</span></div>
            <div className="text-3xl font-black">{words.filter(w=>w.userId===me?.id||w.userId==="you"||w.userId==="me").length} : {words.filter(w=>w.userId!==me?.id&&w.userId!=="you"&&w.userId!=="me").length}</div>
            <div className="flex flex-col items-center gap-2">{avatar(opponent,"h-16 w-16")}<b className="max-w-28 truncate text-xs">{opponent?.name||"Zikra Bot"}</b><span className="text-xs text-slate-400">Raqib</span></div>
          </div>
          {won&&gameXP>0&&<p className="mt-4 rounded-full border border-slate-300/20 bg-slate-500/20 px-5 py-3 font-black text-slate-100">+{gameXP} XP</p>}
          <div className="mt-8 grid w-full max-w-sm gap-3"><button onClick={()=>void start()} className="min-h-14 rounded-full bg-gradient-to-b from-slate-200 to-slate-400 font-black text-slate-900 shadow-lg">YANGI RAQIB</button><button onClick={()=>{void stopChannels();setStage("setup");}} className="min-h-12 rounded-full border border-slate-300/25 bg-white/5 font-bold text-slate-100">LOBBIGA QAYTISH</button></div>
        </section>}
      </main>
    </div>,
    document.body
  );
}
