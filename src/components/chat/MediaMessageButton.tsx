"use client";

import { useEffect, useRef, useState } from "react";
import { uploadVoiceMessage, uploadRoundVideo } from "@/lib/storage";
import { cn } from "@/lib/utils";

/**
 * Telegram uslubidagi ovozli / yumaloq video xabar tugmasi (mobil uchun ishonchli).
 *
 * Boshqaruv (bosib turishga tayanmaydi — mobil'da eng ishonchli usul):
 *   - Kichik "almashtirish" tugmasi: Mikrofon (🎤) ↔ Kamera (🎥) rejimini almashtiradi.
 *   - Asosiy tugmani BOSISH: yozishni boshlaydi (getUserMedia to'g'ridan-to'g'ri
 *     bosish hodisasida chaqiriladi — shu sabab kamera/mikrofon ruxsati ishonchli).
 *   - Yozayotganda ekranda: Bekor (🗑), Yuborish (➤) va video rejimda kamera
 *     almashtirish (old/orqa) tugmalari chiqadi.
 *   - Video rejimda jonli YUMALOQ oyna ko'rinadi.
 *
 * Yuborish: onSend("voice:<url>") yoki onSend("roundvideo:<url>").
 */

type Mode = "audio" | "video";
type Phase = "idle" | "starting" | "recording" | "uploading";

export default function MediaMessageButton({
  onSend,
  disabled,
}: {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("audio");
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [facing, setFacing] = useState<"user" | "environment">("user");

  // Ref'lar — async hodisalarda "stale closure" muammosini oldini oladi
  const modeRef = useRef<Mode>("audio");
  const facingRef = useRef<"user" | "environment">("user");
  const cancelledRef = useRef(false);
  const flippingRef = useRef(false);
  const phaseRef = useRef<Phase>("idle");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    return () => cleanupStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setPhaseBoth(p: Phase) {
    phaseRef.current = p;
    setPhase(p);
  }

  function cleanupStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function resetIdle() {
    cleanupStream();
    recorderRef.current = null;
    chunksRef.current = [];
    setSeconds(0);
    setPhaseBoth("idle");
  }

  function pickMime(m: Mode): string {
    const candidates =
      m === "video"
        ? ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
        : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
    return candidates.find((c) => MediaRecorder.isTypeSupported(c)) || "";
  }

  // --- Yozishni boshlash (getUserMedia TO'G'RIDAN-TO'G'RI bosishda chaqiriladi) ---
  async function startRecording() {
    // Faqat "idle" (yangi yozuv) yoki "starting" (kamera almashtirilgach qayta
    // boshlash) holatida ruxsat beramiz.
    if (phaseRef.current !== "idle" && phaseRef.current !== "starting") return;
    setPhaseBoth("starting");
    cancelledRef.current = false;
    try {
      const constraints: MediaStreamConstraints =
        modeRef.current === "video"
          ? { audio: true, video: { facingMode: facingRef.current } }
          : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = pickMime(modeRef.current);
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = handleStop;
      rec.start();

      setPhaseBoth("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);

      if (modeRef.current === "video" && previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.muted = true;
        previewRef.current.play().catch(() => {});
      }
    } catch {
      alert(
        modeRef.current === "video"
          ? "Kameraga ruxsat berilmadi yoki mavjud emas. Brauzer sozlamalaridan ruxsat bering."
          : "Mikrofonga ruxsat berilmadi yoki mavjud emas. Brauzer sozlamalaridan ruxsat bering."
      );
      resetIdle();
    }
  }

  // --- Recorder to'xtaganda: yuklash yoki bekor qilish ---
  async function handleStop() {
    cleanupStream();

    // Kamera almashtirilyapti — yuklamaymiz, yangi kamera bilan qayta boshlaymiz
    if (flippingRef.current) {
      flippingRef.current = false;
      setPhaseBoth("starting");
      setTimeout(() => startRecording(), 150);
      return;
    }

    const wasVideo = modeRef.current === "video";
    if (cancelledRef.current) {
      resetIdle();
      return;
    }
    const blob = new Blob(chunksRef.current, {
      type: recorderRef.current?.mimeType || (wasVideo ? "video/webm" : "audio/webm"),
    });
    if (blob.size < 1000) {
      resetIdle();
      return;
    }

    setPhaseBoth("uploading");
    try {
      if (wasVideo) {
        const url = await uploadRoundVideo(blob);
        await onSend(`roundvideo:${url}`);
      } else {
        const url = await uploadVoiceMessage(blob);
        await onSend(`voice:${url}`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Yuborishda xatolik.");
    } finally {
      resetIdle();
    }
  }

  function stopAndSend() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }

  function cancelRecording() {
    cancelledRef.current = true;
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    } else {
      resetIdle();
    }
  }

  function toggleMode() {
    if (phaseRef.current !== "idle") return;
    const next: Mode = modeRef.current === "audio" ? "video" : "audio";
    modeRef.current = next;
    setMode(next);
  }

  function flipCamera() {
    facingRef.current = facingRef.current === "user" ? "environment" : "user";
    setFacing(facingRef.current);
    if (phaseRef.current === "recording") {
      flippingRef.current = true;
      cancelledRef.current = false;
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop(); // handleStop qayta boshlaydi
      }
    }
  }

  // Asosiy tugma: bo'sh bo'lsa yozishni boshlaydi, yozayotgan bo'lsa yuboradi
  function onMainClick() {
    if (disabled || phase === "uploading") return;
    if (phaseRef.current === "idle") startRecording();
    else if (phaseRef.current === "recording") stopAndSend();
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const recording = phase === "recording" || phase === "starting";

  return (
    <div className="flex shrink-0 items-center gap-1">
      {/* Rejim almashtirish (faqat idle) — Mikrofon ↔ Kamera */}
      {phase === "idle" && (
        <button
          type="button"
          onClick={toggleMode}
          disabled={disabled}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
          title={mode === "audio" ? "Video xabarga o'tish" : "Ovozli xabarga o'tish"}
          aria-label="Rejimni almashtirish"
        >
          {mode === "audio" ? (
            // Hozir audio — kameraga o'tish uchun kamera ikonkasi
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m23 7-7 5 7 5V7z" strokeLinejoin="round" />
              <rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
          ) : (
            // Hozir video — mikrofonga o'tish uchun mikrofon ikonkasi
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8" strokeLinecap="round" />
            </svg>
          )}
        </button>
      )}

      {/* Asosiy yozish tugmasi */}
      <button
        type="button"
        disabled={disabled || phase === "uploading"}
        onClick={onMainClick}
        className={cn(
          "flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-full text-white transition",
          recording ? "scale-110 animate-pulse bg-red-500" : "bg-brand hover:bg-brand-600",
          "disabled:opacity-50"
        )}
        title={
          recording
            ? "Yuborish"
            : mode === "audio"
            ? "Ovozli xabar yozish"
            : "Video xabar yozish"
        }
        aria-label={mode === "audio" ? "Ovozli xabar" : "Video xabar"}
      >
        {phase === "uploading" ? (
          <span className="text-sm">⏳</span>
        ) : recording ? (
          // Yozayotganda — to'xtat/yubor belgisi
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : mode === "audio" ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m23 7-7 5 7 5V7z" strokeLinejoin="round" />
            <rect x="1" y="5" width="15" height="14" rx="2" />
          </svg>
        )}
      </button>

      {/* Yozish paytidagi qoplama (overlay) */}
      {recording && (
        <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm">
          {/* Video rejim — jonli yumaloq oyna */}
          {mode === "video" && (
            <div className="relative mb-8">
              <div className="h-64 w-64 overflow-hidden rounded-full border-4 border-white/80 shadow-2xl">
                <video
                  ref={previewRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn(
                    "h-full w-full object-cover",
                    facing === "user" && "-scale-x-100"
                  )}
                />
              </div>
              {/* Kamera almashtirish (old/orqa) */}
              <button
                type="button"
                onClick={flipCamera}
                className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg"
                title="Kamerani almashtirish (old/orqa)"
                aria-label="Kamerani almashtirish"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 4h5v5M20 4l-6 6M9 20H4v-5M4 20l6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}

          {/* Taymer */}
          <div className="mb-6 flex items-center gap-2 text-white">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <span className="font-mono text-lg">
              {mm}:{ss}
            </span>
          </div>

          {/* Boshqaruv tugmalari: Bekor · Yuborish */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={cancelRecording}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-xl text-white"
              title="Bekor qilish"
              aria-label="Bekor qilish"
            >
              🗑
            </button>
            <button
              type="button"
              onClick={stopAndSend}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-3xl text-white shadow-lg active:scale-95"
              title="Yuborish"
              aria-label="Yuborish"
            >
              ➤
            </button>
            {mode === "video" && (
              <button
                type="button"
                onClick={flipCamera}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-xl text-white"
                title="Kamerani almashtirish"
                aria-label="Kamerani almashtirish"
              >
                🔄
              </button>
            )}
          </div>

          <p className="mt-6 text-xs text-white/60">
            {mode === "audio" ? "Ovozli xabar yozilmoqda…" : "Video xabar yozilmoqda…"}
          </p>
        </div>
      )}
    </div>
  );
}
