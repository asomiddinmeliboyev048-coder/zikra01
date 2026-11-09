"use client";

import type { CSSProperties } from "react";

type Mood = "idle" | "speaking" | "thinking" | "amused" | "surprised" | "playful-angry";
type Props = { speaking: boolean; listening: boolean; voiceLevel: number; mood: Mood };

export default function ExpressiveTutorFace({ speaking, listening, voiceLevel, mood }: Props) {
  const faceMood = speaking ? "speaking" : listening ? "listening" : mood;
  const style = { "--mouth-open": `${Math.max(0.08, Math.min(1, voiceLevel))}` } as CSSProperties;
  return (
    <div className={`expressive-tutor expressive-${faceMood} expressive-${mood}`} style={style} role="img" aria-label={speaking ? "Ziyo gapiryapti" : listening ? "Ziyo tinglayapti" : "Ziyo suhbatga tayyor"}>
      <div className="expressive-orbit expressive-orbit-a"/>
      <div className="expressive-orbit expressive-orbit-b"/>
      <div className="expressive-shadow"/>
      <div className="expressive-head">
        <div className="expressive-highlight"/>
        <div className="expressive-brows"><i/><i/></div>
        <div className="expressive-eyes"><i/><i/></div>
        <div className="expressive-cheeks"><i/><i/></div>
        <div className="expressive-mouth"><span/></div>
      </div>
      <div className="expressive-nameplate"><span className="expressive-live-dot"/><b>Ziyo</b><small>{speaking ? "Gapiryapman" : listening ? "Sizni tinglayapman" : "Suhbatga tayyor"}</small></div>
    </div>
  );
}
