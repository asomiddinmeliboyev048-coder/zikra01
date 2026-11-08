"use client";

import Link from "next/link";
import Script from "next/script";
import { createElement, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { ArrowLeft, Check, Maximize2, Mic2, Moon, RotateCcw, Sparkles, Sun, Volume2 } from "lucide-react";
import "./studio.css";

type AvatarId = "teacher" | "student";
type ViewerElement = HTMLElement & {
  availableAnimations?: string[];
  animationName?: string;
  play?: () => void;
  pause?: () => void;
  currentTime?: number;
};

const avatars: { id: AvatarId; name: string; role: string; src: string; accent: string }[] = [
  { id: "teacher", name: "Ziyo Ustoz", role: "Erkak ustoz", src: "/models/teacher_joe.glb", accent: "silver" },
  { id: "student", name: "Ziyra", role: "Ayol ustoz", src: "/models/school_girl_v21.glb", accent: "pearl" },
];

const presets = [
  { id: "idle", label: "Tinch holat", description: "Tabiiy kutish holati" },
  { id: "talk", label: "Gapirish", description: "Suhbat paytidagi harakat" },
  { id: "wave", label: "Salomlashish", description: "Qo‘l bilan salom beradi" },
];

const ModelViewer = "model-viewer" as unknown as ComponentType<Record<string, unknown>>;

export default function AiTutorStudioPage() {
  const [avatarId, setAvatarId] = useState<AvatarId>("teacher");
  const [preset, setPreset] = useState("idle");
  const [animations, setAnimations] = useState<string[]>([]);
  const [darkStage, setDarkStage] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const viewerRef = useRef<ViewerElement | null>(null);
  const avatar = useMemo(() => avatars.find((item) => item.id === avatarId) || avatars[0], [avatarId]);

  useEffect(() => {
    if (!scriptReady) return;
    const viewer = viewerRef.current;
    if (!viewer) return;
    const onLoad = () => {
      setLoaded(true);
      setError("");
      const names = viewer.availableAnimations || [];
      setAnimations(names);
      if (names.length) {
        const preferred = names.find((name) => /idle|stand|breath/i.test(name)) || names[0];
        viewer.animationName = preferred;
        viewer.play?.();
      }
    };
    const onError = () => {
      setLoaded(false);
      setError("3D model yuklanmadi. Model fayli public/models ichida borligini tekshiring.");
    };
    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("error", onError);
    return () => {
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("error", onError);
    };
  }, [scriptReady, avatarId]);

  useEffect(() => {
    if (!loaded || !viewerRef.current) return;
    const names = viewerRef.current.availableAnimations || [];
    setAnimations(names);
    if (!names.length) return;
    const pattern = preset === "wave" ? /wave|hello|greet/i : preset === "talk" ? /talk|speak|gesture/i : /idle|stand|breath/i;
    const selected = names.find((name) => pattern.test(name)) || names[0];
    viewerRef.current.animationName = selected;
    viewerRef.current.currentTime = 0;
    viewerRef.current.play?.();
  }, [preset, loaded, avatarId]);

  function changeAvatar(next: AvatarId) {
    setLoaded(false);
    setError("");
    setAnimations([]);
    setAvatarId(next);
    setPreset("idle");
  }

  function replay() {
    if (!viewerRef.current) return;
    viewerRef.current.currentTime = 0;
    viewerRef.current.play?.();
  }

  function toggleFullscreen() {
    const stage = document.querySelector(".zikra-studio-stage");
    if (!stage) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stage.requestFullscreen?.();
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
        <Link href="/ai-ustoz" className="studio-back"><ArrowLeft size={17}/> AI Ustozga qaytish</Link>
        <div className="studio-brand"><span><Sparkles size={17}/></span><div><b>Zikra AI Ustoz</b><small>3D Avatar Studio</small></div></div>
        <div className="studio-top-actions">
          <button type="button" onClick={() => setDarkStage((v) => !v)} aria-label="Sahna rangini almashtirish">{darkStage ? <Sun size={17}/> : <Moon size={17}/>}</button>
          <button type="button" onClick={toggleFullscreen} aria-label="To‘liq ekran"><Maximize2 size={17}/></button>
        </div>
      </header>

      <section className="studio-layout">
        <div className={`zikra-studio-stage ${darkStage ? "stage-dark" : "stage-light"}`}>
          <div className="stage-label"><span className="stage-live-dot"/><span>AVATAR SAHNASI</span><b>{loaded ? "TAYYOR" : "YUKLANMOQDA"}</b></div>
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
            "disable-zoom": true,
            "disable-pan": true,
            "interaction-prompt": "none",
            "shadow-intensity": "1",
            "exposure": "1",
            "environment-image": "neutral",
            "tone-mapping": "commerce",
            "animation-crossfade-duration": "250",
            autoplay: true,
            ar: false,
            "touch-action": "pan-y",
            style: { width: "100%", height: "100%", background: "transparent", pointerEvents: "none" },
          }) : <div className="stage-loading"><span className="studio-spinner"/><p>3D sahna tayyorlanmoqda…</p></div>}
          {!loaded && !error && <div className="stage-loading stage-loading-overlay"><span className="studio-spinner"/><p>Avatar yuklanmoqda…</p></div>}
          {error && <div className="stage-error"><b>Modelni ko‘rsatib bo‘lmadi</b><p>{error}</p><small>Kutilayotgan fayl: {avatar.src}</small></div>}
          <div className="stage-caption"><span className="caption-icon"><Sparkles size={15}/></span><div><b>{avatar.name}</b><small>{avatar.role} · Zikra AI Ustoz</small></div></div>
          <div className="stage-controls"><button type="button" onClick={replay} disabled={!loaded}><RotateCcw size={15}/> Animatsiyani qayta ijro etish</button><span><Mic2 size={14}/> Jonli suhbatga tayyor</span></div>
        </div>

        <aside className="studio-panel">
          <div className="panel-heading"><div><span className="panel-kicker">PERSONALIZATSIYA</span><h1>Avatar sozlamalari</h1><p>Ustozingiz ko‘rinishi va harakatini tanlang.</p></div><span className="panel-spark"><Sparkles size={18}/></span></div>

          <section className="panel-section">
            <div className="section-title"><span>01</span><div><b>Ustozni tanlang</b><small>3D avatar presetlari</small></div></div>
            <div className="avatar-options">
              {avatars.map((item) => <button type="button" key={item.id} onClick={() => changeAvatar(item.id)} className={avatarId === item.id ? "avatar-option selected" : "avatar-option"}>
                <span className={`avatar-mini ${item.id}`}><span/></span><span className="avatar-option-copy"><b>{item.name}</b><small>{item.role}</small></span>{avatarId === item.id && <Check size={17}/>}
              </button>)}
            </div>
          </section>

          <section className="panel-section">
            <div className="section-title"><span>02</span><div><b>Harakat presetlari</b><small>Avatar animatsiyasini boshqarish</small></div></div>
            <div className="preset-list">
              {presets.map((item, index) => <button type="button" key={item.id} onClick={() => setPreset(item.id)} className={preset === item.id ? "preset-option selected" : "preset-option"} disabled={!loaded || (animations.length === 0 && item.id !== "idle")}>
                <span className="preset-number">0{index + 1}</span><span className="preset-copy"><b>{item.label}</b><small>{item.description}</small></span>{preset === item.id && <Check size={16}/>}
              </button>)}
            </div>
            {loaded && animations.length === 0 && <p className="panel-hint">Ushbu GLB faylda tayyor animatsiya kliplari topilmadi. Avatar statik holatda ko‘rsatiladi.</p>}
            {loaded && animations.length > 0 && <p className="panel-hint">{animations.length} ta animatsiya klipi aniqlandi. Presetlar mavjud kliplarga moslashtiriladi.</p>}
          </section>

          <section className="studio-note"><Volume2 size={16}/><div><b>Tabiiy suhbat rejimi</b><p>Jonli suhbat boshlanganida avatar gapirish presetiga o‘tishi mumkin. Foydalanuvchi 3D modelni aylantira olmaydi.</p></div></section>
          <div className="studio-footer"><span className="footer-shield">✦</span><p>Adaptive Silver · Full-screen 3D experience</p></div>
        </aside>
      </section>
    </main>
  );
}
