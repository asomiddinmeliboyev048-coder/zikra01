"use client";

import type { CSSProperties } from "react";

type Props = {
  speaking: boolean;
  listening: boolean;
  voiceLevel: number;
};

export default function ExpressiveTutorFace({ speaking, listening, voiceLevel }: Props) {
  const mood = speaking ? "speaking" : listening ? "listening" : "idle";
  const style = { "--voice-open": `${Math.max(0, Math.min(1, voiceLevel))}` } as CSSProperties;
  return (
    <div className={`zikra-orb-wrap mood-${mood}`} aria-label={speaking ? "Ziyra gapiryapti" : listening ? "Ziyra tinglayapti" : "Ziyra tayyor"}>
      <div className="zikra-orb-halo" />
      <div className="zikra-orb-shadow" />
      <div className="zikra-orb-face" style={style}>
        <div className="zikra-orb-shine" />
        <div className="zikra-orb-brows"><i/><i/></div>
        <div className="zikra-orb-eyes"><i/><i/></div>
        <div className="zikra-orb-mouth"><span/></div>
        <div className="zikra-orb-cheeks"><i/><i/></div>
      </div>
      <div className="zikra-orb-status"><span />{speaking ? "Gapiryapman…" : listening ? "Sizni tinglayapman…" : "Suhbatga tayyor"}</div>
    </div>
  );
}
