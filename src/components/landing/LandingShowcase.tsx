"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Flame, Play, Sparkles, Trophy, Volume2, VolumeX, Zap } from "lucide-react";

type FeaturedProfile = {
  id: string; full_name: string; username: string | null; city: string | null;
  bio: string | null; avatar_url: string | null; xp: number; level: string;
  trust_score: number; streak_days: number; is_verified: boolean;
  teach_skills: string[]; learn_skills: string[];
};
type FeaturedVideo = {
  id: string; title: string; cloudinary_url: string; thumbnail_url: string | null;
  duration: number | null; uploader: { id: string; full_name: string; avatar_url: string | null } | null;
  skill_name: string | null;
};

function ArrowButton({ direction, onClick, label }: { direction: "prev" | "next"; onClick: () => void; label: string }) {
  const Icon = direction === "prev" ? ArrowLeft : ArrowRight;
  return <button type="button" onClick={onClick} aria-label={label} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:scale-105 hover:bg-emerald-300 hover:text-[#08251d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"><Icon className="h-4 w-4" /></button>;
}

export default function LandingShowcase({ profiles, videos }: { profiles: FeaturedProfile[]; videos: FeaturedVideo[] }) {
  const [profileIndex, setProfileIndex] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const videoStageRef = useRef<HTMLDivElement | null>(null);
  const safeProfiles = useMemo(() => profiles.slice(0, 5), [profiles]);
  const safeVideos = useMemo(() => videos.length ? videos.slice(0, 5) : [
    { id: "zikra-demo-1", title: "Birgalikda o'rganish", cloudinary_url: "https://videos.pexels.com/video-files/5200029/5200029-uhd_3840_2160_25fps.mp4", thumbnail_url: null, duration: 7, uploader: null, skill_name: "Hamkorlik" },
    { id: "zikra-demo-2", title: "Raqamli ta'lim", cloudinary_url: "https://videos.pexels.com/video-files/9198424/9198424-hd_1920_1080_25fps.mp4", thumbnail_url: null, duration: 46, uploader: null, skill_name: "Texnologiya" },
    { id: "zikra-demo-3", title: "Fikr almashish", cloudinary_url: "https://videos.pexels.com/video-files/9198421/9198421-hd_1920_1080_25fps.mp4", thumbnail_url: null, duration: 26, uploader: null, skill_name: "Hamjamiyat" },
  ], [videos]);

  const moveProfile = (step: number) => setProfileIndex((current) => (current + step + safeProfiles.length) % safeProfiles.length);
  const moveVideo = (step: number) => setVideoIndex((current) => (current + step + safeVideos.length) % safeVideos.length);

  useEffect(() => {
    if (!safeVideos.length || !videoStageRef.current) return;
    const stage = videoStageRef.current;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.55);
      safeVideos.forEach((_, index) => {
        const video = videoRefs.current[index];
        if (!video) return;
        if (visible && index === videoIndex) {
          video.muted = !soundOn;
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: [0, 0.55, 0.8] });
    observer.observe(stage);
    return () => { observer.disconnect(); videoRefs.current.forEach((video) => video?.pause()); };
  }, [safeVideos, videoIndex, soundOn]);

  if (!safeProfiles.length && !safeVideos.length) return null;

  return (
    <div className="space-y-24">
      {safeProfiles.length > 0 && <section className="relative overflow-hidden bg-[#081a16] py-24 text-white sm:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(16,185,129,.2),transparent_55%),radial-gradient(ellipse_at_90%_90%,rgba(214,165,83,.12),transparent_45%)]" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end" data-aos="fade-up">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.22em] text-emerald-300"><Trophy className="h-4 w-4" /> Zikra hamjamiyati</p>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-.065em] sm:text-6xl">Kashf et: <span className="text-emerald-300">eng faol 5 profil.</span></h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/60">Bilimini ulashayotgan, o'rganishda davom etayotgan va hamjamiyatga hissa qo'shayotgan insonlar bilan tanish.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="mr-2 text-xs font-semibold tabular-nums text-white/45">{String(profileIndex + 1).padStart(2, "0")} / {String(safeProfiles.length).padStart(2, "0")}</span>
              <ArrowButton direction="prev" onClick={() => moveProfile(-1)} label="Oldingi profil" />
              <ArrowButton direction="next" onClick={() => moveProfile(1)} label="Keyingi profil" />
            </div>
          </div>

          <div className="relative mx-auto mt-14 h-[620px] max-w-5xl [perspective:1800px] sm:h-[570px]" data-aos="fade-up" data-aos-delay="100">
            {safeProfiles.map((profile, index) => {
              const offset = (index - profileIndex + safeProfiles.length) % safeProfiles.length;
              const normalized = offset > safeProfiles.length / 2 ? offset - safeProfiles.length : offset;
              const active = normalized === 0;
              const visible = Math.abs(normalized) <= 2;
              return <article key={profile.id} aria-hidden={!active} className="absolute left-1/2 top-0 w-[min(88vw,430px)] -translate-x-1/2 overflow-hidden rounded-[2rem] border border-white/15 bg-[#102a23] shadow-[0_35px_100px_-40px_rgba(0,0,0,.8)] transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(.2,.75,.2,1)]" style={{ opacity: visible ? (active ? 1 : 0.48) : 0, pointerEvents: active ? "auto" : "none", transform: `translateX(calc(-50% + ${normalized * 270}px)) translateZ(${active ? 70 : -170}px) rotateY(${normalized * -24}deg) scale(${active ? 1 : 0.84})`, zIndex: 10 - Math.abs(normalized), filter: active ? "none" : "saturate(.65)" }}>
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-emerald-400/30 via-teal-900 to-[#091a16]">
                  <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(#b9f5d7_1px,transparent_1px)] [background-size:18px_18px]" />
                  <div className="absolute left-6 top-5 flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100 backdrop-blur"><Sparkles className="h-3 w-3" /> Faol hamjamiyat a'zosi</div>
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#102a23] to-transparent" />
                  <div className="absolute -bottom-12 left-7 h-28 w-28 overflow-hidden rounded-[1.65rem] border-4 border-[#102a23] bg-[#193b30] shadow-xl">
                    {profile.avatar_url ? <Image src={profile.avatar_url} alt={profile.full_name} fill sizes="112px" className="object-cover" unoptimized /> : <div className="flex h-full w-full items-center justify-center text-3xl font-black text-emerald-200">{profile.full_name.slice(0,1).toUpperCase()}</div>}
                  </div>
                  <div className="absolute bottom-5 right-6 rounded-2xl border border-emerald-200/20 bg-emerald-300/10 px-3 py-2 text-right backdrop-blur"><p className="text-[9px] font-bold uppercase tracking-wider text-emerald-200">Reyting</p><p className="mt-0.5 text-lg font-black">{profile.trust_score.toFixed(1)}<span className="ml-1 text-xs text-emerald-200/60">/ 5</span></p></div>
                </div>
                <div className="px-7 pb-7 pt-16">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h3 className="flex items-center gap-1.5 text-2xl font-bold tracking-tight">{profile.full_name}{profile.is_verified && <BadgeCheck className="h-5 w-5 shrink-0 fill-emerald-300 text-[#102a23]" />}</h3><p className="mt-1 truncate text-xs text-white/50">{profile.username ? `@${profile.username}` : "Zikra a'zosi"}{profile.city ? ` · ${profile.city}` : ""}</p></div>
                    <span className="shrink-0 rounded-xl border border-amber-200/15 bg-amber-200/10 px-3 py-2 text-[10px] font-bold text-amber-200">{profile.level || "Yangi"}</span>
                  </div>
                  <p className="mt-4 min-h-[48px] text-sm leading-6 text-white/65">{profile.bio || "Bilim almashish va yangi ko'nikmalarni o'rganishga tayyor."}</p>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-white/[.055] p-3"><Zap className="h-3.5 w-3.5 text-amber-300" /><p className="mt-2 text-lg font-black tabular-nums">{profile.xp.toLocaleString("uz-UZ")}</p><p className="text-[9px] uppercase tracking-wider text-white/40">XP</p></div>
                    <div className="rounded-xl bg-white/[.055] p-3"><Flame className="h-3.5 w-3.5 text-orange-300" /><p className="mt-2 text-lg font-black tabular-nums">{profile.streak_days}</p><p className="text-[9px] uppercase tracking-wider text-white/40">Kun streak</p></div>
                    <div className="rounded-xl bg-white/[.055] p-3"><Trophy className="h-3.5 w-3.5 text-emerald-300" /><p className="mt-2 text-lg font-black tabular-nums">{profile.trust_score.toFixed(1)}</p><p className="text-[9px] uppercase tracking-wider text-white/40">Ishonch</p></div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div><p className="mb-2 text-[9px] font-extrabold uppercase tracking-[.16em] text-emerald-300">O'rgata oladi</p><div className="flex flex-wrap gap-1.5">{profile.teach_skills.slice(0,4).map((skill) => <span key={skill} className="rounded-lg bg-emerald-300/10 px-2 py-1 text-[10px] font-semibold text-emerald-100">{skill}</span>)}{!profile.teach_skills.length && <span className="text-xs text-white/35">Ko'rsatilmagan</span>}</div></div>
                    <div><p className="mb-2 text-[9px] font-extrabold uppercase tracking-[.16em] text-sky-300">O'rganmoqchi</p><div className="flex flex-wrap gap-1.5">{profile.learn_skills.slice(0,4).map((skill) => <span key={skill} className="rounded-lg bg-sky-300/10 px-2 py-1 text-[10px] font-semibold text-sky-100">{skill}</span>)}{!profile.learn_skills.length && <span className="text-xs text-white/35">Ko'rsatilmagan</span>}</div></div>
                  </div>
                  <Link href={`/profile/${profile.id}`} tabIndex={active ? 0 : -1} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3.5 text-sm font-extrabold text-[#09251d] transition hover:-translate-y-0.5 hover:bg-emerald-200">Profilni ko'rish <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </article>;
            })}
          </div>
          <div className="mt-3 flex justify-center gap-2">{safeProfiles.map((profile, index) => <button key={profile.id} type="button" aria-label={`${index+1}-profilga o'tish`} onClick={() => setProfileIndex(index)} className={`h-1.5 rounded-full transition-all ${index === profileIndex ? "w-9 bg-emerald-300" : "w-2 bg-white/25 hover:bg-white/50"}`} />)}</div>
          <p className="mt-5 text-center text-[11px] text-white/35">Kartochkani aylantirish uchun yon tugmalardan foydalaning. Mobil qurilmada ham ishlaydi.</p>
        </div>
      </section>}

      {safeVideos.length > 0 && <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end" data-aos="fade-up">
          <div className="max-w-2xl"><p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.2em] text-emerald-700 dark:text-emerald-300"><Play className="h-4 w-4" /> Hamjamiyatdan videolar</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.06em] text-[#142522] dark:text-white sm:text-5xl">Bilimni tomosha qil, ilhom ol.</h2><p className="mt-4 text-sm leading-7 text-[#74867c] dark:text-[#9aafa5]">Zikra'da ulashilgan darslar orasidan tanlangan lavhalar. Kursor bilan aylantir yoki tugmalarni bos.</p></div>
          <div className="flex items-center gap-3"><span className="mr-2 text-xs font-semibold tabular-nums text-[#91a198]">{String(videoIndex+1).padStart(2,"0")} / {String(safeVideos.length).padStart(2,"0")}</span><ArrowButton direction="prev" onClick={() => moveVideo(-1)} label="Oldingi video" /><ArrowButton direction="next" onClick={() => moveVideo(1)} label="Keyingi video" /></div>
        </div>
        <div ref={videoStageRef} className="relative mt-10 overflow-hidden rounded-[2rem] border border-[#dce8df] bg-[#0b1915] p-3 shadow-[0_35px_90px_-55px_rgba(4,40,28,.55)] dark:border-white/10 sm:p-5" data-aos="zoom-in-up">
          <div className="relative mx-auto h-[440px] max-w-5xl [perspective:1400px] sm:h-[500px]">
            {safeVideos.map((video, index) => {
              const offset = (index - videoIndex + safeVideos.length) % safeVideos.length;
              const normalized = offset > safeVideos.length/2 ? offset-safeVideos.length : offset;
              const active = normalized === 0;
              return <article key={video.id} className="absolute left-1/2 top-0 h-full w-[min(84vw,760px)] -translate-x-1/2 overflow-hidden rounded-[1.5rem] bg-black transition-all duration-700 ease-out" style={{opacity: Math.abs(normalized)>1 ? 0 : active ? 1 : .38, pointerEvents: active ? "auto" : "none", transform:`translateX(calc(-50% + ${normalized*210}px)) translateZ(${active?50:-160}px) rotateY(${normalized*-20}deg) scale(${active?1:.82})`, zIndex:5-Math.abs(normalized)}}>
                <video ref={(node) => { videoRefs.current[index] = node; }} className="h-full w-full object-cover" src={video.cloudinary_url} poster={video.thumbnail_url || undefined} muted={!soundOn} playsInline loop preload={active ? "metadata" : "none"} controls={active} aria-label={video.title} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/15" />
                <div className="pointer-events-none absolute left-5 top-5 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">{video.skill_name || "Zikra video darsi"}</div>
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white sm:bottom-7 sm:left-7 sm:right-7">
                  <div className="min-w-0"><h3 className="line-clamp-2 text-xl font-bold tracking-tight sm:text-2xl">{video.title}</h3><p className="mt-2 text-xs text-white/65">{video.uploader?.full_name || "Zikra hamjamiyati"}</p></div>
                  {video.uploader?.id && <Link href={`/profile/${video.uploader.id}`} className="pointer-events-auto shrink-0 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold backdrop-blur hover:bg-white/20">Muallif profili</Link>}
                </div>
              </article>;
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-1 pt-4 text-white">
            <div className="flex items-center gap-2 text-xs text-white/55"><span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.8)]" /> Kadr ekranga kelganda avtomatik ijro etiladi</div>
            <button type="button" onClick={() => setSoundOn((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold transition hover:bg-white/20" aria-pressed={soundOn}>{soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}{soundOn ? "Ovoz yoqilgan" : "Ovozsiz ijro"}</button>
          </div>
        </div>
        <p className="mt-4 text-center text-[10px] leading-5 text-[#91a198] dark:text-[#758a80]">Avtomatik ijro brauzer cheklovlariga mos ravishda ovozsiz boshlanadi. Ovoz tugmasi orqali yoqiladi.</p>
      </section>}
    </div>
  );
}
