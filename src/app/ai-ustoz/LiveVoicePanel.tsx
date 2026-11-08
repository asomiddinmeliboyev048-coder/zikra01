"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Radio, Volume2 } from "lucide-react";

type Track = "english" | "russian" | "coding" | "cyber";
type Props = { track: Track; level: string };

type RealtimeEvent = { type?: string; delta?: string; transcript?: string; item?: { role?: string; content?: { transcript?: string; text?: string }[] }; error?: { message?: string } };

export default function LiveVoicePanel({ track, level }: Props) {
  const [status, setStatus] = useState<"idle" | "connecting" | "live" | "error">("idle");
  const [muted, setMuted] = useState(false);
  const [caption, setCaption] = useState("Ziyo bilan jonli gaplashishni boshlang.");
  const [error, setError] = useState("");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);

  function closeSession() {
    channelRef.current?.close();
    channelRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((trackItem) => trackItem.stop());
    streamRef.current = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    setStatus("idle");
    setMuted(false);
    setCaption("Suhbat yakunlandi. Yana gaplashishni boshlashingiz mumkin.");
  }

  useEffect(() => () => {
    channelRef.current?.close();
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach((trackItem) => trackItem.stop());
  }, []);

  async function startSession() {
    if (status === "connecting" || status === "live") return;
    setStatus("connecting");
    setError("");
    setCaption("Mikrofon ulanmoqda…");
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      streamRef.current = mic;
      const tokenResponse = await fetch("/api/ai-tutor/realtime-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track, level }),
      });
      const tokenPayload = await tokenResponse.json();
      if (!tokenResponse.ok) throw new Error(tokenPayload.error || "Sessiya kaliti olinmadi.");

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      mic.getTracks().forEach((micTrack) => pc.addTrack(micTrack, mic));
      const audio = new Audio();
      audio.autoplay = true;
      audioRef.current = audio;
      pc.ontrack = (event) => { audio.srcObject = event.streams[0]; void audio.play().catch(() => undefined); };

      const channel = pc.createDataChannel("oai-events");
      channelRef.current = channel;
      channel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as RealtimeEvent;
          if (data.type === "input_audio_buffer.speech_started") setCaption("Sizni tinglayapman…");
          if (data.type === "response.created") setCaption("Ziyo javob bermoqda…");
          if (data.type === "response.output_audio_transcript.delta" && data.delta) setCaption((current) => current.startsWith("Ziyo: ") ? current + data.delta : "Ziyo: " + data.delta);
          if (data.type === "conversation.item.input_audio_transcription.completed" && data.transcript) setCaption("Siz: " + data.transcript);
          if (data.type === "error") setError(data.error?.message || "Ovozli suhbatda xatolik.");
        } catch { /* Ignore non-JSON transport events. */ }
      };
      channel.onopen = () => setCaption("Ulandik! Bemalol gapiring — Ziyo sizni tinglayapti.");
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setStatus("live");
        if (["failed", "disconnected"].includes(pc.connectionState)) {
          setStatus("error");
          setError("Ovozli aloqa uzildi. Qayta ulanishga urinib ko‘ring.");
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenPayload.clientSecret}`, "Content-Type": "application/sdp" },
        body: offer.sdp,
      });
      if (!sdpResponse.ok) {
        const details = await sdpResponse.text();
        throw new Error(details.slice(0, 260) || "WebRTC ulanishi amalga oshmadi.");
      }
      await pc.setRemoteDescription({ type: "answer", sdp: await sdpResponse.text() });
    } catch (cause) {
      closeSession();
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Jonli suhbatni boshlashda xatolik.");
    }
  }

  function toggleMic() {
    const next = !muted;
    streamRef.current?.getAudioTracks().forEach((trackItem) => { trackItem.enabled = !next; });
    setMuted(next);
  }

  return (
    <section className="rounded-[28px] border border-cyan-200/20 bg-[linear-gradient(135deg,rgba(39,57,75,.96),rgba(18,26,37,.98))] p-4 shadow-xl sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-black"><Radio size={16} className="text-cyan-200"/> Jonli suhbat <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-cyan-100">Realtime AI</span></div>
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
      <p className="mt-3 text-[9px] leading-4 text-slate-500">Brauzer mikrofon ruxsatini so‘raydi. Suhbat davomida gapni bo‘lib savol berishingiz mumkin; Realtime AI javobini avtomatik to‘xtatadi.</p>
    </section>
  );
}
