"use client";

import { useRouter } from "next/navigation";
import type { Skill } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function VideoFilter({
  skills,
  active,
}: {
  skills: Skill[];
  active: string;
}) {
  const router = useRouter();

  function select(id: string) {
    router.push(id ? `/videos?skill=${id}` : "/videos");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => select("")}
        className={cn(
          "rounded-full border px-3 py-1.5 text-xs font-medium transition",
          !active
            ? "border-brand bg-brand text-white"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
        )}
      >
        Barchasi
      </button>
      {skills.map((s) => (
        <button
          key={s.id}
          onClick={() => select(s.id)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition",
            active === s.id
              ? "border-brand bg-brand text-white"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
          )}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
