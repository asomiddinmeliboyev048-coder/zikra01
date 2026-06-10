"use client";

import { useMemo, useState } from "react";
import type { ProfileWithSkills, Skill } from "@/lib/types";
import UserCard from "@/components/UserCard";

export default function DiscoveryClient({
  profiles,
  skills,
}: {
  profiles: ProfileWithSkills[];
  skills: Skill[];
}) {
  const [query, setQuery] = useState("");
  const [skillId, setSkillId] = useState("");
  const [city, setCity] = useState("");
  const [onlyMatches, setOnlyMatches] = useState(false);

  const cities = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach((p) => p.city && set.add(p.city));
    return Array.from(set).sort();
  }, [profiles]);

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      // Matn qidiruvi (ism yoki bio)
      if (query.trim()) {
        const q = query.toLowerCase();
        const inName = p.full_name.toLowerCase().includes(q);
        const inBio = (p.bio ?? "").toLowerCase().includes(q);
        const inSkills = [...p.teach_skills, ...p.learn_skills].some((s) =>
          s.name.toLowerCase().includes(q)
        );
        if (!inName && !inBio && !inSkills) return false;
      }
      // Ko'nikma filtri (teach yoki learn da bor)
      if (skillId) {
        const has = [...p.teach_skills, ...p.learn_skills].some(
          (s) => s.id === skillId
        );
        if (!has) return false;
      }
      // Shahar filtri
      if (city && p.city !== city) return false;
      // Faqat mosliklar
      if (onlyMatches && (p.match_score ?? 0) === 0) return false;
      return true;
    });
  }, [profiles, query, skillId, city, onlyMatches]);

  return (
    <div>
      {/* Filtrlar */}
      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ism yoki ko'nikma bo'yicha qidiring..."
          className="input flex-1"
        />
        <select
          value={skillId}
          onChange={(e) => setSkillId(e.target.value)}
          className="input sm:w-44"
        >
          <option value="">Barcha ko&apos;nikmalar</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="input sm:w-40"
        >
          <option value="">Barcha shaharlar</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-gray-600">
          <input
            type="checkbox"
            checked={onlyMatches}
            onChange={(e) => setOnlyMatches(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
          />
          Faqat mosliklar
        </label>
      </div>

      {/* Natijalar */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-16 text-center">
          <span className="text-4xl">🔍</span>
          <p className="font-medium text-gray-700">Hech kim topilmadi</p>
          <p className="text-sm text-gray-500">
            Filtrlarni o&apos;zgartirib ko&apos;ring.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">
            {filtered.length} ta foydalanuvchi topildi
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <UserCard key={p.id} profile={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
