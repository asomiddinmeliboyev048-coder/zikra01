"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Radio, Volume2 } from "lucide-react";

type Track = "english" | "russian" | "coding" | "cyber";
type Props = { track: Track; level: string; avatarId?: "teacher" | "student"; onAvatarSpeakingChange?: (speaking: boolean) => void };
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

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export default function LiveVoicePanel({ track, level, avatarId = "teacher", onAvatarSpeakingChange }: Props) {
  const [status, setStatus] = useState<"idle" | "connecting" | "live" | "error">("idle");
  const [muted, setMuted] = useState(false);
  const tutorName = avatarId === "student" ? "Ziyra" : "Ziyo";
  const [caption, setCaption] = useState(avatarId === "student" ? "Ziyra bilan jonli gaplashishni boshlang." : "Ziyo bilan jonli gaplashishni boshlang.");
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const playbackTimeRef = useRef(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const readyRef = useRef(false);
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const sessionLastRoleRef = useRef<"user" | "assistant" | null>(null);

  async function persistTurn(role: "user" | "assistant", content: string) {
    const clean = content.trim().slice(0, 1200);
    if (!clean) return;
    const current = [...historyRef.current];
    const last = current[current.length - 1];
    if (last?.role === role) current[current.length - 1] = { role, content: clean };
    else current.push({ role, content: clean });
    historyRef.current = current.slice(-24);
    try {
      await fetch("/api/ai-tutor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedTrack: track, level, avatarId, conversationHistory: historyRef.current }),
      });
    } catch (cause) { console.error("[zikra-ai-tutor-memory-save]", cause); }
  }

  function stopPlayback() {
    activeSourcesRef.current.forEach((source) => { try { source.stop(); } catch { /* already stopped */ } });
    activeSourcesRef.current = [];
    playbackTimeRef.current = contextRef.current?.currentTime || 0;
  }

  function closeSession() {
    readyRef.current = false;
    onAvatarSpeakingChange?.(false);
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
    for (let i = 0; i < samples.length; i++) channel[i] = samples[i] / 32768;
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
    let setupTimeout: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Mikrofon uchun HTTPS va brauzer ruxsati kerak.");
      const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      streamRef.current = mic;

      const tokenResponse = await fetch("/api/ai-tutor/realtime-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track, level, avatarId }),
      });
      const tokenPayload = await tokenResponse.json();
      if (!tokenResponse.ok) throw new Error(tokenPayload.error || "Gemini Live token olinmadi.");

      historyRef.current = Array.isArray(tokenPayload.context?.conversationHistory) ? tokenPayload.context.conversationHistory.slice(-24) : [];
      sessionLastRoleRef.current = null;
      const savedContext = tokenPayload.context || {};
      const historyPrompt = historyRef.current.slice(-10).map((item) => (item.role === "user" ? "O‘quvchi" : "Ustoz") + ": " + item.content).join(" | ");
      const context = new AudioContext();
      contextRef.current = context;
      await context.resume();
      const socket = new WebSocket("wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=" + encodeURIComponent(tokenPayload.token));
      socketRef.current = socket;
      setupTimeout = setTimeout(() => {
        if (!readyRef.current && socket.readyState !== WebSocket.CLOSED) {
          console.error("[zikra-gemini-live-timeout] setup did not complete within 15 seconds");
          setError("Gemini Live 15 soniya ichida sessiyani tayyorlamadi. Model ruxsati va token sozlamasini tekshirish kerak.");
          setStatus("error");
          socket.close(4000, "setup timeout");
        }
      }, 15000);

      socket.onopen = () => {
        socket.send(JSON.stringify({
          setup: {
            model: tokenPayload.model || "models/gemini-3.8-live",
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: tokenPayload.voiceName || (avatarId === "student" ? "Aoede" : "Puck") } } },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: {
              parts: [{ text: "Sen Zikra AI Ustoz — "+ (avatarId === "student" ? "Ziyra" : "Ziyo") +" ismli tabiiy, iliq, jonli va hazilkash shaxsiy murabbiysan. Ovoz ohanging suhbatdoshga yaqin, ravon va ifodali bo‘lsin; robotdek bir xil ohangda gapirma. O‘rinli vaziyatlarda yengil, aqlli hazil qil, lekin o‘quvchini kamsitma. Foydalanuvchiga o‘zbek tilida tushuntir. Tanlangan yo‘nalish: "+ ({ english: "ingliz tili", russian: "rus tili", coding: "dasturlash", cyber: "kiberxavfsizlik" } as Record<Track, string>)[track] +". Daraja: "+ level +". Ingliz yoki rus tili mashqlarini shu tilda ber, izoh va xatolar tahlilini o‘zbekcha qil. Dasturlash va kiberxavfsizlikda xavfsiz amaliy misollar ishlat. Bir vaqtda bitta savol ber, javobni kut. Oldingi suhbat xotirasini hisobga ol, foydalanuvchi avval aytgan ma’lumotni qayta-qayta so‘rama. O‘zingni AI ekaningni yashirma. Foydalanuvchi konteksti: "+ (savedContext.memorySummary || "Hozircha qo‘shimcha xotira yo‘q.") +". So‘nggi suhbat: "+ (historyPrompt || "Yangi suhbat.") +"." }],
            },
          },
        }));
      };

      socket.onmessage = async (event) => {
        try {
          const message = JSON.parse(typeof event.data === "string" ? event.data : await event.data.text()) as LiveMessage;
          if (message.error?.message) {
            console.error("[zikra-gemini-live-server-error]", message.error);
            setStatus("error");
            setError("Gemini Live: " + message.error.message);
            onAvatarSpeakingChange?.(false);
            return;
          }
          if (message.setupComplete) {
            if (setupTimeout) clearTimeout(setupTimeout);
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
            setCaption("Ulandik! " + tutorName + " siz bilan salomlashmoqda…");
            socket.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ text: "Suhbatni hozir boshlang. O‘zbek tilida qisqa, samimiy salomlashing va tanlangan ko‘nikma bo‘yicha darajamga mos bitta sodda savol bering. Tabiiy, hazilkash ohangda gapiring." }] }], turnComplete: true } }));
          }
          const inputText = message.inputTranscription?.text || message.serverContent?.inputTranscription?.text;
          const outputText = message.outputTranscription?.text || message.serverContent?.outputTranscription?.text;
          if (inputText) {
            setTranscript((current) => current + (current ? "\n" : "") + "Siz: " + inputText);
            void persistTurn("user", inputText);
            setCaption("Sizni tinglayapman…");
          }
          if (outputText) {
            setTranscript((current) => current + (current ? "\n" : "") + tutorName + ": " + outputText);
            void persistTurn("assistant", outputText);
            setCaption(tutorName + " gapiryapti…");
          }
          if (message.serverContent?.interrupted) { stopPlayback(); onAvatarSpeakingChange?.(false); }
          for (const part of message.serverContent?.modelTurn?.parts || []) {
            if (part.inlineData?.data && part.inlineData.mimeType?.startsWith("audio/pcm")) { onAvatarSpeakingChange?.(true); playPcm(part.inlineData.data); }
            if (part.text) setCaption(tutorName + ": " + part.text);
          }
          if (message.serverContent?.turnComplete) { onAvatarSpeakingChange?.(false); setCaption("Javob tugadi. Davom etavering!"); }
        } catch (cause) {
          console.error("[zikra-gemini-live-message]", cause);
        }
      };

      socket.onerror = (event) => {
        console.error("[zikra-gemini-live-websocket]", event);
        setStatus("error");
        setError("Gemini Live WebSocket ulanishida xatolik. Token, model yoki Google API ruxsatini tekshiring.");
      };
      socket.onclose = (event) => {
        if (setupTimeout) clearTimeout(setupTimeout);
        readyRef.current = false;
        onAvatarSpeakingChange?.(false);
        if (event.code !== 1000) {
          console.error("[zikra-gemini-live-close]", { code: event.code, reason: event.reason, wasClean: event.wasClean });
          setStatus("error");
          setError(`Jonli aloqa uzildi (kod: ${event.code || "noma’lum"}). ${event.reason || "Gemini sessiyasi yopildi."}`);
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
      {transcript && <pre className="mt-3 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/15 p-3 text-[10px] leading-5 text-slate-300">{transcript}</pre>}
      {error && <p role="alert" className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-[11px] text-rose-200">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {status === "live" ? <>
          <button type="button" onClick={toggleMic} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/15">{muted ? <MicOff size={16}/> : <Mic size={16}/>} {muted ? "Mikrofonni yoqish" : "Mikrofonni o‘chirish"}</button>
          <button type="button" onClick={closeSession} className="inline-flex h-11 items-center gap-2 rounded-xl bg-rose-500/90 px-4 text-xs font-bold text-white hover:bg-rose-500"><PhoneOff size={16}/> Suhbatni tugatish</button>
        </> : <button type="button" disabled={status === "connecting"} onClick={startSession} className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-100 to-slate-300 px-5 text-xs font-black text-slate-900 shadow-lg transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-60"><Phone size={16}/> {status === "connecting" ? "Ulanmoqda…" : "Jonli suhbatni boshlash"}</button>}
      </div>
      <p className="mt-3 text-[9px] leading-4 text-slate-500">Brauzer mikrofon ruxsatini so‘raydi. Ulanish qisqa muddatli maxfiy token bilan amalga oshadi; asosiy Gemini API kaliti brauzerga yuborilmaydi.</p>
    </section>
  );
}
