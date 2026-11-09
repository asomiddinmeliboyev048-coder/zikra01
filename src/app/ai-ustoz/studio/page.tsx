"use client";

import Script from "next/script";
import { createElement, useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Check, Maximize2, Moon, RotateCcw, Sparkles, Sun, Volume2 } from "lucide-react";
import LiveVoicePanel from "../LiveVoicePanel";
import "./studio.css";

type Track = "english" | "russian" | "coding" | "cyber";
type AvatarId = "teacher" | "student";
type ViewerElement = HTMLElement & {
  availableAnimations?: string[];
  animationName?: string;
  play?: () => void;
  pause?: () => void;
  currentTime?: number;
};
type TutorProfile = {
  selected_track: Track;
  level: string;
  avatar_id: AvatarId;
  memory_summary?: string;
  conversation_history?: { role: "user" | "assistant"; content: string }[];
};
const avatars: { id: AvatarId; name: string; role: string; src: string }[] = [
  { id: "teacher", name: "Ziyo", role: "Erkak ustoz", src: "/models/teacher_joe.glb" },
  { id: "student", name: "Ziyra", role: "Ayol ustoz", src: "/models/school_girl_v21.glb" },
];
const tracks: { id: Track; label: string }[] = [
  { id: "english", label: "Ingliz tili" },
  { id: "russian", label: "Rus tili" },
  { id: "coding", label: "Dasturlash" },
  { id: "cyber", label: "Kiberxavfsizlik" },
];
const ModelViewer = "model-viewer" as unknown as ComponentType<Record<string, unknown>>;

export default function AiTutorStudioPage() {
  const [avatarId, setAvatarId] = useState<AvatarId>("teacher");
  const [track, setTrack] = useState<Track>("english");
  const [level, setLevel] = useState("Boshlang‘ich");
  const [darkStage, setDarkStage] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [error, setError] = useState("");
  const [animations, setAnimations] = useState<string[]>([]);
  const viewerRef = useRef<ViewerElement | null>(null);
  const avatar = useMemo(() => avatars.find((item) => item.id === avatarId) || avatars[0], [avatarId]);

  useEffect(() => {
    let active = true;
    fetch("/api/ai-tutor/profile", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Profilni yuklab bo‘lmadi.");
        return payload.profile as TutorProfile;
      })
      .then((profile) => {
        if (!active || !profile) return;
        if (profile.selected_track) setTrack(profile.selected_track);
        if (profile.level) setLevel(profile.level);
        if (profile.avatar_id === "teacher" || profile.avatar_id === "student") setAvatarId(profile.avatar_id);
      })
      .catch((cause) => {
        if (active) setProfileError(cause instanceof Error ? cause.message : "Profil xotirasi yuklanmadi.");
      })
      .finally(() => { if (active) setProfileReady(true); });
    return () => { active = false; };
  }, []);

  const saveProfile = useCallback(async (patch: { selectedTrack?: Track; level?: string; avatarId?: AvatarId }) => {
    try {
      const response = await fetch("/api/ai-tutor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setProfileError(payload.error || "Sozlama saqlanmadi.");
      } else setProfileError("");
    } catch {
      setProfileError("Xotira serveriga ulanib bo‘lmadi.");
    }
  }, []);

  useEffect(() => {
    if (!scriptReady) return;
    const viewer = viewerRef.current;
    if (!viewer) return;
    const onLoad = () => {
      const names = viewer.availableAnimations || [];
      setAnimations(names);
      setLoaded(true);
      setError("");
      const idle = names.find((name) => /idle|stand|breath/i.test(name)) || names[0];
      if (idle) { viewer.animationName = idle; viewer.play?.(); }
    };
    const onError = () => {
      setLoaded(false);
      setError("3D model yuklanmadi. public/models ichidagi GLB faylini tekshiring.");
    };
    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("error", onError);
    return () => {
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("error", onError);
    };
  }, [scriptReady, avatarId]);

  useEffect(() => {
    if (!loaded || !viewerRef.current || animations.length === 0) return;
    const idle = animations.find((name) => /idle|stand|breath/i.test(name)) || animations[0];
    const talk = animations.find((name) => /talk|speak|speech|conversation|gesture|mouth/i.test(name));
    const next = avatarSpeaking && talk ? talk : idle;
    if (viewerRef.current.animationName !== next) {
      viewerRef.current.animationName = next;
      viewerRef.current.currentTime = 0;
      viewerRef.current.play?.();
    }
  }, [avatarSpeaking, loaded, animations]);

  function chooseAvatar(next: AvatarId) {
    if (next === avatarId) return;
    setLoaded(false);
    setAnimations([]);
    setError("");
    setAvatarId(next);
    if (profileReady) void saveProfile({ avatarId: next });
  }

  function chooseTrack(next: Track) {
    setTrack(next);
    if (profileReady) void saveProfile({ selectedTrack: next });
  }

  function toggleFullscreen() {
    const stage = document.querySelector(".zikra-studio-stage");
    if (!stage) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stage.requestFullscreen?.();
  }

  function replay() {
    if (!viewerRef.current) return;
    viewerRef.current.currentTime = 0;
    viewerRef.current.play?.();
  }

  return (
    <main className="zikra-studio">
      <Script
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        type="module"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setError("3D ko‘rish moduli yuklanmadi. Internet aloqasini tekshiring.")}
      />
      <header className="studio-topbar">
        <div className="studio-brand"><span><Sparkles size={18}/></span><div><b>Zikra AI Ustoz</b><small>SHAXSIY 3D MURABBIY</small></div></div>
        <div className="studio-top-actions">
          <button type="button" onClick={() => setDarkStage((value) => !value)} aria-label="Sahna rangini almashtirish">{darkStage ? <Sun size={17}/> : <Moon size={17}/>}</button>
          <button type="button" onClick={toggleFullscreen} aria-label="To‘liq ekran"><Maximize2 size={17}/></button>
        </div>
      </header>

      <section className="studio-layout studio-layout-single">
        <div className={`zikra-studio-stage ${darkStage ? "stage-dark" : "stage-light"} ${avatarSpeaking ? "avatar-speaking" : ""}`}>
          <div className="stage-label"><span className="stage-live-dot"/><span>AI USTOZ</span><b>{loaded ? "ONLAYN" : "TAYYORLANMOQDA"}</b></div>
          <div className="stage-aura stage-aura-one"/>
          <div className="stage-aura stage-aura-two"/>
          <div className="stage-floor"/>
          {scriptReady ? createElement(ModelViewer, {
            ref: (node: ViewerElement | null) => { viewerRef.current = node; },
            src: avatar.src,
            alt: avatar.name + " 3D avatar",
            "camera-orbit": "0deg 78deg 2.7m",
            "field-of-view": "28deg",
            "min-camera-orbit": "auto auto 2.7m",
            "max-camera-orbit": "auto auto 2.7m",
            "disable-zoom": false,
            "disable-pan": true,
            "camera-controls": true,
            "interaction-prompt": "none",
            "shadow-intensity": "1",
            "exposure": "1",
            "environment-image": "neutral",
            "tone-mapping": "commerce",
            "animation-crossfade-duration": "280",
            autoplay: true,
            ar: false,
            style: { width: "100%", height: "100%", background: "transparent" },
          }) : <div className="stage-loading"><span className="studio-spinner"/><p>3D ustoz tayyorlanmoqda…</p></div>}
          {!loaded && !error && <div className="stage-loading stage-loading-overlay"><span className="studio-spinner"/><p>Avatar yuklanmoqda…</p></div>}
          {error && <div className="stage-error"><b>Modelni ko‘rsatib bo‘lmadi</b><p>{error}</p><small>{avatar.src}</small></div>}

          <div className="stage-caption"><span className="caption-icon"><Sparkles size={15}/></span><div><b>{avatar.name} Ustoz</b><small>{avatar.role} · {avatarSpeaking ? "Gapiryapti…" : "Sizni tinglashga tayyor"}</small></div></div>
          <div className="stage-controls"><button type="button" onClick={replay} disabled={!loaded}><RotateCcw size={15}/> Avatarni qayta jonlantirish</button><span><Volume2 size={14}/> Tabiiy jonli suhbat</span></div>

          <div className="studio-live-dock">
            <div className="studio-live-course">
              <label htmlFor="studio-track">Dars yo‘nalishi</label>
              <select id="studio-track" value={track} onChange={(event) => chooseTrack(event.target.value as Track)}>
                {tracks.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </div>
            <LiveVoicePanel track={track} level={level} avatarId={avatarId} onAvatarSpeakingChange={setAvatarSpeaking}/>
          </div>
        </div>

        <aside className="studio-panel studio-panel-compact">
          <div className="panel-heading"><div><span className="panel-kicker">USTOZNI TANLANG</span><h1>3D avatarlar</h1><p>O‘zingizga yoqqan ustoz bilan suhbatlashing.</p></div><span className="panel-spark"><Sparkles size={18}/></span></div>
          <div className="avatar-options studio-avatar-options">
            {avatars.map((item) => <button type="button" key={item.id} onClick={() => chooseAvatar(item.id)} className={avatarId === item.id ? "avatar-option selected" : "avatar-option"}>
              <span className={`avatar-mini ${item.id}`}><span/></span><span className="avatar-option-copy"><b>{item.name}</b><small>{item.role}</small></span>{avatarId === item.id && <Check size={17}/>}
            </button>)}
          </div>
          <div className="studio-memory-card">
            <span className="memory-icon"><Sparkles size={15}/></span>
            <div><b>Shaxsiy xotira</b><p>Tanlagan kursingiz, darajangiz va so‘nggi suhbatlaringiz profilingizda saqlanadi. Keyingi safar Ziyo shu yerdan davom etadi.</p></div>
          </div>
          {profileError && <p role="status" className="studio-profile-error">{profileError}</p>}
          <div className="studio-footer"><span className="footer-shield">✦</span><p>Har bir foydalanuvchi uchun alohida AI xotira</p></div>
        </aside>
      </section>
    </main>
  );
}
