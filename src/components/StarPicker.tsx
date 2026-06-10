"use client";

import { useState } from "react";

export default function StarPicker({
  value,
  onChange,
  size = 32,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
            aria-label={`${n} yulduz`}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={active ? "#FBBF24" : "#E5E7EB"}
            >
              <path d="M12 2l2.9 6.26L21.5 9l-5 4.87L17.8 21 12 17.27 6.2 21l1.3-7.13-5-4.87 6.6-.74L12 2z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
