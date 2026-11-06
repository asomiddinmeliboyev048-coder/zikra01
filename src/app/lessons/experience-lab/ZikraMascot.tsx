"use client";

import Image from "next/image";

type Props = { mood: number };

export default function ZikraMascot({ mood }: Props) {
  const happy = mood === 0 || mood === 7;
  const thinking = mood === 4;

  return (
    <div
      className={`zikra-mascot mascot-mood-${mood} relative h-[142px] w-[132px] shrink-0 sm:h-[160px] sm:w-[148px]`}
      role="img"
      aria-label="Zikra mushukchasi"
    >
      <style jsx>{`
        .zikra-mascot { filter: drop-shadow(0 12px 14px #075b4b20); }
        .mascot-art { animation: mascot-breathe 3s ease-in-out infinite; transform-origin: 50% 85%; }
        .mascot-mood-0 .mascot-art,.mascot-mood-7 .mascot-art { animation: mascot-hop 1.8s ease-in-out infinite; }
        .mascot-mood-1 .mascot-art,.mascot-mood-2 .mascot-art { animation: mascot-wave 2.6s ease-in-out infinite; }
        .mascot-mood-4 .mascot-art { animation: mascot-think 2.8s ease-in-out infinite; }
        .mascot-mood-3 .mascot-art,.mascot-mood-5 .mascot-art,.mascot-mood-6 .mascot-art { animation: mascot-breathe 3s ease-in-out infinite; }
        @keyframes mascot-breathe { 50% { transform: translateY(-4px); } }
        @keyframes mascot-hop { 45% { transform: translateY(-10px) rotate(-2deg); } }
        @keyframes mascot-wave { 50% { transform: translateY(-5px) rotate(3deg); } }
        @keyframes mascot-think { 50% { transform: translateY(-3px) rotate(4deg); } }
        @media(prefers-reduced-motion:reduce) { .mascot-art { animation:none!important; } }
      `}</style>
      <Image
        src="/zikra-mascot.webp"
        alt={happy ? "Zikra mushukchasi quvonch bilan salom bermoqda" : thinking ? "Zikra mushukchasi o‘ylamoqda" : "Zikra mushukchasi"}
        width={180}
        height={260}
        priority={mood === 0}
        draggable={false}
        className="mascot-art h-full w-full select-none object-contain"
        sizes="(max-width: 640px) 132px, 148px"
      />
    </div>
  );
}
