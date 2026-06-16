"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { avatarFallback, cn, conversationId } from "@/lib/utils";
import { startRingback, startRingtone, stopRing } from "@/lib/ringtone";
import { notifyIncomingCallAction } from "@/app/actions/push";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * CallProvider — native WebRTC video/ovozli qo'ng'iroqlar.
 *
 * Arxitektura:
 *  - Signaling (SDP offer/answer + ICE) Supabase Realtime "broadcast" kanali
 *    orqali almashinadi (qo'shimcha server/SDK shart emas).
 *  - Kiruvchi qo'ng'iroq `calls` jadvaliga INSERT orqali bildiriladi
 *    (qabul qiluvchi postgres_changes'ni tinglaydi).
 *  - Media P2P (peer-to-peer) uzatiladi. NAT ortidagi tarmoqlar uchun
 *    ishlab chiqarishda TURN server qo'shilishi tavsiya etiladi.
 *
 * FixedWidgets ichida (avtorizatsiyalangan foydalanuvchi uchun) o'rnatiladi.
 */

type Status = "idle" | "calling" | "incoming" | "active";
type CallType = "video" | "audio";

interface Peer {
  id: string;
  name: string;
  avatar: string | null;
}

// TURN sozlamalari (env orqali). Eng ishonchli usul — Metered API orqali
// ICE serverlarni dinamik olish (to'g'ri host + yangi credential).
const METERED_APP = process.env.NEXT_PUBLIC_METERED_APP; // masalan "zikra"
const METERED_API_KEY = process.env.NEXT_PUBLIC_METERED_API_KEY;

// Zaxira: statik username/credential (API ishlamasa)
const TURN_USERNAME = process.env.NEXT_PUBLIC_TURN_USERNAME;
const TURN_CREDENTIAL = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;
const TURN_HOST =
  process.env.NEXT_PUBLIC_TURN_HOST || "standard.relay.metered.ca";
const TURN_URL = process.env.NEXT_PUBLIC_TURN_URL;

function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];
  if (TURN_USERNAME && TURN_CREDENTIAL) {
    servers.push({ urls: "stun:" + TURN_HOST + ":80" });
    servers.push({ urls: "turn:" + TURN_HOST + ":80", username: TURN_USERNAME, credential: TURN_CREDENTIAL });
    servers.push({ urls: "turn:" + TURN_HOST + ":80?transport=tcp", username: TURN_USERNAME, credential: TURN_CREDENTIAL });
    servers.push({ urls: "turn:" + TURN_HOST + ":443", username: TURN_USERNAME, credential: TURN_CREDENTIAL });
    servers.push({ urls: "turns:" + TURN_HOST + ":443?transport=tcp", username: TURN_USERNAME, credential: TURN_CREDENTIAL });
    if (TURN_URL) {
      servers.push({ urls: TURN_URL, username: TURN_USERNAME, credential: TURN_CREDENTIAL });
    }
  } else {
    servers.push(
      { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
      { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" }
    );
  }
  return servers;
}

/**
 * ICE serverlarni olish — avval Metered API'dan (eng ishonchli), bo'lmasa statik.
 * Har qo'ng'iroqdan oldin chaqiriladi (credential yangiligi uchun).
 */
async function getIceServers(): Promise<RTCIceServer[]> {
  if (METERED_APP && METERED_API_KEY) {
    try {
      const res = await fetch(
        "https://" +
          METERED_APP +
          ".metered.live/api/v1/turn/credentials?apiKey=" +
          METERED_API_KEY
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Google STUN'ni ham qo'shamiz (tezroq to'g'ridan-to'g'ri ulanish uchun)
        return [{ urls: "stun:stun.l.google.com:19302" }, ...data];
      }
    } catch {
      /* API ishlamasa — statik zaxiraga o'tamiz */
    }
  }
  return buildIceServers();
}

const RING_TIMEOUT_MS = 35000;

export default function CallProvider({ userId }: { userId: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [peer, setPeer] = useState<Peer | null>(null);
  const [callType, setCallType] = useState<CallType>("video");
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [remoteJoined, setRemoteJoined] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const sigRef = useRef<RealtimeChannel | null>(null);
  const channelNameRef = useRef<string>("");
  const callIdRef = useRef<string | null>(null);
  const isCallerRef = useRef(false);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const ringTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef<Status>("idle"); // joriy holat (stale closure'lardan qochish)

  // ---------- Tozalash ----------
  const cleanup = useCallback(() => {
    stopRing(); // gudok/ringtone to'xtatiladi
    clearCallNotifications(); // qo'ng'iroq bildirishnomalarini yopish
    if (ringTimer.current) clearTimeout(ringTimer.current);
    ringTimer.current = null;
    pcRef.current?.getSenders().forEach((s) => s.track?.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    pendingIce.current = [];
    if (sigRef.current) {
      const supabase = createClient();
      supabase.removeChannel(sigRef.current);
      sigRef.current = null;
    }
    callIdRef.current = null;
    isCallerRef.current = false;
    setRemoteJoined(false);
    setMuted(false);
    setCamOff(false);
    setStatus("idle");
    setPeer(null);
  }, []);

  const sendSignal = useCallback((payload: Record<string, unknown>) => {
    sigRef.current?.send({ type: "broadcast", event: "signal", payload });
  }, []);

  // Qo'ng'iroq bildirishnomalarini yopish (qo'ng'iroq tugagach ekranni bezovta qilmasligi uchun)
  function clearCallNotifications() {
    if (typeof navigator !== "undefined" && navigator.serviceWorker) {
      navigator.serviceWorker.ready
        .then((reg) =>
          reg.getNotifications({ tag: "zikra-call" }).then((list) =>
            list.forEach((n) => n.close())
          )
        )
        .catch(() => {});
    }
  }

  // ---------- PeerConnection yaratish ----------
  const createPc = useCallback(
    (stream: MediaStream, iceServers: RTCIceServer[]) => {
      const pc = new RTCPeerConnection({
        iceServers,
        iceCandidatePoolSize: 10,
      });
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate) sendSignal({ kind: "ice", candidate: e.candidate.toJSON() });
      };
      pc.ontrack = (e) => {
        const [remoteStream] = e.streams;
        if (remoteStream) {
          remoteStreamRef.current = remoteStream;
          // Element mavjud bo'lsa darhol biriktiramiz (audio ham shu orqali eshitiladi)
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(() => {});
          }
        }
        setRemoteJoined(true);
      };
      pc.onconnectionstatechange = () => {
        // FAQAT "failed" da tugatamiz. "disconnected" ko'pincha vaqtinchalik
        // (tarmoq sakrashida o'zi tiklanadi) — shuning uchun unda tugatmaymiz.
        if (pc.connectionState === "failed" && statusRef.current === "active") {
          endCall(true);
        }
      };
      pcRef.current = pc;
      return pc;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sendSignal]
  );

  async function getMedia(type: CallType): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video" ? { width: 1280, height: 720 } : false,
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }

  async function flushIce() {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    for (const c of pendingIce.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch {
        /* ignore */
      }
    }
    pendingIce.current = [];
  }

  // ---------- Signal qabul qilish ----------
  const handleSignal = useCallback(
    async (payload: Record<string, unknown>) => {
      const pc = pcRef.current;
      const kind = payload.kind as string;

      if (kind === "ready" && isCallerRef.current && pc) {
        // Callee tayyor → offer yuboramiz
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal({ kind: "offer", sdp: offer });
      } else if (kind === "offer" && !isCallerRef.current && pc) {
        await pc.setRemoteDescription(
          new RTCSessionDescription(payload.sdp as RTCSessionDescriptionInit)
        );
        await flushIce();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal({ kind: "answer", sdp: answer });
        if (ringTimer.current) {
          clearTimeout(ringTimer.current);
          ringTimer.current = null;
        }
        setStatus("active");
      } else if (kind === "answer" && isCallerRef.current && pc) {
        await pc.setRemoteDescription(
          new RTCSessionDescription(payload.sdp as RTCSessionDescriptionInit)
        );
        await flushIce();
        if (ringTimer.current) {
          clearTimeout(ringTimer.current);
          ringTimer.current = null;
        }
        setStatus("active");
      } else if (kind === "ice" && pc) {
        const cand = payload.candidate as RTCIceCandidateInit;
        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch {
            /* ignore */
          }
        } else {
          pendingIce.current.push(cand);
        }
      } else if (kind === "end") {
        cleanup();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sendSignal, cleanup]
  );

  function joinSignalChannel(channel: string): RealtimeChannel {
    const supabase = createClient();
    const ch = supabase.channel(`call:${channel}`, {
      config: { broadcast: { self: false } },
    });
    ch.on("broadcast", { event: "signal" }, ({ payload }) =>
      handleSignal(payload as Record<string, unknown>)
    );
    ch.subscribe();
    sigRef.current = ch;
    channelNameRef.current = channel;
    return ch;
  }

  // ---------- Chiquvchi qo'ng'iroq ----------
  const startCall = useCallback(
    async (callee: Peer, type: CallType) => {
      if (status !== "idle") return;
      isCallerRef.current = true;
      setPeer(callee);
      setCallType(type);
      setStatus("calling");

      const channel = conversationId(userId, callee.id);
      try {
        const stream = await getMedia(type);
        const ice = await getIceServers(); // Metered API'dan (yoki statik)
        createPc(stream, ice);
        joinSignalChannel(channel);

        const supabase = createClient();
        const { data } = await supabase
          .from("calls")
          .insert({
            channel,
            caller_id: userId,
            callee_id: callee.id,
            call_type: type,
            status: "ringing",
          })
          .select("id")
          .single();
        callIdRef.current = (data as { id: string } | null)?.id ?? null;

        // Callee'ga push bildirishnoma (ilova yopiq bo'lsa ham keladi — FCM sozlangach)
        notifyIncomingCallAction(callee.id, type).catch(() => {});

        // Javob bo'lmasa — "missed"
        ringTimer.current = setTimeout(async () => {
          if (callIdRef.current) {
            await supabase
              .from("calls")
              .update({ status: "missed", updated_at: new Date().toISOString() })
              .eq("id", callIdRef.current);
          }
          sendSignal({ kind: "end" });
          cleanup();
        }, RING_TIMEOUT_MS);
      } catch {
        alert("Kamera/mikrofonga ruxsat berilmadi.");
        cleanup();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, userId, createPc, sendSignal, cleanup]
  );

  // ---------- Kiruvchi qo'ng'iroqni qabul qilish ----------
  async function acceptCall() {
    if (!peer) return;
    if (ringTimer.current) clearTimeout(ringTimer.current);
    try {
      const stream = await getMedia(callType);
      const ice = await getIceServers(); // Metered API'dan (yoki statik)
      createPc(stream, ice);
      // sigRef allaqachon 'incoming' bosqichida ulangan
      const supabase = createClient();
      if (callIdRef.current) {
        await supabase
          .from("calls")
          .update({ status: "accepted", updated_at: new Date().toISOString() })
          .eq("id", callIdRef.current);
      }
      setStatus("active");
      clearCallNotifications();
      sendSignal({ kind: "ready" }); // caller offer yuboradi
    } catch {
      alert("Kamera/mikrofonga ruxsat berilmadi.");
      rejectCall();
    }
  }

  function rejectCall() {
    const supabase = createClient();
    if (callIdRef.current) {
      supabase
        .from("calls")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", callIdRef.current);
    }
    sendSignal({ kind: "end" });
    cleanup();
  }

  function endCall(silent = false) {
    const supabase = createClient();
    if (callIdRef.current) {
      supabase
        .from("calls")
        .update({ status: "ended", updated_at: new Date().toISOString() })
        .eq("id", callIdRef.current);
    }
    if (!silent) sendSignal({ kind: "end" });
    cleanup();
  }

  function toggleMute() {
    const audio = localStreamRef.current?.getAudioTracks()[0];
    if (audio) {
      audio.enabled = !audio.enabled;
      setMuted(!audio.enabled);
    }
  }

  function toggleCam() {
    const video = localStreamRef.current?.getVideoTracks()[0];
    if (video) {
      video.enabled = !video.enabled;
      setCamOff(!video.enabled);
    }
  }

  // ---------- Chiquvchi qo'ng'iroq hodisasini tinglash ----------
  useEffect(() => {
    function onStart(e: Event) {
      const d = (e as CustomEvent).detail as {
        calleeId: string;
        calleeName: string;
        calleeAvatar: string | null;
        callType: CallType;
      };
      startCall(
        { id: d.calleeId, name: d.calleeName, avatar: d.calleeAvatar },
        d.callType || "video"
      );
    }
    window.addEventListener("zikra:start-call", onStart);
    return () => window.removeEventListener("zikra:start-call", onStart);
  }, [startCall]);

  // Joriy holatni ref'da sinxronlaymiz (stale closure'lardan qochish uchun)
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Kiruvchi qo'ng'iroqni ko'rsatish — realtime VA ilova ochilganda (push) uchun
  const presentIncomingCall = useCallback(
    async (row: {
      id: string;
      channel: string;
      caller_id: string;
      call_type: CallType;
      status: string;
    }) => {
      if (row.status !== "ringing") return;
      if (statusRef.current !== "idle") return; // band yoki allaqachon ko'rsatilgan

      const supabase = createClient();
      const { data: caller } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", row.caller_id)
        .single();
      const c = caller as
        | { id: string; full_name: string; avatar_url: string | null }
        | null;

      isCallerRef.current = false;
      callIdRef.current = row.id;
      setCallType(row.call_type);
      setPeer({
        id: row.caller_id,
        name: c?.full_name ?? "Foydalanuvchi",
        avatar: c?.avatar_url ?? null,
      });
      setStatus("incoming");
      joinSignalChannel(row.channel); // signal kanaliga ulanamiz

      // Brauzer bildirishnomasi — sahifa fon'da bo'lsa ham ogohlantiradi
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        try {
          const n = new Notification(
            `${c?.full_name ?? "Foydalanuvchi"} qo'ng'iroq qilmoqda`,
            {
              body:
                row.call_type === "video"
                  ? "📹 Video qo'ng'iroq"
                  : "📞 Ovozli qo'ng'iroq",
              icon: "/icon.svg",
              tag: "zikra-call",
            }
          );
          n.onclick = () => {
            window.focus();
            n.close();
          };
        } catch {
          /* ignore */
        }
      }

      // 35s javob bermasa modalni yopamiz
      ringTimer.current = setTimeout(() => cleanup(), RING_TIMEOUT_MS);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cleanup]
  );

  // ---------- Realtime: yangi kiruvchi qo'ng'iroq ----------
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`calls-listen:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "calls",
          filter: `callee_id=eq.${userId}`,
        },
        (payload) => {
          presentIncomingCall(
            payload.new as {
              id: string;
              channel: string;
              caller_id: string;
              call_type: CallType;
              status: string;
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, presentIncomingCall]);

  // ---------- Ilova ochilganda (push'ni bosib) faol qo'ng'iroqni tekshirish ----------
  // Ilova yopiq bo'lsa, realtime INSERT o'tkazib yuboriladi. Shuning uchun
  // ochilganda darhol "ringing" holatdagi qo'ng'iroq bor-yo'qligini so'raymiz.
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("calls")
        .select("id, channel, caller_id, call_type, status, created_at")
        .eq("callee_id", userId)
        .eq("status", "ringing")
        .order("created_at", { ascending: false })
        .limit(1);
      const row = data && data[0];
      if (row) {
        const ageMs =
          Date.now() - new Date(row.created_at as string).getTime();
        if (ageMs < RING_TIMEOUT_MS) {
          presentIncomingCall(
            row as {
              id: string;
              channel: string;
              caller_id: string;
              call_type: CallType;
              status: string;
            }
          );
        }
      }
    })();
  }, [userId, presentIncomingCall]);

  // Komponent yo'qolganda tozalash
  useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remote oqimni media elementga biriktirish (audio ham shu orqali eshitiladi)
  useEffect(() => {
    if (remoteVideoRef.current && remoteStreamRef.current) {
      if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [status, remoteJoined, callType]);

  // Gudok / ringtone boshqaruvi
  useEffect(() => {
    if (status === "calling" && !remoteJoined) {
      startRingback(); // qo'ng'iroq qiluvchi gudokni eshitadi
    } else if (status === "incoming") {
      startRingtone(); // qabul qiluvchi jiringlash + tebranish
    } else {
      stopRing(); // ulanganda yoki tugaganda to'xtaydi
    }
  }, [status, remoteJoined]);

  if (status === "idle") return null;

  // ---------- Kiruvchi qo'ng'iroq modali ----------
  if (status === "incoming") {
    return (
      <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-gradient-to-b from-brand-700 to-gray-900 text-white animate-fade-in">
        <p className="text-sm opacity-80">
          {callType === "video" ? "Video qo'ng'iroq" : "Ovozli qo'ng'iroq"}
        </p>
        <Image
          src={peer?.avatar || avatarFallback(peer?.name || "Z")}
          alt={peer?.name || ""}
          width={110}
          height={110}
          className="mt-6 h-28 w-28 animate-pulse rounded-full border-4 border-white/30 object-cover"
          unoptimized
        />
        <h2 className="mt-5 text-2xl font-bold">{peer?.name}</h2>
        <p className="mt-1 text-sm opacity-70">sizga qo&apos;ng&apos;iroq qilmoqda...</p>
        <div className="mt-12 flex items-center gap-10">
          <button
            onClick={rejectCall}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl shadow-lg transition hover:scale-105"
            aria-label="Rad etish"
          >
            ✕
          </button>
          <button
            onClick={acceptCall}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-2xl shadow-lg transition hover:scale-105"
            aria-label="Qabul qilish"
          >
            ✓
          </button>
        </div>
      </div>
    );
  }

  // ---------- Faol / chiquvchi qo'ng'iroq ekrani ----------
  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-gray-900 text-white animate-fade-in">
      {/* Remote video / avatar */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {/* Remote media — HAR DOIM mavjud (ovozli qo'ng'iroqda yashirin, lekin
            tovush shu element orqali eshitiladi). */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={cn(
            "h-full w-full object-cover",
            callType === "video" && remoteJoined ? "block" : "hidden"
          )}
        />

        {(!remoteJoined || callType === "audio") && (
          <div className="flex flex-col items-center">
            <Image
              src={peer?.avatar || avatarFallback(peer?.name || "Z")}
              alt={peer?.name || ""}
              width={120}
              height={120}
              className="h-28 w-28 rounded-full border-4 border-white/20 object-cover"
              unoptimized
            />
            <h2 className="mt-4 text-xl font-bold">{peer?.name}</h2>
            <p className="mt-1 text-sm opacity-70">
              {status === "calling"
                ? "Qo'ng'iroq qilinmoqda..."
                : remoteJoined
                ? "Suhbat davom etmoqda"
                : "Ulanmoqda..."}
            </p>
          </div>
        )}

        {/* Local video (kichik oyna) */}
        {callType === "video" && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-4 right-4 h-40 w-28 rounded-xl border border-white/20 object-cover shadow-lg sm:h-48 sm:w-36"
          />
        )}
      </div>

      {/* Boshqaruv tugmalari */}
      <div className="flex items-center justify-center gap-5 bg-black/40 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <button
          onClick={toggleMute}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full text-xl transition",
            muted ? "bg-white text-gray-900" : "bg-white/15 hover:bg-white/25"
          )}
          title={muted ? "Ovozni yoqish" : "Ovozni o'chirish"}
        >
          {muted ? "🔇" : "🎙"}
        </button>

        {callType === "video" && (
          <button
            onClick={toggleCam}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full text-xl transition",
              camOff ? "bg-white text-gray-900" : "bg-white/15 hover:bg-white/25"
            )}
            title={camOff ? "Kamerani yoqish" : "Kamerani o'chirish"}
          >
            {camOff ? "📷" : "🎥"}
          </button>
        )}

        <button
          onClick={() => endCall()}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl shadow-lg transition hover:scale-105"
          title="Tugatish"
        >
          📞
        </button>
      </div>
    </div>
  );
}
