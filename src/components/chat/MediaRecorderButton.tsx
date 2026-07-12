"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uploadVoiceMessage, uploadVideoNote } from "@/lib/storage";
import { cn } from "@/lib/utils";

/**
 * Telegram uslubidagi ovozli / yumaloq video xabar tugmasi.
 *
 * BOSHQARUV (Pointer Events — sichqoncha va sensorli ekran uchun yagona API):
 *   - QISQA BOSISH (tap): Mikrofon <-> Kamera rejimini almashtiradi.
 *   - BOSIB TURISH (hold): yozishni boshlaydi. Qo'yib yuborilganda to'xtatib,
 *     xabarni yuboradi.
 *   - CHAPGA SURISH: yozishni bekor qiladi (Telegram kabi).
 *   - YUQORIGA SURISH: "lock" (qo'lni bo'shatish) — endi tugmani ushlab
 *     turmasdan Bekor qilish / Yuborish tugmalaridan foydalaniladi.
 *
 * VIDEO REJIMI: yozayotganda ekran markazida YUMALOQ (rounded-full) jonli
 * preview ochiladi. Old/orqa kamerani almashtirish tugmasi ham bor
 * (getUserMedia facingMode 'user' | 'environment').
 *
 * Konventsiyalar:
 *   - ovoz  -> onSend("voice:<url>")
 *   - video -> onSend("circle:<url>")
 */

type Mode = "audio" | "video";
type Phase = "idle" | "recording" | "uploading";

const HOLD_MS = 220; // shundan uzoq ushlansa — yozish (aks holda tap = toggle)
const MIN_MS = 600; // bundan qisqa yozuvlar yuborilmaydi
const CANCEL_DX = 70; // chapga surish chegarasi (bekor qilish)
const LOCK_DY = 70; // yuqoriga surish chegarasi (lock)

/** Brauzer qo'llab-quvvatlaydigan MediaRecorder mime turini tanlaydi */
function pickMime(mode: Mode): { mime: string; ext: string } {
  const audio = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  const video = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  const list = mode === "audio" ? audio : video;
  for (const m of list) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) {
      const ext = m.includes("mp4") ? "mp4" : m.includes("ogg") ? "ogg" : "webm";
      return { mime: m, ext };
    }
  }
  return { mime: "", ext: mode === "audio" ? "webm" : "webm" };
}

export default function MediaRecorderButton({
  onSend,
  disabled,
}: {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("audio");
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [locked, setLocked] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPtRef = useRef({ x: 0, y: 0 });
  const startedAtRef = useRef(0);
  const cancellingRef = useRef(false);
  const lockedRef = useRef(false);
  const pointerDownRef = useRef(false);
  const extRef = useRef("webm");
  const previewRef = useRef<HTMLVideoElement>(null);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  // Komponent yo'qolganda barcha resurslarni tozalash
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      clearTimer();
      try {
        recorderRef.current?.stop();
      } catch {
        /* ignore */
      }
      stopTracks();
    };
  }, [clearTimer, stopTracks]);

  // Jonli preview stream'ini yumaloq <video>ga ulash (video rejimi)
  useEffect(() => {
    if (phase === "recording" && mode === "video" && previewRef.current && streamRef.current) {
      previewRef.current.srcObject = streamRef.current;
      previewRef.current.play().catch(() => {});
    }
  }, [phase, mode, facingMode]);

  const acquireStream = useCallback(
    async (m: Mode, facing: "user" | "environment") => {
      const constraints: MediaStreamConstraints =
        m === "audio"
          ? { audio: true }
          : {
              audio: true,
              video: {
                facingMode,
                width: { ideal: 640 },
                height: { ideal: 640 },
              },
            };
      // facing parametrini aniq uzatamiz (flip uchun)
      if (m === "video") {
        (constraints.video as MediaTrackConstraints).facingMode = facing;
      }
      return navigator.mediaDevices.getUserMedia(constraints);
    },
    [facingMode]
  );

  const finalizeAndSend = useCallback(async () => {
    const blob = new Blob(chunksRef.current, {
      type: recorderRef.current?.mimeType || (mode === "audio" ? "audio/webm" : "video/webm"),
    });
    chunksRef.current = [];
    if (blob.size === 0) {
      setPhase("idle");
      return;
    }
    setPhase("uploading");
    try {
      const url =
        mode === "audio"
          ? await uploadVoiceMessage(blob, extRef.current)
          : await uploadVideoNote(blob, extRef.current);
      await onSend(mode === "audio" ? `voice:${url}` : `circle:${url}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Yuborishda xatolik.");
    } finally {
      setPhase("idle");
      setSeconds(0);
    }
  }, [mode, onSend]);

  const handleStop = useCallback(() => {
    clearTimer();
    stopTracks();

    const elapsed = Date.now() - startedAtRef.current;
    const tooShort = elapsed < MIN_MS;

    if (cancellingRef.current || tooShort) {
      chunksRef.current = [];
      setPhase("idle");
      setSeconds(0);
      return;
    }
    finalizeAndSend();
  }, [clearTimer, stopTracks, finalizeAndSend]);

  const beginRecording = useCallback(async () => {
    try {
      const stream = await acquireStream(mode, facingMode);
      streamRef.current = stream;

      const { mime, ext } = pickMime(mode);
      extRef.current = ext;
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = handleStop;
      rec.start();

      startedAtRef.current = Date.now();
      cancellingRef.current = false;
      setCancelling(false);
      setSeconds(0);
      setPhase("recording");
      clearTimer();
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);

      // Poydevor holati: agar foydalanuvchi stream olinguncha qo'yib yuborgan bo'lsa
      if (!pointerDownRef.current && !lockedRef.current) {
        // Juda qisqa — handleStop MIN_MS bo'yicha o'zi tashlaydi
        setTimeout(() => {
          try {
            recorderRef.current?.stop();
          } catch {
            /* ignore */
          }
        }, 50);
      }
    } catch {
      setPhase("idle");
      alert(
        mode === "audio"
          ? "Mikrofonga ruxsat berilmadi yoki mavjud emas."
          : "Kameraga ruxsat berilmadi yoki mavjud emas."
      );
    }
  }, [acquireStream, mode, facingMode, handleStop, clearTimer]);

  const stopRecording = useCallback((cancel: boolean) => {
    cancellingRef.current = cancel;
    try {
      recorderRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  // --- Pointer boshqaruvi ---
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || phase === "uploading") return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      pointerDownRef.current = true;
      startPtRef.current = { x: e.clientX, y: e.clientY };
      // Hold bo'lsa yozishni boshlaymiz; aks holda tap = toggle
      holdTimerRef.current = setTimeout(() => {
        holdTimerRef.current = null;
        beginRecording();
      }, HOLD_MS);
    },
    [disabled, phase, beginRecording]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (phase !== "recording" || lockedRef.current) return;
      const dx = e.clientX - startPtRef.current.x;
      const dy = e.clientY - startPtRef.current.y;
      // Yuqoriga surish -> lock
      if (dy < -LOCK_DY && Math.abs(dy) > Math.abs(dx)) {
        lockedRef.current = true;
        setLocked(true);
        setCancelling(false);
        cancellingRef.current = false;
        return;
      }
      // Chapga surish -> bekor qilish holati
      const c = dx < -CANCEL_DX;
      cancellingRef.current = c;
      setCancelling(c);
    },
    [phase]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      pointerDownRef.current = false;
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);

      // Hold chegarasidan oldin qo'yib yuborildi -> bu TAP -> rejim toggle
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
        if (phase === "idle") {
          setMode((m) => (m === "audio" ? "video" : "audio"));
        }
        return;
      }

      if (lockedRef.current) return; // lock rejimida tugmalar hal qiladi
      if (phase === "recording") {
        stopRecording(cancellingRef.current);
      }
    },
    [phase, stopRecording]
  );

  const resetLock = useCallback(() => {
    lockedRef.current = false;
    setLocked(false);
  }, []);

  // Lock rejimidagi tugmalar
  const lockedSend = useCallback(() => {
    resetLock();
    stopRecording(false);
  }, [resetLock, stopRecording]);

  const lockedCancel = useCallback(() => {
    resetLock();
    stopRecording(true);
  }, [resetLock, stopRecording]);

  // Kamerani almashtirish (old/orqa). Yozuvni yangi kamera bilan qaytadan
  // boshlaydi (MediaRecorder oqim ichida trekni almashtira olmaydi).
  const flipCamera = useCallback(async () => {
    if (mode !== "video") return;
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    if (phase !== "recording") return;

    // MediaRecorder oqim ichida video trekni almashtira olmaydi, shuning uchun
    // eski yozuvni JIMGINA to'xtatib (onstop'ni uzib — handleStop ishga
    // tushmasligi uchun) yangi kamera bilan qaytadan boshlaymiz.
    const oldRec = recorderRef.current;
    if (oldRec) {
      oldRec.onstop = null;
      try {
        oldRec.stop();
      } catch {
        /* ignore */
      }
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    chunksRef.current = [];

    try {
      const stream = await acquireStream("video", nextFacing);
      streamRef.current = stream;
      const { mime, ext } = pickMime("video");
      extRef.current = ext;
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onstop = handleStop;
      rec.start();
      startedAtRef.current = Date.now();
      setSeconds(0);
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.play().catch(() => {});
      }
    } catch {
      /* ignore */
    }
  }, [mode, facingMode, phase, acquireStream, handleStop]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const recording = phase === "recording";

  return (
    <>
      {/* Ko'k dumaloq tugma — mikrofon yoki kamera (rejimga qarab) */}
      <button
        type="button"
        disabled={disabled || phase === "uploading"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label={mode === "audio" ? "Ovozli xabar" : "Video xabar"}
        className={cn(
          "flex h-11 w-11 shrink-0 touch-none select-none items-center justify-center rounded-full text-white shadow-sm transition",
          recording ? "scale-110 bg-red-500" : "bg-brand hover:bg-brand-600",
          "disabled:opacity-50"
        )}
        style={{ touchAction: "none" }}
      >
        {phase === "uploading" ? (
          <span className="text-sm">⏳</span>
        ) : mode === "audio" ? (
          <MicIcon />
        ) : (
          <CameraIcon />
        )}
      </button>

      {/* --- OVOZ yozish paneli (pastda) --- */}
      {recording && mode === "audio" && (
        <div className="fixed inset-x-0 bottom-0 z-[90] flex items-center gap-3 border-t border-gray-100 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
          <span className="font-mono text-sm font-semibold text-gray-800">
            {mm}:{ss}
          </span>
          <span
            className={cn(
              "flex-1 text-center text-sm transition",
              cancelling ? "font-semibold text-red-500" : "text-gray-400"
            )}
          >
            {cancelling ? "Qo'yib yuboring — bekor qilinadi" : "‹ Bekor qilish uchun suring"}
          </span>
          {locked ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={lockedCancel}
                className="rounded-full bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600"
              >
                Bekor
              </button>
              <button
                type="button"
                onClick={lockedSend}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white"
                aria-label="Yuborish"
              >
                <SendIcon />
              </button>
            </div>
          ) : (
            <span className="text-xs text-gray-400">↑ qulflash</span>
          )}
        </div>
      )}

      {/* --- YUMALOQ VIDEO yozish oynasi (markazda) --- */}
      {recording && mode === "video" && (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-5 bg-black/70 backdrop-blur-sm">
          <div
            className={cn(
              "relative aspect-square w-[72vw] max-w-[320px] overflow-hidden rounded-full border-4 shadow-2xl transition",
              cancelling ? "border-red-500 opacity-60" : "border-white"
            )}
          >
            <video
              ref={previewRef}
              muted
              autoPlay
              playsInline
              className={cn(
                "h-full w-full object-cover",
                facingMode === "user" && "scale-x-[-1]" // selfie kamerada oyna effekti
              )}
            />
            {/* Kamera almashtirish tugmasi */}
            <button
              type="button"
              onClick={flipCamera}
              className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
              aria-label="Kamerani almashtirish"
            >
              <FlipCameraIcon />
            </button>
            {/* Yozish indikatori */}
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="font-mono text-xs font-semibold text-white">
                {mm}:{ss}
              </span>
            </div>
          </div>

          <p
            className={cn(
              "text-sm font-medium transition",
              cancelling ? "text-red-400" : "text-white/80"
            )}
          >
            {cancelling
              ? "Qo'yib yuboring — bekor qilinadi"
              : locked
              ? "Yozilmoqda..."
              : "‹ suring: bekor · ↑ suring: qulflash"}
          </p>

          {locked && (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={lockedCancel}
                className="rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={lockedSend}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg"
                aria-label="Yuborish"
              >
                <SendIcon />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ---------- Ikonkalar ---------- */
function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="14" height="12" rx="2.5" />
      <path d="M16 10l6-3v10l-6-3z" strokeLinejoin="round" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.993.993 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
    </svg>
  );
}
function FlipCameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 5h-3l-2-2H9L7 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" strokeLinejoin="round" />
      <path d="M9 12a3 3 0 0 1 3-3c1 0 1.9.5 2.4 1.2M15 12a3 3 0 0 1-3 3c-1 0-1.9-.5-2.4-1.2" strokeLinecap="round" />
      <path d="M14.5 8.5V10H13M9.5 15.5V14H11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
