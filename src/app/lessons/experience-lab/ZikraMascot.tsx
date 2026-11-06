"use client";

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
        .mascot-body { transform-origin: 74px 128px; animation: mascot-breathe 3s ease-in-out infinite; }
        .mascot-tail { transform-origin: 112px 112px; animation: mascot-tail 1.2s ease-in-out infinite alternate; }
        .mascot-mood-0 .mascot-body,.mascot-mood-7 .mascot-body { animation: mascot-hop 1.8s ease-in-out infinite; }
        .mascot-mood-4 .mascot-head { transform-origin: 74px 72px; animation: mascot-think 2.8s ease-in-out infinite; }
        .mascot-blink { animation: mascot-blink 4.8s infinite; transform-origin: center; }
        @keyframes mascot-breathe { 50% { transform: translateY(-3px); } }
        @keyframes mascot-hop { 45% { transform: translateY(-9px) rotate(-2deg); } }
        @keyframes mascot-think { 50% { transform: rotate(5deg) translateY(-2px); } }
        @keyframes mascot-tail { to { transform: rotate(17deg); } }
        @keyframes mascot-blink { 0%,45%,48%,100% { transform: scaleY(1); } 46.5% { transform: scaleY(.12); } }
        @media(prefers-reduced-motion:reduce) { .zikra-mascot * { animation:none!important; } }
      `}</style>
      <svg viewBox="0 0 148 166" className="h-full w-full" fill="none" aria-hidden="true">
        <ellipse cx="75" cy="157" rx="39" ry="6" fill="#0b5b4d" opacity=".12" />
        <g className="mascot-body">
          <path className="mascot-tail" d="M105 119c23 5 33-7 27-20-4-8-14-8-17 0" stroke="#F1E7D8" strokeWidth="13" strokeLinecap="round"/>
          <path d="M48 111c-15 4-18 17-10 21 8 4 16-2 19-10M94 111c15 4 18 17 10 21-8 4-16-2-19-10" fill="#F6EBDD" stroke="#D8C9B7" strokeWidth="2"/>
          <path d="M48 105c-7 9-8 26-3 39h60c5-13 4-30-3-39-12-11-42-11-54 0Z" fill="#075B4E"/>
          <path d="M58 111c3 10 9 16 17 16s14-6 17-16" stroke="#138A76" strokeWidth="3" strokeLinecap="round"/>
          <path d="M74 116v13m-6-7 6 7 6-7" stroke="#D8FFF0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M58 140c-2 7-1 12 6 12h10m16-12c2 7 1 12-6 12H74" fill="#F2E6D7" stroke="#D8C9B7" strokeWidth="2"/>
          <path d="M42 32 34 12c-2-6 5-10 10-6l21 17m28 9 8-20c2-6-5-10-10-6L70 25" fill="#F7EEE2" stroke="#D9CABB" strokeWidth="2.5" strokeLinejoin="round"/>
          <path d="m43 17 12 14-16-4Zm55 0L86 31l16-4Z" fill="#F4A2B3"/>
          <g className="mascot-head">
            <path d="M27 58c0-27 20-43 47-43s47 16 47 43v23c0 28-20 43-47 43S27 109 27 81V58Z" fill="#FFF9F0" stroke="#D9CABB" strokeWidth="2.5"/>
            <path d="M34 58c3-19 18-31 40-31s37 12 40 31" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round"/>
            <ellipse cx="56" cy="72" rx="9" ry="12" fill="#153C35" className="mascot-blink"/>
            <ellipse cx="93" cy="72" rx="9" ry="12" fill="#153C35" className="mascot-blink"/>
            <ellipse cx="58" cy="69" rx="3" ry="4" fill="white"/><ellipse cx="95" cy="69" rx="3" ry="4" fill="white"/>
            <ellipse cx="44" cy="88" rx="8" ry="5" fill="#F7B8B7" opacity=".55"/><ellipse cx="105" cy="88" rx="8" ry="5" fill="#F7B8B7" opacity=".55"/>
            <path d="m69 86 5 4 5-4" fill="#E98E9B" stroke="#C77D83" strokeWidth="1.5" strokeLinejoin="round"/>
            {happy ? <path d="M67 96c4 7 12 7 16 0" stroke="#754C48" strokeWidth="2.5" strokeLinecap="round"/> : thinking ? <path d="M69 99c4-2 8-2 12 0" stroke="#754C48" strokeWidth="2.5" strokeLinecap="round"/> : <path d="M68 97c4 4 10 4 14 0" stroke="#754C48" strokeWidth="2.5" strokeLinecap="round"/>}
            <path d="M27 78 10 74m18 22-17 3m110-21 17-4m-18 22 17 3" stroke="#C6B9AA" strokeWidth="1.8" strokeLinecap="round"/>
          </g>
          <path d="M105 111c8-1 13 4 13 10-1 7-9 9-15 3" fill="#F4E8DA" stroke="#D9CABB" strokeWidth="2"/>
        </g>
        {mood === 7 && <g fill="#F6C65D"><path d="m17 25 3-7 4 7 7 3-7 4-4 7-3-7-7-4 7-3Z"/><path d="m124 35 3-6 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z"/></g>}
        {mood === 4 && <circle cx="119" cy="20" r="7" fill="#F6C65D" />}
      </svg>
    </div>
  );
}
