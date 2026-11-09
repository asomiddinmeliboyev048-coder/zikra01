"use client";

import Script from "next/script";
import { createElement, useEffect, useMemo, useRef, useState, type ComponentType } from "react";

type AvatarId = "teacher" | "student";
type ViewerElement = HTMLElement & {
  availableAnimations?: string[];
  animationName?: string;
  play?: () => void;
  pause?: () => void;
  currentTime?: number;
};

const AVATAR_STORAGE_KEY = "zikra-ai-ustoz-avatar";
const avatars: Record<AvatarId, { name: string; role: string; src: string }> = {
  teacher: { name: "Ziyo Ustoz", role: "Erkak ustoz", src: "/models/teacher_joe.glb" },
  student: { name: "Ziyra", role: "Ayol ustoz", src: "/models/school_girl_v21.glb" },
};
const ModelViewer = "model-viewer" as unknown as ComponentType<Record<string, unknown>>;

export default function TutorAvatarStage({ speaking }: { speaking: boolean }) {
  const [avatarId, setAvatarId] = useState<AvatarId>("teacher");
  const [scriptReady, setScriptReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [animations, setAnimations] = useState<string[]>([]);
  const [error, setError] = useState("");
  const viewerRef = useRef<ViewerElement | null>(null);
  const avatar = useMemo(() => avatars[avatarId], [avatarId]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(AVATAR_STORAGE_KEY);
      if (saved === "teacher" || saved === "student") setAvatarId(saved);
      fetch("/api/ai-tutor/context").then(async (response) => {
        if (!response.ok) return;
        const payload = await response.json();
        const preferred = payload.profile?.selected_avatar;
        if (preferred === "teacher" || preferred === "student") {
          setAvatarId(preferred);
          window.localStorage.setItem(AVATAR_STORAGE_KEY, preferred);
        }
      }).catch(() => undefined);
    } catch { /* storage may be unavailable in private browsing */ }
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
      if (idle) {
        viewer.animationName = idle;
        viewer.play?.();
      }
    };
    const onError = () => {
      setLoaded(false);
      setError("3D avatar yuklanmadi. GLB fayl manzilini tekshiring.");
    };
    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("error", onError);
    return () => {
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("error", onError);
    };
  }, [scriptReady, avatarId]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !loaded || animations.length === 0) return;
    const idle = animations.find((name) => /idle|stand|breath/i.test(name)) || animations[0];
    const talk = animations.find((name) => /talk|speak|speech|conversation|gesture/i.test(name));
    const next = speaking && talk ? talk : idle;
    if (viewer.animationName !== next) {
      viewer.animationName = next;
      viewer.currentTime = 0;
      viewer.play?.();
    }
  }, [speaking, loaded, animations]);

  return (
    <div className={`zikra-live-avatar ${speaking ? "is-speaking" : "is-listening"}`} aria-label={speaking ? "Ustoz gapiryapti" : "Ustoz tinglamoqda"}>
      <Script
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        type="module"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setError("3D ko‘rish moduli yuklanmadi.")}
      />
      <div className="zikra-live-avatar-glow" />
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
        "shadow-intensity": "0.8",
        "exposure": "1",
        "environment-image": "neutral",
        "tone-mapping": "commerce",
        "animation-crossfade-duration": "220",
        autoplay: true,
        ar: false,
        style: { width: "100%", height: "100%", background: "transparent", pointerEvents: "none" },
      }) : <div className="zikra-live-avatar-loading">3D ustoz tayyorlanmoqda…</div>}
      {!loaded && !error && <div className="zikra-live-avatar-loading overlay">Avatar yuklanmoqda…</div>}
      {error && <div className="zikra-live-avatar-error">{error}</div>}
      <div className="zikra-live-avatar-label">
        <span className="zikra-live-avatar-dot" />
        <span>{avatar.name}</span>
        <small>{speaking ? "Gapiryapman…" : "Sizni tinglayapman"}</small>
      </div>
      {loaded && animations.length === 0 && <span className="zikra-live-avatar-hint">Modelda animatsiya kliplari yo‘q — statik 3D ko‘rinish</span>}
    </div>
  );
}
