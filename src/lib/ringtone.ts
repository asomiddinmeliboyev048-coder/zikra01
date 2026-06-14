"use client";

// ============================================================
// Zikra — Qo'ng'iroq tovushlari (gudok / ringtone)
// Web Audio API orqali (audio fayl shart emas).
//  - Ringback (gudok): qo'ng'iroq qiluvchi eshitadi ("tut... tut...")
//  - Ringtone: qabul qiluvchi eshitadi (qo'shaloq jiringlash) + tebranish
// Eslatma: brauzer siyosati bo'yicha tovush foydalanuvchi harakatidan
// (masalan tugma bosish) keyin ishlaydi. Qo'ng'iroq qiluvchida bu kafolatlangan.
// ============================================================

let ctx: AudioContext | null = null;
let loopTimer: ReturnType<typeof setInterval> | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new Ctx();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/** Bitta ton chalish (start — ctx.currentTime'ga nisbatan soniyalarda) */
function tone(freq: number, start: number, dur: number, vol = 0.22) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(c.destination);
  const t0 = c.currentTime + start;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.04);
  gain.gain.setValueAtTime(vol, t0 + dur - 0.05);
  gain.gain.linearRampToValueAtTime(0, t0 + dur);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** Gudok (chiquvchi qo'ng'iroq) — 1s tovush, 3s sukunat */
export function startRingback() {
  stopRing();
  const play = () => tone(425, 0, 1.0, 0.2);
  try {
    play();
    loopTimer = setInterval(play, 4000);
  } catch {
    /* tovush qo'llab-quvvatlanmasa — jim */
  }
}

/** Ringtone (kiruvchi qo'ng'iroq) — qo'shaloq jiringlash + tebranish */
export function startRingtone() {
  stopRing();
  const play = () => {
    try {
      // "ring-ring" — ikki qisqa ton
      tone(440, 0, 0.4, 0.25);
      tone(480, 0.5, 0.4, 0.25);
    } catch {
      /* ignore */
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([400, 200, 400]);
    }
  };
  play();
  loopTimer = setInterval(play, 2000);
}

/** Barcha tovush/tebranishni to'xtatish */
export function stopRing() {
  if (loopTimer) clearInterval(loopTimer);
  loopTimer = null;
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(0);
  }
}
