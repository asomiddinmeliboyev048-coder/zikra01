"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Radio, Volume2 } from "lucide-react";

type Track = "english" | "russian" | "coding" | "cyber";
type Props = { track: Track; level: string; avatarId?: "student"; onAvatarSpeakingChange?: (speaking: boolean) => void; onListeningChange?: (listening: boolean) => void; onVoiceLevelChange?: (level: number) => void; onMoodChange?: (mood: "idle" | "speaking" | "thinking" | "amused" | "surprised" | "playful-angry") => void };
type LiveMessage = {
  setupComplete?: Record<string, unknown>;
  inputTranscription?: { text?: string };
  outputTranscription?: { text?: string };
  serverContent?: {
    modelTurn?: { parts?: { inlineData?: { data?: string; mimeType?: string }; text?: string }[] };
    turnComplete?: boolean;
    interrupted?: boolean;
    inputTranscription?: { text?: string };
    outputTranscription?: { text?: string };
  };
  error?: { message?: string };
};

function floatToPcm16(input: Float32Array, inputRate: number, outputRate = 16000) {
  const ratio = inputRate / outputRate;
  const length = Math.floor(input.length / ratio);
  const pcm = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    const position = i * ratio;
    const left = Math.floor(position);
    const fraction = position - left;
    const sample = input[left] * (1 - fraction) + (input[Math.min(left + 1, input.length - 1)] || 0) * fraction;
    const clipped = Math.max(-1, Math.min(1, sample));
    pcm[i] = clipped < 0 ? clipped * 0x8000 : clipped * 0x7fff;
  }
  return pcm;
}

function inferTutorMood(text: string): "idle" | "thinking" | "amused" | "surprised" | "playful-angry" {
  const value = text.toLowerCase();
  if (/(😂|🤣|haha|hazil|kulgili|kulib|kulma)/i.test(value)) return "amused";
  if (/(jahlim|jahl|qattiqqo‘l|ustimdan kul|xafa bo‘ldim|ranjidim)/i.test(value)) return "playful-angry";
  if (/(voy|rostdanmi|hayrat|nimaaa|ajab|seriously|really\?)/i.test(value)) return "surprised";
  if (/(hmm|o‘ylab ko‘ray|bir daqiqa|qiziq savol|let me think)/i.test(value)) return "thinking";
  return "idle";
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export default function LiveVoicePanel({ track, level, onAvatarSpeakingChange, onListeningChange, onVoiceLevelChange, onMoodChange }: Props) {
  const [status, setStatus] = useState<"idle" | "connecting" | "live" | "error">("idle");
  const [muted, setMuted] = useState(false);
  const [caption, setCaption] = useState("Ziyo bilan jonli gaplashishni boshlang.");
  const [error, setError] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const playbackTimeRef = useRef(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const readyRef = useRef(false);

  function stopPlayback() {
    activeSourcesRef.current.forEach((source) => { try { source.stop(); } catch { /* already stopped */ } });
    activeSourcesRef.current = [];
    playbackTimeRef.current = contextRef.current?.currentTime || 0;
  }

  function closeSession() {
    readyRef.current = false;
    socketRef.current?.close();
    socketRef.current = null;
    processorRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    stopPlayback();
    void contextRef.current?.close();
    contextRef.current = null;
    setStatus("idle");
    setMuted(false);
    setCaption("Suhbat yakunlandi. Yana gaplashishni boshlashingiz mumkin.");
  }

  useEffect(() => () => {
    readyRef.current = false;
    socketRef.current?.close();
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    activeSourcesRef.current.forEach((source) => { try { source.stop(); } catch { /* ignore */ } });
    void contextRef.current?.close();
  }, []);

  function playPcm(base64: string) {
    const context = contextRef.current;
    if (!context) return;
    const binary = atob(base64);
    const samples = new Int16Array(Math.floor(binary.length / 2));
    for (let i = 0; i < samples.length; i++) {
      const low = binary.charCodeAt(i * 2);
      const high = binary.charCodeAt(i * 2 + 1);
      let value = (high << 8) | low;
      if (value >= 0x8000) value -= 0x10000;
      samples[i] = value;
    }
    const buffer = context.createBuffer(1, samples.length, 24000);
    const channel = buffer.getChannelData(0);
    let energy = 0;
    for (let i = 0; i < samples.length; i++) {
      channel[i] = samples[i] / 32768;
      energy += channel[i] * channel[i];
    }
    onVoiceLevelChange?.(Math.min(1, Math.sqrt(energy / Math.max(1, samples.length)) * 5.5));
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    const startAt = Math.max(context.currentTime + 0.025, playbackTimeRef.current);
    source.start(startAt);
    playbackTimeRef.current = startAt + buffer.duration;
    activeSourcesRef.current.push(source);
    source.onended = () => { activeSourcesRef.current = activeSourcesRef.current.filter((item) => item !== source); };
  }

  async function startSession() {
    if (status === "connecting" || status === "live") return;
    setStatus("connecting");
    setError("");
    setTranscript("");
    setCaption("Mikrofon va Gemini Live ulanmoqda…");
    try {
      let savedMemory = "";
      try {
        const contextResponse = await fetch("/api/ai-tutor/context");
        if (contextResponse.ok) {
          const contextPayload = await contextResponse.json();
          const profile = contextPayload.profile;
          const plan = contextPayload.learningPlan;
          if (profile) savedMemory += " Foydalanuvchining maqsadi: " + (profile.learning_goal || "ko‘rsatilmagan") + ". Oxirgi mavzusi: " + (profile.focus_topic || "hali belgilanmagan") + ". Avvalgi o‘quv xulosasi: " + (profile.memory_summary || "hali yo‘q") + ".";
          if (plan) savedMemory += " Zikra o‘quv rejasi: " + (plan.skill_name || track) + "; maqsad: " + (plan.purpose || "ko‘rsatilmagan") + "; daraja: " + (plan.current_level || level) + "; maqsadli daraja: " + (plan.target_level || "ko‘rsatilmagan") + "; kunlik vaqt: " + (plan.daily_minutes || "ko‘rsatilmagan") + " daqiqa; uslub: " + (plan.learning_style || "aralash") + "; qiziqishlar: " + (Array.isArray(plan.interests) ? plan.interests.join(", ") : "ko‘rsatilmagan") + ".";
          const recent = Array.isArray(contextPayload.messages) ? contextPayload.messages.slice(-12) : [];
          if (recent.length) savedMemory += " Oxirgi suhbatdan kontekst (takrorlamasdan davom et): " + recent.map((item: { role: string; content: string }) => (item.role === "assistant" ? "Ziyo" : "O‘quvchi") + ": " + String(item.content).slice(0, 450)).join(" | ");
          if (savedMemory) savedMemory += " Shu kontekstdan davom et, lekin hozirgi suhbatda aytilgan yangi ma’lumotni ustun qo‘y.";
        }
      } catch { /* Live session can still start if memory is temporarily unavailable. */ }
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Mikrofon uchun HTTPS va brauzer ruxsati kerak.");
      const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      streamRef.current = mic;

      const tokenResponse = await fetch("/api/ai-tutor/realtime-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track, level }),
      });
      const tokenPayload = await tokenResponse.json();
      if (!tokenResponse.ok) throw new Error(tokenPayload.error || "Gemini Live token olinmadi.");

      const context = new AudioContext();
      contextRef.current = context;
      await context.resume();
      const socket = new WebSocket("wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=" + encodeURIComponent(tokenPayload.token));
      socketRef.current = socket;

      socket.onopen = () => {
        socket.send(JSON.stringify({
          setup: {
            model: tokenPayload.model || "models/gemini-3.8-live",
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: {
              parts: [{ text: "Sen Zikra AI Ustoz — Ziyra ismli samimiy, topqir, hazilkash va talabchan ayol murabbiysan. Sening ovozing erkak tembrida, lekin shaxsiyating Ziyraniki. Tanlangan ko‘nikma: " + ({ english: "ingliz tili", russian: "rus tili", coding: "dasturlash", cyber: "kiberxavfsizlik" } as Record<Track, string>)[track] + ". Daraja: " + level + ". O‘quvchining shaxsiy yo‘l xaritasi va oldingi suhbatlari: " + savedMemory + ". Aynan shu yo‘l xaritasidagi ko‘nikma va maqsadlar bo‘yicha dars ber; boshqa kursga o‘tma. Ingliz yoki rus tilini o‘rgatganda mashqni shu tilda ber, izoh va xatolar tahlilini o‘zbekcha qil. Dasturlash va kiberxavfsizlikda amaliy, xavfsiz misollar ishlat. Bir vaqtda bitta savol ber va javobni kut. Har safar bir xil salomlashma bilan boshlama: foydalanuvchining darajasi, oldingi darsi va oxirgi qiyinchiligiga qarab tabiiy, yangi boshlanish tanla. O‘rinli aqlli hazil qil. Foydalanuvchi hazillashsa, ba’zan kulib, hayron bo‘lib yoki yengil jahli chiqqandek hazilomuz munosabat bildir; hech qachon haqorat qilma. Ovoz ohangingni savol, hazil, rag‘bat va tushuntirishga mos o‘zgartir. O‘zingni AI ekaningni yashirma." }],
            },
          },
        }));
      };

      socket.onmessage = async (event) => {
        try {
          const message = JSON.parse(typeof event.data === "string" ? event.data : await event.data.text()) as LiveMessage;
          if (message.error?.message) {
            setError("Gemini Live: " + message.error.message);
            return;
          }
          if (message.setupComplete) {
            readyRef.current = true;
            const source = context.createMediaStreamSource(mic);
            const processor = context.createScriptProcessor(4096, 1, 1);
            const silentGain = context.createGain();
            silentGain.gain.value = 0;
            sourceRef.current = source;
            processorRef.current = processor;
            processor.onaudioprocess = (audioEvent) => {
              if (!readyRef.current || muted || socket.readyState !== WebSocket.OPEN) return;
              const pcm = floatToPcm16(audioEvent.inputBuffer.getChannelData(0), context.sampleRate);
              socket.send(JSON.stringify({ realtimeInput: { audio: { mimeType: "audio/pcm;rate=16000", data: toBase64(new Uint8Array(pcm.buffer)) } } }));
            };
            source.connect(processor);
            processor.connect(silentGain);
            silentGain.connect(context.destination);
            setStatus("live");
            onListeningChange?.(true);
            onMoodChange?.("idle");
            setCaption("Ziyra sizni tinglayapti…");
            socket.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ text: "Suhbatni boshlang. Foydalanuvchining shaxsiy yo‘l xaritasi va oldingi natijalarini hisobga olib, takrorlanmagan tabiiy kirish bilan gap boshlang. Tanlangan ko‘nikmaga oid darajaga mos bitta savol yoki kichik mashq bering. Har doim bir xil salomlashuvni ishlatmang." }] }], turnComplete: true } }));
          }
          const inputText = message.inputTranscription?.text || message.serverContent?.inputTranscription?.text;
          const outputText = message.outputTranscription?.text || message.serverContent?.outputTranscription?.text;
          if (inputText) {
            onListeningChange?.(true);
            onMoodChange?.(inferTutorMood(inputText));
            void fetch("/api/ai-tutor/transcript", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "live", track, role: "user", content: inputText }) });
            setCaption("Sizni tinglayapman…");
          }
          if (outputText) {
            const detectedMood = inferTutorMood(outputText);
            onMoodChange?.(detectedMood === "idle" ? "speaking" : detectedMood);
            void fetch("/api/ai-tutor/transcript", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "live", track, role: "assistant", content: outputText }) });
            setCaption("Ziyra gapiryapti…");
          }
          if (message.serverContent?.interrupted) { stopPlayback(); onAvatarSpeakingChange?.(false); onVoiceLevelChange?.(0); onMoodChange?.("idle"); }
          for (const part of message.serverContent?.modelTurn?.parts || []) {
            if (part.inlineData?.data && part.inlineData.mimeType?.startsWith("audio/pcm")) { onAvatarSpeakingChange?.(true); onListeningChange?.(false); onMoodChange?.("speaking"); playPcm(part.inlineData.data); }
            if (part.text) setCaption("Ziyo: " + part.text);
          }
          if (message.serverContent?.turnComplete) { onAvatarSpeakingChange?.(false); onListeningChange?.(true); onVoiceLevelChange?.(0); onMoodChange?.("idle"); setCaption("Ziyra sizni tinglayapti…"); }
        } catch (cause) {
          console.error("[zikra-gemini-live-message]", cause);
        }
      };

      socket.onerror = (event) => {
        console.error("[zikra-gemini-live-websocket]", event);
        setStatus("error");
        setError("Gemini Live WebSocket ulanishida xatolik. Token yoki Live API endpointini tekshiring.");
      };
      socket.onclose = (event) => {
        readyRef.current = false;
        if (event.code !== 1000) {
          console.error("[zikra-gemini-live-close]", { code: event.code, reason: event.reason, wasClean: event.wasClean });
          setStatus("error");
          setError(`Jonli aloqa uzildi (kod: ${event.code || "noma’lum"}). ${event.reason || "Qayta ulanishga urinib ko‘ring."}`);
        }
      };
    } catch (cause) {
      closeSession();
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Jonli suhbatni boshlashda xatolik.");
    }
  }

  function toggleMic() {
    const next = !muted;
    setMuted(next);
    if (next) {
      streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = false; });
      if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
    } else {
      streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = true; });
    }
  }

  return (
    <section className="rounded-[28px] border border-cyan-200/20 bg-[linear-gradient(135deg,rgba(39,57,75,.96),rgba(18,26,37,.98))] p-4 shadow-xl sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-black"><Radio size={16} className="text-cyan-200"/> Jonli suhbat <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-cyan-100">Gemini Live</span></div>
          <p className="mt-1 text-[11px] text-slate-400">Matn yozish shart emas — Ziyo bilan tabiiy gaplashing.</p>
        </div>
        <span className="flex items-center gap-2 text-[10px] font-bold text-slate-300"><i className={`h-2 w-2 rounded-full ${status === "live" ? "animate-pulse bg-emerald-300" : status === "error" ? "bg-rose-300" : "bg-slate-500"}`}/>{status === "live" ? "Jonli ulandi" : status === "connecting" ? "Ulanmoqda…" : status === "error" ? "Aloqa xatosi" : "Ulanishga tayyor"}</span>
      </div>
      <div className="mt-4 flex min-h-[76px] items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-3">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/30 bg-gradient-to-br from-slate-100 to-slate-500 text-slate-900 ${status === "live" ? "animate-pulse" : ""}`}><Volume2 size={21}/></div>
        <p aria-live="polite" className="text-xs leading-5 text-slate-200">{caption}</p>
      </div>
      {error && <p role="alert" className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-[11px] text-rose-200">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {status === "live" ? <>
          <button type="button" onClick={toggleMic} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/15">{muted ? <MicOff size={16}/> : <Mic size={16}/>} {muted ? "Mikrofonni yoqish" : "Mikrofonni o‘chirish"}</button>
          <button type="button" onClick={closeSession} className="inline-flex h-11 items-center gap-2 rounded-xl bg-rose-500/90 px-4 text-xs font-bold text-white hover:bg-rose-500"><PhoneOff size={16}/> Suhbatni tugatish</button>
        </> : <button type="button" disabled={status === "connecting"} onClick={startSession} className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-100 to-slate-300 px-5 text-xs font-black text-slate-900 shadow-lg transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-60"><Phone size={16}/> {status === "connecting" ? "Ulanmoqda…" : "Jonli suhbatni boshlash"}</button>}
      </div>
      <p className="mt-2 text-[8px] leading-4 text-slate-500">Mikrofon ruxsati kerak. Suhbat matni ekranda ko‘rsatilmaydi, shaxsiy o‘quv xotirasi esa profilingizda saqlanadi.</p>
    </section>
  );
}
