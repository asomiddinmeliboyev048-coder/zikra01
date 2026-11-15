"use client";

import type { CSSProperties } from "react";

type Mood = "idle" | "speaking" | "thinking" | "amused" | "surprised" | "playful-angry" | "skeptical";
type Props = { speaking: boolean; listening: boolean; voiceLevel: number; mood: Mood };

export default function ZiyoCharacter({ speaking, listening, voiceLevel, mood }: Props) {
  const state = speaking ? "speaking" : listening ? "listening" : mood;
  const mouth = speaking ? Math.max(0.12, Math.min(1, voiceLevel)) : 0;
  const style = { "--voice-mouth": mouth } as CSSProperties;
  return (
    <div className={`ziyo-character ziyo-${state}`} style={style} role="img" aria-label={speaking ? "Ziyo gapiryapti" : listening ? "Ziyo tinglayapti" : "Ziyo AI ustoz"}>
      <div className="ziyo-character-halo"/>
      <svg className="ziyo-character-art" viewBox="0 0 440 500" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="ziyoHood" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#21c6a2"/><stop offset="1" stopColor="#087968"/></linearGradient>
          <linearGradient id="ziyoSkin" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffe6cb"/><stop offset="1" stopColor="#e8b99d"/></linearGradient>
          <linearGradient id="ziyoHair" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#263747"/><stop offset="1" stopColor="#101c2b"/></linearGradient>
          <radialGradient id="ziyoCheek"><stop stopColor="#f58b91" stopOpacity=".62"/><stop offset="1" stopColor="#f58b91" stopOpacity="0"/></radialGradient>
          <filter id="ziyoShadow" x="-40%" y="-40%" width="180%" height="190%"><feGaussianBlur stdDeviation="12"/></filter>
        </defs>
        <ellipse cx="220" cy="466" rx="112" ry="17" fill="#061b22" opacity=".28" filter="url(#ziyoShadow)"/>
        <g className="ziyo-body">
          <path d="M112 454c5-93 26-139 75-151h66c49 12 70 58 75 151l-29 18H141z" fill="url(#ziyoHood)" stroke="#a5f3df" strokeOpacity=".45" strokeWidth="3"/>
          <path d="M164 310c15 23 35 34 56 34s41-11 56-34l-10-17h-92z" fill="#e6c0a7"/>
          <path d="M177 332c10 24 24 37 43 37s33-13 43-37" fill="none" stroke="#b4fff0" strokeWidth="5" opacity=".65"/>
          <path d="M184 378h72l-10 69h-52z" fill="#075f55" opacity=".72"/>
          <path d="M220 389l19 13-19 25-19-25z" fill="#d7fff4"/>
          <text x="220" y="412" textAnchor="middle" fontSize="17" fontWeight="900" fill="#087968">Z</text>
          <path d="M126 350c-22 22-34 56-38 91l24 12 31-77zM314 350c22 22 34 56 38 91l-24 12-31-77z" fill="url(#ziyoHood)" stroke="#a5f3df" strokeOpacity=".35" strokeWidth="3"/>
          <path d="M91 438c-5 12 0 25 12 27 13 2 24-7 27-20l-10-18zM349 438c5 12 0 25-12 27-13 2-24-7-27-20l10-18z" fill="url(#ziyoSkin)"/>
        </g>
        <g className="ziyo-head">
          <path d="M133 175c-8-67 27-118 87-118 65 0 95 50 87 119l-8 89c-5 57-40 91-79 91s-74-34-79-91z" fill="url(#ziyoSkin)" stroke="#f7d8c2" strokeWidth="3"/>
          <path d="M129 191c-17-72 8-137 69-153 42-11 92 3 112 47 10 21 12 48 5 78-9-31-27-43-45-49-20 20-61 29-105 20-8 20-20 39-36 57z" fill="url(#ziyoHair)"/>
          <path d="M153 115c18-40 51-58 89-53-23 9-39 22-48 42 28-23 57-26 85-14-23 2-42 11-55 26 26-7 48-4 66 8-37-4-69 5-95 25-17 13-32 30-44 52-13-25-12-57 2-86z" fill="#354a5d" opacity=".9"/>
          <path d="M144 206c-14-8-23 1-20 21 2 17 12 27 24 25zM296 206c14-8 23 1 20 21-2 17-12 27-24 25z" fill="url(#ziyoSkin)"/>
          <path className="ziyo-brow ziyo-brow-left" d="M164 205q25-15 49-2" fill="none" stroke="#293747" strokeWidth="9" strokeLinecap="round"/>
          <path className="ziyo-brow ziyo-brow-right" d="M227 203q25-13 49 2" fill="none" stroke="#293747" strokeWidth="9" strokeLinecap="round"/>
          <g className="ziyo-eyes">
            <ellipse cx="188" cy="235" rx="18" ry="23" fill="#fff"/>
            <ellipse cx="252" cy="235" rx="18" ry="23" fill="#fff"/>
            <ellipse className="ziyo-pupil" cx="191" cy="239" rx="10" ry="14" fill="#176d65"/>
            <ellipse className="ziyo-pupil" cx="249" cy="239" rx="10" ry="14" fill="#176d65"/>
            <circle cx="195" cy="232" r="4.5" fill="#fff"/>
            <circle cx="253" cy="232" r="4.5" fill="#fff"/>
          </g>
          <ellipse cx="158" cy="270" rx="25" ry="15" fill="url(#ziyoCheek)"/>
          <ellipse cx="282" cy="270" rx="25" ry="15" fill="url(#ziyoCheek)"/>
          <path d="M215 247q-8 23 2 25" fill="none" stroke="#c68f78" strokeWidth="4" strokeLinecap="round"/>
          <path className="ziyo-mouth" d="M197 292q23 18 46 0" fill="none" stroke="#874e4b" strokeWidth="6" strokeLinecap="round"/>
          <ellipse className="ziyo-mouth-open" cx="220" cy="294" rx="17" ry={4 + mouth * 12} fill="#642d39" opacity={speaking ? 1 : 0}/>
          <path d="M204 299q16 9 32 0" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity={speaking ? .85 : 0}/>
        </g>
        <g className="ziyo-headphones">
          <path d="M130 220c-8-92 27-145 90-145s98 53 90 145" fill="none" stroke="#12b99b" strokeWidth="13" strokeLinecap="round"/>
          <rect x="117" y="199" width="27" height="59" rx="12" fill="#102b38" stroke="#4be0c2" strokeWidth="4"/>
          <rect x="296" y="199" width="27" height="59" rx="12" fill="#102b38" stroke="#4be0c2" strokeWidth="4"/>
          <path d="M123 224h15M302 224h15" stroke="#d1fff5" strokeWidth="3" strokeLinecap="round"/>
        </g>
      </svg>
      <div className="ziyo-character-status"><i/>{speaking ? "Ziyo gapiryapti" : listening ? "Sizni tinglayapman" : mood === "thinking" ? "O‘ylayapman…" : "Sizning AI ustozingiz"}</div>
    </div>
  );
}
