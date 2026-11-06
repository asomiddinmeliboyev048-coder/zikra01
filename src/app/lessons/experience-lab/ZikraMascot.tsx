"use client";

import { useEffect, useState } from "react";

type Props = { mood: number };

const VIEWER_SRC =
  "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js";

let viewerLoad: Promise<void> | null = null;

function loadViewer() {
  if (typeof window === "undefined") return Promise.resolve();
  if (customElements.get("model-viewer")) return Promise.resolve();
  if (!viewerLoad) {
    viewerLoad = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-zikra-model-viewer]');
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("3D viewer yuklanmadi")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.type = "module";
      script.src = VIEWER_SRC;
      script.dataset.zikraModelViewer = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("3D viewer yuklanmadi"));
      document.head.appendChild(script);
    });
  }
  return viewerLoad;
}

function FallbackMascot({ mood }: Props) {
  return (
    <svg viewBox="0 0 160 150" className="h-full w-full" fill="none" aria-hidden="true">
      <ellipse cx="80" cy="139" rx="48" ry="7" fill="#123F39" opacity=".1"/>
      <path d="M119 111c28 5 32-12 20-22-7-6-14-2-12 4" stroke="#0B8F80" strokeWidth="10" strokeLinecap="round"/>
      <path d="m44 65-10-42c-2-8 7-12 13-6l22 19m47 29 10-42c2-8-7-12-13-6L91 39" fill="#EAF8F3" stroke="#087D70" strokeWidth="5" strokeLinejoin="round"/>
      <path d="m48 27 9 18-14-2Zm64 0-9 18 14-2Z" fill="#F4A7B8"/>
      <path d="M37 70c0-27 19-45 43-45s43 18 43 45v28c0 25-18 39-43 39S37 123 37 98V70Z" fill="#F8FFFC" stroke="#087D70" strokeWidth="5"/>
      <ellipse cx="63" cy="77" rx="5" ry="8" fill="#163C38"/><ellipse cx="97" cy="77" rx="5" ry="8" fill="#163C38"/>
      <circle cx="61" cy="74" r="2.5" fill="white"/><circle cx="95" cy="74" r="2.5" fill="white"/>
      <path d="m75 89 5 4 5-4m-5 8v4m0 0c-5 6-11 5-14 1m14-1c5 6 11 5 14 1" stroke="#087D70" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="m42 91-19-4m20 16-21 3m96-15 19-4m-20 16 21 3" stroke="#8BB9AD" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M58 129c-3 7-1 11 5 11h10m29-11c3 7 1 11-5 11H87" stroke="#087D70" strokeWidth="5" strokeLinecap="round"/>
      {mood===7 && <path d="m18 35 5-9 5 9 9 5-9 5-5 9-5-9-9-5 9-5Zm116 6 4-7 4 7 7 4-7 4-4 7-4-7-7-4 7-4Z" fill="#F7C75D"/>}
    </svg>
  );
}

export default function ZikraMascot({ mood }: Props) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    // Do not mount an empty <model-viewer> when the GLB has not been deployed.
    // Keep the visible SVG mascot until the actual binary asset is reachable.
    fetch("/models/zikra-cat.glb", { method: "HEAD", cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("3D model hali serverda mavjud emas");
        return loadViewer();
      })
      .then(() => { if (active) setReady(true); })
      .catch(() => { if (active) setFailed(true); });

    return () => { active = false; };
  }, []);

  const ModelViewer = "model-viewer" as any;
  return (
    <div className={`zikra-cat cat-${mood} relative h-[108px] w-[108px] shrink-0`} aria-label="Zikra mushukchasi">
      <style jsx>{`
        .zikra-cat { filter: drop-shadow(0 12px 12px #085a4e20); animation: catFloat 3s ease-in-out infinite; }
        .cat-0,.cat-7 { animation: catHop 1.7s ease-in-out infinite; }
        .cat-4 { animation: catThink 2.5s ease-in-out infinite; }
        @keyframes catFloat { 50% { transform: translateY(-7px) rotate(2deg); } }
        @keyframes catHop { 45% { transform: translateY(-12px) rotate(-4deg); } }
        @keyframes catThink { 50% { transform: rotate(5deg) translateY(-3px); } }
        @media(prefers-reduced-motion:reduce) { .zikra-cat { animation:none!important; } }
      `}</style>
      {ready && !failed ? (
        <ModelViewer
          src="/models/zikra-cat.glb"
          alt="Zikra cream rangli 3D mushukchasi"
          loading="eager"
          camera-controls
          disable-zoom
          interaction-prompt="none"
          shadow-intensity="0.7"
          exposure="1.15"
          environment-image="neutral"
          style={{ width: "100%", height: "100%", background: "transparent", "--poster-color": "transparent" }}
          onError={() => setFailed(true)}
        />
      ) : <FallbackMascot mood={mood} />}
      {mood === 7 && <span className="pointer-events-none absolute -right-1 top-0 text-xl text-amber-400" aria-hidden="true">✦</span>}
    </div>
  );
}
