"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import type { Skill } from "@/lib/types";
import { saveProfileAction, type ProfileState } from "@/app/actions/profile";
import SkillSelector from "@/components/SkillSelector";
import SubmitButton from "@/components/SubmitButton";
import { avatarFallback } from "@/lib/utils";

const initial: ProfileState = {};

interface Props {
  skills: Skill[];
  defaults: {
    full_name: string;
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
  const [avatar, setAvatar] = useState(defaults.avatar_url);

  return (
    <form action={formAction} className="space-y-7">
      {/* Avatar oldindan ko'rish */}
      <div className="flex items-center gap-4">
        <Image
          src={avatar || avatarFallback(name || "Zikra")}
          alt="Avatar"
          width={72}
          height={72}
          className="h-[72px] w-[72px] rounded-2xl border border-gray-100 object-cover"
          unoptimized
        />
        <div className="flex-1">
          <label htmlFor="avatar_url" className="label">
            Profil rasmi (havola) — ixtiyoriy
          </label>
          <input
            id="avatar_url"
            name="avatar_url"
            type="url"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://... (rasm havolasi)"
            className="input"
          />
        </div>
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
