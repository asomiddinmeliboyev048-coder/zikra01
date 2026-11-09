"use client";

import { useCallback, useEffect, useState } from "react";
import { Maximize2, Moon, Sparkles, Sun } from "lucide-react";
import LiveVoicePanel from "../LiveVoicePanel";
import ExpressiveTutorFace from "./ExpressiveTutorFace";
import "./studio.css";

type Track = "english" | "russian" | "coding" | "cyber";
type TutorProfile = { selected_track: Track; level: string; avatar_id: "teacher" | "student" };
const tracks: { id: Track; label: string }[] = [
  { id: "english", label: "Ingliz tili" },
  { id: "russian", label: "Rus tili" },
  { id: "coding", label: "Dasturlash" },
  { id: "cyber", label: "Kiberxavfsizlik" },
];
const levels = ["Boshlang‘ich", "O‘rta", "Yuqori", "Mutaxassis"];

export default function AiTutorStudioPage() {
  const [track, setTrack] = useState<Track>("english");
  const [level, setLevel] = useState("Boshlang‘ich");
  const [darkStage, setDarkStage] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [profileReady, setProfileReady] = useState(false);
  const [profileError, setProfileError] = useState("");

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
        if (profile.avatar_id !== "student") void fetch("/api/ai-tutor/profile", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarId: "student" }),
        });
      })
      .catch((cause) => {
        if (active) setProfileError(cause instanceof Error ? cause.message : "Profil xotirasi yuklanmadi.");
      })
      .finally(() => { if (active) setProfileReady(true); });
    return () => { active = false; };
  }, []);

  const saveProfile = useCallback(async (patch: { selectedTrack?: Track; level?: string }) => {
    try {
      const response = await fetch("/api/ai-tutor/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setProfileError(payload.error || "Sozlama saqlanmadi.");
      } else setProfileError("");
    } catch { setProfileError("Xotira serveriga ulanib bo‘lmadi."); }
  }, []);

  function chooseTrack(next: Track) {
    setTrack(next);
    if (profileReady) void saveProfile({ selectedTrack: next });
  }
  function chooseLevel(next: string) {
    setLevel(next);
    if (profileReady) void saveProfile({ level: next });
  }
  function toggleFullscreen() {
    const stage = document.querySelector(".zikra-studio-stage");
    if (!stage) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stage.requestFullscreen?.();
  }

  return (
    <main className="zikra-studio">
      <header className="studio-topbar">
        <div className="studio-brand"><span><Sparkles size={18}/></span><div><b>Zikra AI Ustoz</b><small>JONLI AI MURABBIY</small></div></div>
        <div className="studio-top-actions">
          <button type="button" onClick={() => setDarkStage((value) => !value)} aria-label="Sahna rangini almashtirish">{darkStage ? <Sun size={17}/> : <Moon size={17}/>}</button>
          <button type="button" onClick={toggleFullscreen} aria-label="To‘liq ekran"><Maximize2 size={17}/></button>
        </div>
      </header>

      <section className="studio-layout studio-layout-single">
        <div className={`zikra-studio-stage ${darkStage ? "stage-dark" : "stage-light"} ${speaking ? "avatar-speaking" : ""}`}>
          <div className="stage-label"><span className="stage-live-dot"/><span>ZIYRA AI</span><b>{speaking ? "GAPIRYAPTI" : listening ? "TINGLAYAPTI" : "TAYYOR"}</b></div>
          <div className="stage-aura stage-aura-one"/>
          <div className="stage-aura stage-aura-two"/>
          <ExpressiveTutorFace speaking={speaking} listening={listening} voiceLevel={voiceLevel}/>
          <div className="stage-caption"><span className="caption-icon"><Sparkles size={15}/></span><div><b>Ziyra</b><small>Shaxsiy AI ustoz · {speaking ? "Sizga javob beryapti" : listening ? "Sizni tinglayapti" : "Siz bilan suhbatga tayyor"}</small></div></div>

          <div className="studio-live-dock">
            <div className="studio-live-course">
              <label htmlFor="studio-track">O‘rganiladigan ko‘nikma</label>
              <select id="studio-track" value={track} onChange={(event) => chooseTrack(event.target.value as Track)}>
                {tracks.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
              <label htmlFor="studio-level">Sizning darajangiz</label>
              <select id="studio-level" value={level} onChange={(event) => chooseLevel(event.target.value)}>
                {levels.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <LiveVoicePanel
              track={track}
              level={level}
              avatarId="student"
              onAvatarSpeakingChange={setSpeaking}
              onListeningChange={setListening}
              onVoiceLevelChange={setVoiceLevel}
            />
          </div>
          {profileError && <p role="status" className="studio-profile-error">{profileError}</p>}
        </div>
      </section>
    </main>
  );
}
