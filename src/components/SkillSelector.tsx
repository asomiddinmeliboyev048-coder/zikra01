"use client";

import { useMemo, useState } from "react";
import type { Skill } from "@/lib/types";
import { createSkillAction } from "@/app/actions/profile";

interface Props {
  allSkills: Skill[];
  selected: string[];
  onChange: (ids: string[]) => void;
  variant: "teach" | "learn";
  allowCreate?: boolean;
}

export default function SkillSelector({
  allSkills,
  selected,
  onChange,
  variant,
  allowCreate = true,
}: Props) {
  const [query, setQuery] = useState("");
  const [skills, setSkills] = useState<Skill[]>(allSkills);
  const [creating, setCreating] = useState(false);

  const activeClass =
    variant === "teach"
      ? "bg-success text-white border-success"
      : "bg-brand text-white border-brand";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return skills;
    return skills.filter((s) => s.name.toLowerCase().includes(q));
  }, [query, skills]);

  const exactExists = useMemo(
    () =>
      skills.some((s) => s.name.toLowerCase() === query.trim().toLowerCase()),
    [skills, query]
  );

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  async function handleCreate() {
    const name = query.trim();
    if (!name) return;
    setCreating(true);
    const res = await createSkillAction(name, "Boshqa");
    setCreating(false);
    if (res.id) {
      const newSkill: Skill = {
        id: res.id,
        name,
        category: "Boshqa",
        created_at: new Date().toISOString(),
      };
      if (!skills.some((s) => s.id === res.id)) {
        setSkills((prev) => [...prev, newSkill]);
      }
      if (!selected.includes(res.id)) onChange([...selected, res.id]);
      setQuery("");
    }
  }

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ko'nikma qidiring yoki yangi qo'shing..."
        className="input mb-3"
      />

      <div className="flex flex-wrap gap-2">
        {filtered.map((skill) => {
          const isSelected = selected.includes(skill.id);
          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => toggle(skill.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                isSelected
                  ? activeClass
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
              }`}
            >
              {skill.name}
            </button>
          );
        })}

        {allowCreate && query.trim() && !exactExists && (
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="rounded-full border border-dashed border-accent px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-50"
          >
            {creating ? "Qo'shilmoqda..." : `+ "${query.trim()}" qo'shish`}
          </button>
        )}
      </div>

      {selected.length > 0 && (
        <p className="mt-2 text-xs text-gray-400">
          {selected.length} ta tanlandi
        </p>
      )}
    </div>
  );
}
