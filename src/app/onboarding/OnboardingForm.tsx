"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import Image from "next/image";
import type { Skill } from "@/lib/types";
import { saveProfileAction, checkUsernameAction, type ProfileState } from "@/app/actions/profile";
import SkillSelector from "@/components/SkillSelector";
import SubmitButton from "@/components/SubmitButton";
import { avatarFallback } from "@/lib/utils";
import { uploadAvatar } from "@/lib/storage";

const initial: ProfileState = {};

interface Props {
  skills: Skill[];
  defaults: {
    full_name: string;
    username: string;
    city: string;
    bio: string;
    avatar_url: string;
    teach: string[];
    learn: string[];
  };
}

export default function OnboardingForm({ skills, defaults }: Props) {
  const [state, formAction] = useActionState(saveProfileAction, initial);
  const [teach, setTeach] = useState<string[]>(defaults.teach);
  const [learn, setLearn] = useState<string[]>(defaults.learn);
  const [name, setName] = useState(defaults.full_name);
  const [username, setUsername] = useState(defaults.username);
  const [uStatus, setUStatus] = useState<"idle" | "checking" | "ok" | "bad">("idle");
  const [uMsg, setUMsg] = useState("");
  const [avatar, setAvatar] = useState(defaults.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Username real-time tekshirish (debounced)
  useEffect(() => {
    const u = username.trim();
    if (!u || u === defaults.username) {
      setUStatus("idle");
      setUMsg("");
      return;
    }
    setUStatus("checking");
    const t = setTimeout(async () => {
      const res = await checkUsernameAction(u);
      if (res.available) {
        setUStatus("ok");
        setUMsg("Bu username bo'sh ✓");
      } else {
        setUStatus("bad");
        setUMsg(res.error ?? "Bu username band");
      }
    }, 400);
    return () => clearTimeout(t);
  }, [username, defaults.username]);

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr("");
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      setAvatar(url);
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : "Rasm yuklanmadi.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="space-y-7">
      {/* Avatar — fayl/galereyadan yuklash */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border border-gray-100"
          title="Rasmni o'zgartirish"
        >
          <Image
            src={avatar || avatarFallback(name || "Zikra")}
            alt="Avatar"
            width={72}
            height={72}
            className="h-[72px] w-[72px] object-cover"
            unoptimized
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
            {uploading ? "..." : "O'zgartirish"}
          </span>
        </button>
        <div className="flex-1">
          <label className="label">Profil rasmi — ixtiyoriy</label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-outline"
          >
            {uploading ? "Yuklanmoqda..." : "📷 Rasm tanlash (galereya/fayl)"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarFile}
            className="hidden"
          />
          {uploadErr && (
            <p className="mt-1 text-xs text-accent-700">{uploadErr}</p>
          )}
        </div>
        {/* Server action uchun yashirin maydon */}
        <input type="hidden" name="avatar_url" value={avatar} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className="label">
            Ism *
          </label>
          <input
            id="full_name"
            name="full_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="To'liq ismingiz"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="city" className="label">
            Shahar
          </label>
          <input
            id="city"
            name="city"
            defaultValue={defaults.city}
            placeholder="Masalan: Toshkent"
            className="input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="username" className="label">
          Username — ixtiyoriy (@ bilan ulashiladi)
        </label>
        <div className="flex items-center">
          <span className="rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-800">
            @
          </span>
          <input
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
            placeholder="azizkarimov"
            maxLength={20}
            className="input rounded-l-none"
          />
        </div>
        {uMsg && (
          <p
            className={`mt-1 text-xs ${
              uStatus === "ok" ? "text-success-700" : "text-accent-700"
            }`}
          >
            {uStatus === "checking" ? "Tekshirilmoqda..." : uMsg}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="label">
          Qisqa bio
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={defaults.bio}
          rows={3}
          placeholder="O'zingiz haqingizda bir-ikki gap..."
          className="input resize-none"
        />
      </div>

      {/* Teach */}
      <div className="rounded-2xl border border-success-100 bg-success-50/40 p-4">
        <h3 className="mb-1 flex items-center gap-2 font-semibold text-success-700">
          <span>🎓</span> Men o&apos;rgata olaman
        </h3>
        <p className="mb-3 text-xs text-gray-500">
          Boshqalarga qaysi ko&apos;nikmalarni o&apos;rgata olasiz?
        </p>
        <SkillSelector
          allSkills={skills}
          selected={teach}
          onChange={setTeach}
          variant="teach"
        />
        <input type="hidden" name="teach_skills" value={teach.join(",")} />
      </div>

      {/* Learn */}
      <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
        <h3 className="mb-1 flex items-center gap-2 font-semibold text-brand-700">
          <span>📚</span> Men o&apos;rganmoqchiman
        </h3>
        <p className="mb-3 text-xs text-gray-500">
          Qaysi ko&apos;nikmalarni o&apos;rganishni xohlaysiz?
        </p>
        <SkillSelector
          allSkills={skills}
          selected={learn}
          onChange={setLearn}
          variant="learn"
        />
        <input type="hidden" name="learn_skills" value={learn.join(",")} />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Saqlanmoqda...">
        Profilni saqlash va boshlash
      </SubmitButton>
    </form>
  );
}
