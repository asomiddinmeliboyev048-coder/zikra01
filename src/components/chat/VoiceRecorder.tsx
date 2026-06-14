"use client";

import { useEffect, useRef, useState } from "react";
import { uploadVoiceMessage } from "@/lib/storage";
import { cn } from "@/lib/utils";

/**
 * Ovozli xabar yozish tugmasi.
 * MediaRecorder API orqali mikrofondan ovoz yozadi, Supabase Storage'ga
 * yuklaydi va `onSend("voice:<url>")` orqali xabar sifatida yuboradi.
 */
export default function VoiceRecorder({
  onSend,
  disabled,
}: {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [state, setState] = useState<"idle" | "recording" | "uploading">("idle");
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  // Komponent yo'qolganda mikrofonni tozalash
  useEffect(() => {
    return () => stopStream();
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function start() {
    if (disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      cancelledRef.current = false;

      // Brauzer qo'llab-quvvatlasa opus, aks holda standart
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = rec;

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = handleStop;

      rec.start();
      setState("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      alert("Mikrofonga ruxsat berilmadi yoki mavjud emas.");
    }
  }

  async function handleStop() {
    stopStream();
    if (cancelledRef.current) {
      setState("idle");
      setSeconds(0);
      return;
    }
    const blob = new Blob(chunksRef.current, {
      type: recorderRef.current?.mimeType || "audio/webm",
    });
    if (blob.size === 0) {
      setState("idle");
      return;
    }
    setState("uploading");
    try {
      const url = await uploadVoiceMessage(blob);
      await onSend(`voice:${url}`); // konventsiya: ovozli xabar prefiksi
    } catch (err) {
      alert(err instanceof Error ? err.message : "Yuborishda xatolik.");
    } finally {
      setState("idle");
      setSeconds(0);
    }
  }

  function stop() {
    recorderRef.current?.stop();
  }

  function cancel() {
    cancelledRef.current = true;
    recorderRef.current?.stop();
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  if (state === "uploading") {
    return (
      <span className="flex h-9 w-9 items-center justify-center text-gray-400">
        ⏳
      </span>
    );
  }

  if (state === "recording") {
    return (
      <div className="flex items-center gap-2 rounded-full bg-accent/10 px-2 py-1">
        <button
          type="button"
          onClick={cancel}
          className="rounded-full p-1 text-gray-500 hover:bg-gray-200"
          title="Bekor qilish"
        >
          🗑
        </button>
        <span className="flex items-center gap-1 text-sm font-medium text-accent">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          {mm}:{ss}
        </span>
        <button
          type="button"
          onClick={stop}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-600"
          title="Yuborish"
        >
          ➤
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={disabled}
      className={cn(
        "rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
      )}
      title="Ovozli xabar yozish"
    >
      🎤
    </button>
  );
}
