"use client";

import { useEffect, useRef, useState } from "react";
import { uploadVoiceMessage, uploadRoundVideo } from "@/lib/storage";
import { cn } from "@/lib/utils";

/**
 * Telegram uslubidagi ovozli / yumaloq video xabar tugmasi.
 *
 * Boshqaruv:
 *   1) QISQA BOSISH (tap)   -> rejimni almashtiradi: Mikrofon (🎤) ↔ Kamera (🎥).
 *   2) BOSIB TURISH (hold)  -> yozishni boshlaydi (mikrofon => ovoz, kamera => yumaloq video).
 *   3) QO'YIB YUBORISH      -> yozish to'xtaydi, Supabase Storage'ga yuklanadi va yuboriladi.
 *   4) CHAPGA SURISH        -> bekor qiladi (yubormaydi).
 *   5) TEPAGA SURISH        -> "lock" (qo'lsiz) rejim: keyin Bekor / Yuborish / Kamera
 *      almashtirish tugmalari chiqadi (barmoqni ushlab turish shart emas).
 *
 * Kamera almashtirish (old/orqa): video yozilayotganda preview yonidagi
 * tugma orqali — facingMode "user" ↔ "environment" almashadi va oqim qayta
 * ishga tushadi.
 *
 * Chiqish formati (o'zgarmasligi SHART — ChatClient shunga qarab render qiladi):
 *   onSend("voice:<url>")  yoki  onSend("roundvideo:<url>")
 */

type Mode = "audio" | "video";
type Facing = "user" | "environment";
// idle: kutmoqda | starting: oqim ochilyapti | recording: yozyapti | uploading: yuklanyapti
type Phase = "idle" | "starting" | "recording" | "uploading";

// Shu vaqtdan (ms) kam ushlansa — QISQA BOSISH (tap = rejim almashtirish),
// ko'p ushlansa — YOZISH. 160ms sezilmaydi, lekin tap/hold'ni aniq ajratadi.
const HOLD_DELAY = 160;
const CANCEL_DX = -80; // px — chapga shuncha surilsa bekor zonasi
const LOCK_DY = -70; // px — tepaga shuncha surilsa lock (qo'lsiz) rejim
const MIN_BLOB_BYTES = 900; // bundan kichik yozuvni yubormaymiz

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
  const [locked, setLocked] = useState(false);
  const [facing, setFacing] = useState<Facing>("user");

  // Ref'lar — pointer/async hodisalarida "stale closure" muammosini oldini oladi
  const modeRef = useRef<Mode>("audio");
  const phaseRef = useRef<Phase>("idle");
  const facingRef = useRef<Facing>("user");
  const lockedRef = useRef(false);
  const cancelledRef = useRef(false);
  const cancelZoneRef = useRef(false);
  const releasedEarlyRef = useRef(false); // oqim tayyor bo'lishidan oldin qo'yib yuborildimi
  const flippingRef = useRef(false); // kamera almashtirilyaptimi (qayta boshlash)

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
    flippingRef.current = false;
    lockedRef.current = false;
    setCancelZone(false);
    setLocked(false);
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

  // Preview <video> ga jonli oqimni ulash (video rejim uchun)
  function attachPreview() {
    const v = previewRef.current;
    const s = streamRef.current;
    if (v && s) {
      v.srcObject = s;
      v.muted = true;
      v.play().catch(() => {});
    }
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
        ? { audio: true, video: { facingMode: facingRef.current } }
        : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Oqim ochilguncha qo'yib yuborilgan bo'lsa (va lock qilinmagan) — bekor
      if (releasedEarlyRef.current && !lockedRef.current) {
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
      if (isVideo) attachPreview();
    } catch {
      alert(
        isVideo
          ? "Kameraga ruxsat berilmadi yoki mavjud emas."
          : "Mikrofonga ruxsat berilmadi yoki mavjud emas."
      );
      resetIdle();
    }
  }

  // --- Recorder to'xtaganda: qayta boshlash (flip), yuklash yoki bekor qilish ---
  async function handleStop() {
    stopStream();

    // Kamera almashtirilyapti — yuklamaymiz, yangi kamera bilan qayta boshlaymiz
    if (flippingRef.current) {
      flippingRef.current = false;
      chunksRef.current = [];
      setPhaseBoth("starting");
      setTimeout(() => startRecording(), 120);
      return;
    }

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

  // --- Old/orqa kamerani almashtirish ---
  function flipCamera() {
    const next: Facing = facingRef.current === "user" ? "environment" : "user";
    facingRef.current = next;
    setFacing(next);
    // Yozayotgan bo'lsa — oqimni yangi kamera bilan qayta ishga tushiramiz
    if (phaseRef.current === "recording" && modeRef.current === "video") {
      flippingRef.current = true;
      cancelledRef.current = false;
      const rec = recorderRef.current;
      if (rec && rec.state !== "inactive") rec.stop(); // handleStop qayta boshlaydi
    }
  }

  // --- Pointer hodisalari (sichqoncha + sensor birga ishlaydi) ---
  function onPointerDown(e: React.PointerEvent) {
    if (disabled || phaseRef.current !== "idle") return;
    // Brauzerning "long-press" kontekst menyusi / matn belgilashini to'xtatamiz
    e.preventDefault();
    // Pointer capture: barmoq tugmadan chiqsa ham move/up shu tugmaga keladi
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* qo'llab-quvvatlanmasa e'tiborsiz */
    }
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    cancelledRef.current = false;
    releasedEarlyRef.current = false;
    cancelZoneRef.current = false;
    lockedRef.current = false;
    setCancelZone(false);
    setLocked(false);
    // HOLD_DELAY dan keyin yozish boshlanadi (undan qisqa bosish = tap/toggle)
    pressTimerRef.current = setTimeout(() => {
      pressTimerRef.current = null;
      startRecording();
    }, HOLD_DELAY);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (phaseRef.current !== "recording" || lockedRef.current) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    // Tepaga surish -> lock (qo'lsiz rejim)
    if (dy < LOCK_DY) {
      lockedRef.current = true;
      setLocked(true);
      cancelZoneRef.current = false;
      setCancelZone(false);
      return;
    }
    // Chapga surish -> bekor qilish zonasi
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
      // Oqim hali ochilyapti — qo'yib yuborildi, tayyor bo'lgach bekor qilinadi
      releasedEarlyRef.current = true;
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
  const isVideo = mode === "video";

  // Kamera almashtirish ikonka-tugmasi (qayta ishlatiladi)
  const flipButton = (
    <button
      type="button"
      onClick={flipCamera}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg transition active:scale-95"
      title="Kamerani almashtirish"
      aria-label="Kamerani almashtirish (old/orqa)"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 4h5v5M20 4l-6 6M9 20H4v-5M4 20l6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

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
          {/* Video rejim — jonli YUMALOQ oyna (aspect-square rounded-full) */}
          {isVideo && (
            <div className="relative mb-6">
              <div
                className={cn(
                  "aspect-square w-64 max-w-[80vw] overflow-hidden rounded-full border-4 shadow-2xl transition-colors",
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
                    facing === "user" && "-scale-x-100" // old kamerada oyna (mirror)
                  )}
                />
              </div>
              {/* Kamera almashtirish — preview ichida, pastki-o'ng burchakda */}
              <div className="absolute bottom-2 right-2">{flipButton}</div>
            </div>
          )}

          {/* Taymer + jonli indikator */}
          <div className="mb-4 flex items-center gap-2 text-white">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <span className="font-mono text-lg">
              {mm}:{ss}
            </span>
          </div>

          {/* Ko'rsatma (qo'lda) yoki tugmalar (lock rejimda) */}
          {!locked ? (
            <p
              className={cn(
                "px-6 text-center text-sm transition-colors",
                cancelZone ? "text-red-400" : "text-white/80"
              )}
            >
              {cancelZone
                ? "↩︎ Bekor qilish uchun qo'yib yuboring"
                : "Qo'yib yuboring — yuboriladi  ·  ◀ chapga suring — bekor  ·  ▲ yuqoriga — qo'lsiz"}
            </p>
          ) : (
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={cancelRecording}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-xl text-white transition active:scale-95"
                title="Bekor qilish"
                aria-label="Bekor qilish"
              >
                🗑
              </button>
              <button
                type="button"
                onClick={stopAndSend}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl text-white shadow-lg transition active:scale-95"
                title="Yuborish"
                aria-label="Yuborish"
              >
                ➤
              </button>
              {isVideo ? (
                flipButton
              ) : (
                <span className="h-12 w-12" aria-hidden />
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
