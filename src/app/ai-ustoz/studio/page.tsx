"use client";

import Script from "next/script";
import { createElement, useCallback, useEffect, useRef, useState, type ComponentType, type CSSProperties } from "react";
import { Maximize2, Moon, Sparkles, Sun } from "lucide-react";
import LiveVoicePanel from "../LiveVoicePanel";
import "./studio.css";

type Track = "english" | "russian" | "coding" | "cyber";
type Mood = "idle" | "speaking" | "thinking" | "amused" | "surprised" | "playful-angry";
type ViewerElement = HTMLElement & {
  availableAnimations?: string[];
  animationName?: string;
  play?: () => void;
  pause?: () => void;
  currentTime?: number;
};

const trackNames: Record<Track, string> = {
  english: "Ingliz tili",
  russian: "Rus tili",
  coding: "Dasturlash",
  cyber: "Kiberxavfsizlik",
};
const avatar = { name: "Ziyra", role: "Shaxsiy AI ustoz", src: "/models/school_girl_v21.glb" };
const ModelViewer = "model-viewer" as unknown as ComponentType<Record<string, unknown>>;

export default function AiTutorStudioPage() {
  const [track, setTrack] = useState<Track>("english");
  const [level, setLevel] = useState("Boshlang‘ich");
  const [skillLabel, setSkillLabel] = useState("Ingliz tili");
  const [darkStage, setDarkStage] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [mood, setMood] = useState<Mood>("idle");
  const [loaded, setLoaded] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [animations, setAnimations] = useState<string[]>([]);
  const [modelError, setModelError] = useState("");
  const [profileError, setProfileError] = useState("");
  const viewerRef = useRef<ViewerElement | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/ai-tutor/context", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "O‘quv rejasini yuklab bo‘lmadi.");
        const plan = payload.learningPlan;
        const profile = payload.profile;
        const selected = (payload.selectedTrack || plan?.track_id || profile?.selected_track || "english") as Track;
        if (!active) return;
        if (selected in trackNames) setTrack(selected);
        setSkillLabel(plan?.skill_name || trackNames[selected] || "Tanlangan ko‘nikma");
        setLevel(plan?.current_level || profile?.level || "Boshlang‘ich");
      })
      .catch((error) => {
        if (active) setProfileError(error instanceof Error ? error.message : "O‘quv rejasiga ulanib bo‘lmadi.");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!scriptReady) return;
    const viewer = viewerRef.current;
    if (!viewer) return;
    const onLoad = () => {
      const names = viewer.availableAnimations || [];
      setAnimations(names);
      setLoaded(true);
      setModelError("");
      const idle = names.find((name) => /idle|stand|breath/i.test(name)) || names[0];
      if (idle) {
        viewer.animationName = idle;
        viewer.play?.();
      }
    };
    const onError = () => {
      setLoaded(false);
      setModelError("Ziyra 3D modeli yuklanmadi. GLB fayl manzilini tekshiring.");
    };
    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("error", onError);
    return () => {
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("error", onError);
    };
  }, [scriptReady]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !loaded) return;
    const idle = animations.find((name) => /idle|stand|breath/i.test(name)) || animations[0];
    const talk = animations.find((name) => /talk|speak|speech|conversation|gesture/i.test(name));
    const gesture = animations.find((name) => /think|look|explain|gesture/i.test(name));
    const selected = mood === "speaking" ? (talk || idle)
      : mood === "thinking" || mood === "surprised" || mood === "amused" || mood === "playful-angry" ? (gesture || talk || idle)
      : idle;
    if (selected && viewer.animationName !== selected) {
      viewer.animationName = selected;
      viewer.currentTime = 0;
      viewer.play?.();
    }
  }, [mood, loaded, animations]);

  const handleSpeaking = useCallback((value: boolean) => {
    setSpeaking(value);
  }, []);
  const handleListening = useCallback((value: boolean) => {
    setListening(value);
  }, []);

  function toggleFullscreen() {
    const stage = document.querySelector(".zikra-studio-stage");
    if (!stage) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stage.requestFullscreen?.();
  }

  return (
    <main className="zikra-studio zikra-studio-immersive">
      <Script
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        type="module"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setModelError("3D ko‘rish moduli yuklanmadi. Internet aloqasini tekshiring.")}
      />
      <header className="studio-topbar studio-topbar-immersive">
        <div className="studio-brand"><span><Sparkles size={18}/></span><div><b>Zikra AI Ustoz</b><small>ZIYRA · JONLI MURABBIY</small></div></div>
        <div className="studio-top-actions">
          <button type="button" onClick={() => setDarkStage((value) => !value)} aria-label="Sahna rangini almashtirish">{darkStage ? <Sun size={17}/> : <Moon size={17}/>}</button>
          <button type="button" onClick={toggleFullscreen} aria-label="To‘liq ekran"><Maximize2 size={17}/></button>
        </div>
      </header>

      <section className="studio-layout studio-layout-single">
        <div className={`zikra-studio-stage studio-ziyra-stage ${darkStage ? "stage-dark" : "stage-light"} ${speaking ? "avatar-speaking" : ""} mood-${mood}`} style={{ "--voice-level": voiceLevel } as CSSProperties}>
          <div className="stage-label"><span className="stage-live-dot"/><span>ZIYRA AI</span><b>{speaking ? "GAPIRYAPTI" : listening ? "TINGLAYAPTI" : loaded ? "TAYYOR" : "YUKLANMOQDA"}</b></div>
          <div className="stage-aura stage-aura-one"/>
          <div className="stage-aura stage-aura-two"/>
          <div className="stage-floor"/>
          {scriptReady ? createElement(ModelViewer, {
            ref: (node: ViewerElement | null) => { viewerRef.current = node; },
            src: avatar.src,
            alt: "Ziyra ayol 3D AI ustoz",
            "camera-orbit": "0deg 78deg 2.7m",
            "field-of-view": "28deg",
            "min-camera-orbit": "auto auto 2.7m",
            "max-camera-orbit": "auto auto 2.7m",
            "disable-zoom": true,
            "disable-pan": true,
            "interaction-prompt": "none",
            "shadow-intensity": "1",
            exposure: "1",
            "environment-image": "neutral",
            "tone-mapping": "commerce",
            "animation-crossfade-duration": "250",
            autoplay: true,
            ar: false,
            style: { width: "100%", height: "100%", background: "transparent", pointerEvents: "none" },
          }) : <div className="stage-loading"><span className="studio-spinner"/><p>Ziyra tayyorlanmoqda…</p></div>}
          {!loaded && !modelError && <div className="stage-loading stage-loading-overlay"><span className="studio-spinner"/><p>3D avatar yuklanmoqda…</p></div>}
          {modelError && <div className="stage-error"><b>3D model xatosi</b><p>{modelError}</p><small>{avatar.src}</small></div>}
          <div className="stage-caption"><span className="caption-icon"><Sparkles size={15}/></span><div><b>Ziyra</b><small>{skillLabel} · {speaking ? "Sizga javob beryapti" : listening ? "Sizni tinglayapti" : "Shaxsiy AI ustozingiz"}</small></div></div>
          <div className="studio-live-dock studio-live-dock-compact">
            <LiveVoicePanel
              track={track}
              level={level}
              avatarId="student"
              onAvatarSpeakingChange={handleSpeaking}
              onListeningChange={handleListening}
              onVoiceLevelChange={setVoiceLevel}
              onMoodChange={setMood}
            />
          </div>
          {profileError && <p role="status" className="studio-profile-error">{profileError}</p>}
          <div className="studio-skill-indicator"><span>O‘quv yo‘li</span><b>{skillLabel}</b><small>{level} daraja</small></div>
        </div>
      </section>
    </main>
  );
}
