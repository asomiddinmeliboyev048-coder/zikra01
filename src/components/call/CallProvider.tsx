"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { avatarFallback, cn, conversationId } from "@/lib/utils";
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

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // Ishlab chiqarishda TURN qo'shing:
    // { urls: "turn:YOUR_TURN_HOST", username: "...", credential: "..." },
  ],
};

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

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const sigRef = useRef<RealtimeChannel | null>(null);
  const channelNameRef = useRef<string>("");
  const callIdRef = useRef<string | null>(null);
  const isCallerRef = useRef(false);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const ringTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------- Tozalash ----------
  const cleanup = useCallback(() => {
    if (ringTimer.current) clearTimeout(ringTimer.current);
    ringTimer.current = null;
    pcRef.current?.getSenders().forEach((s) => s.track?.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
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

  // ---------- PeerConnection yaratish ----------
  const createPc = useCallback(
    (stream: MediaStream) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate) sendSignal({ kind: "ice", candidate: e.candidate.toJSON() });
      };
      pc.ontrack = (e) => {
        const [remoteStream] = e.streams;
        if (remoteVideoRef.current && remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setRemoteJoined(true);
      };
      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          // qarama-qarshi tomon uzilsa
          if (status === "active") endCall(true);
        }
      };
      pcRef.current = pc;
      return pc;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sendSignal, status]
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
        setStatus("active");
      } else if (kind === "answer" && isCallerRef.current && pc) {
        await pc.setRemoteDescription(
          new RTCSessionDescription(payload.sdp as RTCSessionDescriptionInit)
        );
        await flushIce();
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
        createPc(stream);
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
      createPc(stream);
      // sigRef allaqachon 'incoming' bosqichida ulangan
      const supabase = createClient();
      if (callIdRef.current) {
        await supabase
          .from("calls")
          .update({ status: "accepted", updated_at: new Date().toISOString() })
          .eq("id", callIdRef.current);
      }
      setStatus("active");
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

  // ---------- Kiruvchi qo'ng'iroqlarni tinglash ----------
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
        async (payload) => {
          const row = payload.new as {
            id: string;
            channel: string;
            caller_id: string;
            call_type: CallType;
            status: string;
          };
          if (row.status !== "ringing") return;
          if (status !== "idle") return; // band

          // Qo'ng'iroq qiluvchi profilini olamiz
          const { data: caller } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .eq("id", row.caller_id)
            .single();
          const c = caller as { id: string; full_name: string; avatar_url: string | null } | null;

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

          // 35s javob bermasa modalni yopamiz
          ringTimer.current = setTimeout(() => cleanup(), RING_TIMEOUT_MS);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, status]);

  // Komponent yo'qolganda tozalash
  useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {callType === "video" ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={cn(
              "h-full w-full object-cover",
              remoteJoined ? "block" : "hidden"
            )}
          />
        ) : null}

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
