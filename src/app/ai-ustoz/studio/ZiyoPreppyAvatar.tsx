"use client";

import type { CSSProperties } from "react";

type Mood = "idle" | "speaking" | "thinking" | "amused" | "surprised" | "playful-angry" | "skeptical";
type Props = { speaking: boolean; listening: boolean; voiceLevel: number; mood: Mood };

export default function ZiyoPreppyAvatar({ speaking, listening, voiceLevel, mood }: Props) {
  const state = mood !== "idle" && mood !== "speaking" ? mood : speaking ? "speaking" : listening ? "listening" : "idle";
  const angry = state === "playful-angry";
  const happy = state === "amused";
  const surprised = state === "surprised";
  const thinking = state === "thinking";
  const skeptical = state === "skeptical";
  const level = Math.max(0, Math.min(1, voiceLevel));
  const sceneStyle = { "--ziyo-voice-level": level, "--ziyo-voice-intensity": 0.25 + level * 0.75 } as CSSProperties;
  return (
    <div className={`ziyo-preppy-scene ziyo-state-${state} ${speaking ? "is-speaking" : ""} ${listening ? "is-listening" : ""}`} style={sceneStyle} role="img" aria-label={speaking ? "Ziyo gapiryapti" : listening ? "Ziyo tinglayapti" : "Ziyo AI ustoz"}>
      <div className="ziyo-preppy-glow"/>
      <div className="ziyo-preppy-shadow"/>
      <div className="ziyo-preppy-flames" aria-hidden="true"><i/><i/><i/><i/><i/></div>
      <div className="ziyo-preppy-sparkles" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i></div>
      <div className="ziyo-preppy-orbit" aria-hidden="true"/>
      <div className="ziyo-preppy-speaking-waves" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/></div>
      <div className="ziyo-preppy-thinking-bubble" aria-hidden="true"><i/><i/><i/></div>
      <div className="ziyo-preppy-face">
        <svg className="ziyo-preppy-features" viewBox="0 0 240 180" aria-hidden="true">
          <g className="ziyo-face-normal-eyes ziyo-blink-group" fill="#17232d">
            <ellipse cx="77" cy="72" rx="9" ry="13"/>
            <ellipse cx="163" cy="72" rx="9" ry="13"/>
            <circle cx="80" cy="67" r="3.2" fill="#fff"/><circle cx="166" cy="67" r="3.2" fill="#fff"/>
          </g>
          <g className="ziyo-face-angry-eyes" fill="#17232d">
            <path d="M58 66 Q78 50 97 66 L94 77 Q77 67 61 78Z"/>
            <path d="M143 66 Q162 50 182 66 L179 78 Q162 67 146 77Z"/>
          </g>
          <g className="ziyo-face-sleep-eyes" fill="none" stroke="#17232d" strokeWidth="7" strokeLinecap="round">
            <path d="M60 74 Q78 88 96 74"/><path d="M144 74 Q162 88 180 74"/>
          </g>
          <g className="ziyo-face-star-eyes" fill="#17232d">
            <path d="M77 48l7 16 17 1-13 11 4 17-15-9-15 9 4-17-13-11 17-1z"/>
            <path d="M163 48l7 16 17 1-13 11 4 17-15-9-15 9 4-17-13-11 17-1z"/>
          </g>
          <g className="ziyo-face-brows" fill="none" stroke="#17232d" strokeWidth="6" strokeLinecap="round">
            <path d="M59 48 Q77 39 95 48"/><path d="M145 48 Q163 39 181 48"/>
          </g>
          <path className="ziyo-mouth-smile" d="M93 119 Q120 143 147 119" fill="none" stroke="#17232d" strokeWidth="7" strokeLinecap="round"/>
          <path className="ziyo-mouth-neutral" d="M101 127 H139" fill="none" stroke="#17232d" strokeWidth="7" strokeLinecap="round"/>
          <ellipse className="ziyo-mouth-open" cx="120" cy="126" rx={10 + level * 8} ry={2 + level * 25} fill="#17232d"/>
          <path className="ziyo-mouth-speech-line" d="M108 137 Q120 144 132 137" fill="none" stroke="#f3a0aa" strokeWidth="3" strokeLinecap="round"/>
          <path className="ziyo-mouth-surprised" d="M108 115 Q120 103 132 115 Q139 138 120 143 Q101 138 108 115Z" fill="#17232d"/>
          <path className="ziyo-mouth-laugh" d="M91 111 Q120 160 149 111 Q143 151 120 151 Q97 151 91 111Z" fill="#17232d"/>
          <path className="ziyo-mouth-tongue" d="M108 139 Q120 128 132 139 Q130 151 120 151 Q110 151 108 139Z" fill="#f08a9a"/>
        </svg>
        <div className="ziyo-preppy-blush ziyo-blush-left"/><div className="ziyo-preppy-blush ziyo-blush-right"/>
      </div>
      <div className="ziyo-preppy-status"><i/>{speaking ? "Ziyo gapiryapti" : listening ? "Sizni tinglayapman" : thinking ? "O‘ylayapman…" : angry ? "Jiddiy gaplashamiz!" : happy ? "Kayfiyat a’lo!" : "Ziyo AI ustoz"}</div>
    </div>
  );
}
