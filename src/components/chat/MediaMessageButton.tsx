"use client";

import { useEffect, useRef, useState } from "react";
import { uploadVoiceMessage, uploadRoundVideo } from "@/lib/storage";
import { cn } from "@/lib/utils";

/**
 * Telegram uslubidagi ovozli / yumaloq video xabar tugmasi.
 *
 * Boshqaruv (aynan Telegram kabi):
 *   1) QISQA BOSISH (tap)  -> rejimni almashtiradi: Mikrofon (🎤) ↔ Kamera (🎥).
 *   2) BOSIB TURISH (hold) -> yozishni boshlaydi:
 *        - Mikrofon rejimi  -> ovoz yoziladi.
 *        - Kamera rejimi     -> yumaloq (circle) video yoziladi, ekranda jonli
 *          yumaloq oyna + taymer ko'rinadi.
 *   3) QO'YIB YUBORISH (release) -> yozish to'xtaydi, fayl Supabase Storage'ga
 *      yuklanadi va chatga yuboriladi.
 *   4) CHAPGA SURIB qo'yib yuborish -> yozishni bekor qiladi (yubormaydi).
 *
 * Chiqish formati (o'zgarmasligi SHART — ChatClient shunga qarab render qiladi):
 *   onSend("voice:<url>")  yoki  onSend("roundvideo:<url>")
 */

type Mode = "audio" | "video";
// idle: kutmoqda | starting: kamera/mikrofon ochilyapti | recording: yozyapti | uploading: yuklanyapti
type Phase = "idle" | "starting" | "recording" | "uploading";

// Shu vaqtdan (ms) kam ushlab tursa — bu QISQA BOSISH (tap = rejim almashtirish).
// Undan ko'p ushlansa — YOZISH boshlanadi. 160ms sezilmaydi, lekin tap/hold'ni
// ishonchli ajratadi (aks holda har tap kamera/mikrofonni yoqib yuborardi).
const HOLD_DELAY = 160;
// Chapga shuncha px surilsa — bekor qilish zonasi.
const CANCEL_DX = -80;
// Bundan kichik/qisqa yozuv yubormaymiz (tasodifiy bosish).
const MIN_BLOB_BYTES = 900;

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
  const [cancelZone, setCancelZone] = useState(false);

  // Ref'lar — pointer/async hodisalarida "stale closure" muammosini oldini oladi
  const modeRef = useRef<Mode>("audio");
  const phaseRef = useRef<Phase>("idle");
  const cancelledRef = useRef(false);
  const cancelZoneRef = useRef(false);
  const releasedEarlyRef = useRef(false); // stream tayyor bo'lishidan oldin qo'yib yuborildimi

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startXRef = useRef(0);
  const previewRef = useRef<HTMLVideoElement | null>(null);

  // mode state <-> ref sinxron
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Komponent yo'qolganda barcha resurslarni tozalash
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setPhaseBoth(p: Phase) {
    phaseRef.current = p;
    setPhase(p);
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function resetIdle() {
    stopStream();
    recorderRef.current = null;
    chunksRef.current = [];
    cancelledRef.current = false;
    cancelZoneRef.current = false;
    releasedEarlyRef.current = false;
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

  // --- Yozishni boshlash ---
  async function startRecording() {
    // Brauzer qo'llab-quvvatlaydimi / xavfsiz kontekst (HTTPS) bormi?
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function"
    ) {
      alert(
        "Ovoz/video yozib bo'lmadi. Brauzer bu funksiyani qo'llab-quvvatlamaydi yoki sayt HTTPS orqali ochilmagan."
      );
      resetIdle();
      return;
    }

    setPhaseBoth("starting");
    cancelledRef.current = false;
    cancelZoneRef.current = false;
    releasedEarlyRef.current = false;
    setCancelZone(false);

    const isVideo = modeRef.current === "video";

    try {
      const constraints: MediaStreamConstraints = isVideo
        ? { audio: true, video: { facingMode: "user" } }
        : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Ruxsat so'ralayotgan vaqtda foydalanuvchi qo'yib yuborgan bo'lsa — bekor
      if (releasedEarlyRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        resetIdle();
        return;
      }

      streamRef.current = stream;
      chunksRef.current = [];

      const mime = pickMime(modeRef.current);
      const rec = new MediaRecorder(
        stream,
        mime ? { mimeType: mime } : undefined
      );
      recorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = handleStop;
      rec.start();

      setPhaseBoth("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);

      // Video rejim — jonli yumaloq oynani ulaymiz
      if (isVideo && previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.muted = true;
        previewRef.current.play().catch(() => {});
      }
    } catch {
      alert(
        isVideo
          ? "Kameraga ruxsat berilmadi yoki mavjud emas."
          : "Mikrofonga ruxsat berilmadi yoki mavjud emas."
      );
      resetIdle();
    }
  }

  // --- Recorder to'xtaganda: yuklash yoki bekor qilish ---
  async function handleStop() {
    stopStream();

    const wasVideo = modeRef.current === "video";

    if (cancelledRef.current) {
      resetIdle();
      return;
    }

    const blob = new Blob(chunksRef.current, {
      type:
        recorderRef.current?.mimeType || (wasVideo ? "video/webm" : "audio/webm"),
    });

    // Juda qisqa/bo'sh yozuvni yubormaymiz
    if (blob.size < MIN_BLOB_BYTES) {
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
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    else resetIdle();
  }

  function cancelRecording() {
    cancelledRef.current = true;
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    else resetIdle();
  }

  function toggleMode() {
    setMode((m) => {
      const next = m === "audio" ? "video" : "audio";
      modeRef.current = next;
      return next;
    });
  }

  // --- Pointer hodisalari (sichqoncha + sensor birga) ---
  function onPointerDown(e: React.PointerEvent) {
    if (disabled || phaseRef.current !== "idle") return;
    e.preventDefault();
    // Pointer capture: barmoq tugmadan chiqib ketsa ham move/up shu tugmaga keladi
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* qo'llab-quvvatlanmasa e'tiborsiz */
    }
    startXRef.current = e.clientX;
    cancelledRef.current = false;
    releasedEarlyRef.current = false;
    cancelZoneRef.current = false;
    setCancelZone(false);
    // HOLD_DELAY dan keyin yozish boshlanadi (undan qisqa bosish = tap/toggle)
    pressTimerRef.current = setTimeout(() => {
      pressTimerRef.current = null;
      startRecording();
    }, HOLD_DELAY);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (phaseRef.current !== "recording") return;
    const dx = e.clientX - startXRef.current;
    const inCancel = dx < CANCEL_DX;
    if (inCancel !== cancelZoneRef.current) {
      cancelZoneRef.current = inCancel;
      setCancelZone(inCancel);
    }
  }

  function onPointerUp() {
    // Yozish hali boshlanmagan (HOLD_DELAY ichida qo'yib yuborildi) => QISQA BOSISH
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
      if (phaseRef.current === "idle") toggleMode();
      return;
    }
    if (phaseRef.current === "starting") {
      // Stream hali ochilyapti — qo'yib yuborildi, tayyor bo'lgach bekor qilinadi
      releasedEarlyRef.current = true;
      return;
    }
    if (phaseRef.current === "recording") {
      if (cancelZoneRef.current) cancelRecording();
      else stopAndSend();
    }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const recording = phase === "recording" || phase === "starting";

  return (
    <>
      {/* Ko'k dumaloq tugma (yozayotganda qizil) */}
      <button
        type="button"
        disabled={disabled || phase === "uploading"}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerMove={onPointerMove}
        onPointerCancel={cancelRecording}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          "flex h-11 w-11 shrink-0 touch-none select-none items-center justify-center rounded-full text-white transition",
          recording ? "scale-110 bg-red-500" : "bg-brand hover:bg-brand-600",
          "disabled:opacity-50"
        )}
        title={
          mode === "audio"
            ? "Ovozli xabar: bosib turing. Tegsangiz — kameraga o'tadi."
            : "Video xabar: bosib turing. Tegsangiz — mikrofonga o'tadi."
        }
        aria-label={mode === "audio" ? "Ovozli xabar" : "Video xabar"}
      >
        {phase === "uploading" ? (
          <span className="text-sm">⏳</span>
        ) : mode === "audio" ? (
          // Mikrofon ikonkasi
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8" strokeLinecap="round" />
          </svg>
        ) : (
          // Kamera ikonkasi
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
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
                  "h-64 w-64 overflow-hidden rounded-full border-4 shadow-2xl transition-colors",
                  cancelZone ? "border-red-500" : "border-white/80"
                )}
              >
                <video
                  ref={previewRef}
                  autoPlay
                  playsInline
                  muted
                  // Old kamerada oyna (mirror) effekti
                  className="h-full w-full -scale-x-100 object-cover"
                />
              </div>
            </div>
          )}

          {/* Taymer + jonli indikator */}
          <div className="mb-4 flex items-center gap-2 text-white">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <span className="font-mono text-lg">
              {mm}:{ss}
            </span>
          </div>

          {/* Ko'rsatma */}
          <p
            className={cn(
              "text-sm transition-colors",
              cancelZone ? "text-red-400" : "text-white/80"
            )}
          >
            {cancelZone
              ? "↩︎ Bekor qilish uchun qo'yib yuboring"
              : "Qo'yib yuboring — yuboriladi  ·  ◀ chapga suring — bekor"}
          </p>
        </div>
      )}
    </>
  );
}
