"use client";

import { useEffect, useRef, useState } from "react";
import { uploadVoiceMessage, uploadRoundVideo } from "@/lib/storage";
import { cn } from "@/lib/utils";

/**
 * Telegram uslubidagi ovozli / yumaloq video xabar tugmasi.
 *
 * Boshqaruv:
 *   - QISQA BOSISH (tap): rejimni almashtiradi — Mikrofon (🎤) ↔ Kamera (🎥).
 *   - BOSIB TURISH (hold): yozishni boshlaydi. Qo'yib yuborilganda yuboradi.
 *   - CHAPGA SURISH: yozishni bekor qiladi.
 *   - TEPAGA SURISH: "lock" (qo'lsiz) rejim — keyin Yuborish/Bekor/Kamera
 *     tugmalari chiqadi.
 *   - Video rejimda yozayotganda ekranda YUMALOQ jonli oyna ko'rinadi.
 *   - Kamera almashtirish (old/orqa) lock rejimda mumkin.
 *
 * Yuborish: onSend("voice:<url>") yoki onSend("roundvideo:<url>").
 */

type Mode = "audio" | "video";
type Phase = "idle" | "starting" | "recording" | "uploading";

const HOLD_DELAY = 180; // ms — shu vaqtdan keyin bosib turish "yozish" deb hisoblanadi
const CANCEL_DX = -80; // px — chapga shuncha surilsa bekor qilinadi
const LOCK_DY = -70; // px — tepaga shuncha surilsa lock bo'ladi

export default function MediaMessageButton({
  onSend,
  disabled,
}: {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("audio");
  const [phase, setPhase] = useState<Phase>("idle");
  const [locked, setLocked] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [cancelZone, setCancelZone] = useState(false);

  // Ref'lar — async/pointer hodisalarida "stale closure" muammosini oldini oladi
  const phaseRef = useRef<Phase>("idle");
  const modeRef = useRef<Mode>("audio");
  const facingRef = useRef<"user" | "environment">("user");
  const lockedRef = useRef(false);
  const cancelledRef = useRef(false);
  const cancelZoneRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const flippingRef = useRef(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const previewRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Komponent yo'qolganda barcha resurslarni tozalash
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
    lockedRef.current = false;
    cancelZoneRef.current = false;
    setLocked(false);
    setCancelZone(false);
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

  // --- Yozishni boshlash (getUserMedia + MediaRecorder) ---
  async function startRecording() {
    setPhaseBoth("starting");
    cancelledRef.current = false;
    cancelZoneRef.current = false;
    setCancelZone(false);
    try {
      const constraints: MediaStreamConstraints =
        modeRef.current === "video"
          ? { audio: true, video: { facingMode: facingRef.current } }
          : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Foydalanuvchi tayyor bo'lishidan oldin qo'yib yuborgan bo'lsa — bekor
      if (stopRequestedRef.current) {
        stopRequestedRef.current = false;
        stream.getTracks().forEach((t) => t.stop());
        resetIdle();
        return;
      }

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

      // Video rejimda jonli yumaloq oynani ko'rsatamiz
      if (modeRef.current === "video" && previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.muted = true;
        previewRef.current.play().catch(() => {});
      }
    } catch {
      alert(
        modeRef.current === "video"
          ? "Kameraga ruxsat berilmadi yoki mavjud emas."
          : "Mikrofonga ruxsat berilmadi yoki mavjud emas."
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
      // kichik kechikish bilan yangi oqimni ochamiz
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
    // Juda qisqa/bo'sh yozuvni yubormaymiz
    if (blob.size < 1000) {
      resetIdle();
      return;
    }

    setPhaseBoth("uploading");
    lockedRef.current = false;
    setLocked(false);
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
    setMode((m) => (m === "audio" ? "video" : "audio"));
  }

  async function flipCamera() {
    // Faqat video rejimda va yozayotganda — yangi kamera bilan qayta boshlaymiz
    facingRef.current = facingRef.current === "user" ? "environment" : "user";
    setFacing(facingRef.current);
    if (phaseRef.current === "recording") {
      flippingRef.current = true;
      cancelledRef.current = false;
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop(); // handleStop flippingRef'ni ko'radi va qayta boshlaydi
      }
    }
  }

  // --- Pointer (sichqoncha + sensor) hodisalari ---
  function onPointerDown(e: React.PointerEvent) {
    if (disabled || phaseRef.current !== "idle") return;
    e.preventDefault();
    // Pointer capture — barmoq tugmadan tashqariga surilsa ham move/up hodisalari
    // shu tugmaga kelaveradi (chapga/tepaga surish ishlashi uchun zarur).
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* qo'llab-quvvatlanmasa e'tiborsiz */
    }
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    cancelledRef.current = false;
    stopRequestedRef.current = false;
    cancelZoneRef.current = false;
    setCancelZone(false);
    // HOLD_DELAY dan keyin yozish boshlanadi (qisqa bosish = toggle)
    pressTimerRef.current = setTimeout(() => {
      startRecording();
    }, HOLD_DELAY);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (phaseRef.current !== "recording" || lockedRef.current) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    // Tepaga surish → lock (qo'lsiz rejim)
    if (dy < LOCK_DY) {
      lockedRef.current = true;
      setLocked(true);
      return;
    }
    // Chapga surish → bekor qilish zonasi
    const inCancel = dx < CANCEL_DX;
    if (inCancel !== cancelZoneRef.current) {
      cancelZoneRef.current = inCancel;
      setCancelZone(inCancel);
    }
  }

  function onPointerUp() {
    // Hali yozish boshlanmagan (arming) — bu QISQA BOSISH → rejim almashtirish
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (phaseRef.current === "idle") {
      toggleMode();
      return;
    }
    if (phaseRef.current === "starting") {
      // getUserMedia hali tugamagan — qo'yib yuborildi, bekor qilamiz
      stopRequestedRef.current = true;
      return;
    }
    if (phaseRef.current === "recording") {
      if (lockedRef.current) return; // lock rejimda tugmalar orqali boshqariladi
      if (cancelZoneRef.current) cancelRecording();
      else stopAndSend();
    }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const recording = phase === "recording" || phase === "starting";

  return (
    <>
      {/* Ko'k dumaloq tugma */}
      <button
        type="button"
        disabled={disabled || phase === "uploading"}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerMove={onPointerMove}
        onPointerCancel={cancelRecording}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          "flex h-11 w-11 shrink-0 select-none touch-none items-center justify-center rounded-full text-white transition",
          recording ? "scale-110 bg-red-500" : "bg-brand hover:bg-brand-600",
          "disabled:opacity-50"
        )}
        title={mode === "audio" ? "Ovozli xabar (bosib turing)" : "Video xabar (bosib turing)"}
        aria-label={mode === "audio" ? "Ovozli xabar" : "Video xabar"}
      >
        {phase === "uploading" ? (
          <span className="text-sm">⏳</span>
        ) : mode === "audio" ? (
          // Mikrofon ikonkasi
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8" strokeLinecap="round" />
          </svg>
        ) : (
          // Kamera ikonkasi
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m23 7-7 5 7 5V7z" strokeLinejoin="round" />
            <rect x="1" y="5" width="15" height="14" rx="2" />
          </svg>
        )}
      </button>

      {/* Yozish paytidagi qoplama (overlay) */}
      {recording && (
        <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          {/* Video rejim — jonli yumaloq oyna */}
          {mode === "video" && (
            <div className="relative mb-6">
              <div
                className={cn(
                  "h-64 w-64 overflow-hidden rounded-full border-4 shadow-2xl",
                  cancelZone ? "border-red-500" : "border-white/80"
                )}
              >
                <video
                  ref={previewRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn(
                    "h-full w-full object-cover",
                    facing === "user" && "-scale-x-100" // old kamerada oyna effekti
                  )}
                />
              </div>
              {/* Kamera almashtirish — lock rejimda ko'rinadi */}
              {locked && (
                <button
                  type="button"
                  onClick={flipCamera}
                  className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg"
                  title="Kamerani almashtirish"
                  aria-label="Kamerani almashtirish"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 4h5v5M20 4l-6 6M9 20H4v-5M4 20l6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Taymer + rang indikatori */}
          <div className="mb-4 flex items-center gap-2 text-white">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <span className="font-mono text-lg">
              {mm}:{ss}
            </span>
          </div>

          {/* Ko'rsatma yoki lock tugmalari */}
          {!locked ? (
            <p className={cn("text-sm", cancelZone ? "text-red-400" : "text-white/80")}>
              {cancelZone
                ? "↩︎ Bekor qilish uchun qo'yib yuboring"
                : "◀ Bekor qilish  ·  ▲ Qo'lsiz yozish (lock)"}
            </p>
          ) : (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={cancelRecording}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white"
                title="Bekor qilish"
                aria-label="Bekor qilish"
              >
                🗑
              </button>
              <button
                type="button"
                onClick={stopAndSend}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl text-white shadow-lg"
                title="Yuborish"
                aria-label="Yuborish"
              >
                ➤
              </button>
              {mode === "video" && (
                <button
                  type="button"
                  onClick={flipCamera}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white"
                  title="Kamerani almashtirish"
                  aria-label="Kamerani almashtirish"
                >
                  🔄
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
