// The fire-breathing dragon for a wrong password. Change playKey (e.g. add
// 1) to play it again. Animations live in index.css.

import type { CSSProperties } from "react";

const PARTICLES = Array.from({ length: 28 }, (_, i) => {
  const r = Math.sin(i * 12.9898) * 43758.5453;
  const rand = r - Math.floor(r);
  return { id: i, dy: (rand - 0.5) * 50, delay: -(i * 0.6) / 28 };
});

export default function DragonAttack({ playKey }: { playKey: number }) {
  if (playKey === 0) return null;

  return (
    <div key={playKey} className="dragon-overlay" aria-hidden="true">
      <div className="dragon-heat" />
      <div className="dragon-wrap">
        <div className="dragon-fire">
          {PARTICLES.map((p) => (
            <span
              key={p.id}
              className="fire-particle"
              style={
                {
                  "--dy": `${p.dy}vh`,
                  animationDelay: `${p.delay}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <svg className="dragon-svg" viewBox="-15 -5 220 145">
          <g stroke="#3A0A12" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
            <path className="dragon-wing" d="M70 70 L38 8 Q70 18 108 22 Q100 48 104 70 Z" fill="#8C1C2B" />
            <path d="M40 96 Q5 112 2 72 Q14 96 44 82 Z" fill="#D62839" />
            <path d="M0 76 L-12 58 L10 66 Z" fill="#8C1C2B" />
            <rect x="52" y="100" width="16" height="28" rx="7" fill="#D62839" />
            <rect x="92" y="100" width="16" height="28" rx="7" fill="#D62839" />
            <path d="M38 62 L45 47 L52 62 Z M56 62 L63 47 L70 62 Z M74 62 L81 47 L88 62 Z M92 62 L99 47 L106 62 Z" fill="#8C1C2B" />
            <ellipse cx="72" cy="88" rx="52" ry="31" fill="#D62839" />
            <ellipse cx="80" cy="98" rx="32" ry="16" fill="#FFB84D" stroke="none" />
            <path d="M100 80 Q122 72 138 48 L156 58 Q136 86 110 98 Z" fill="#D62839" />
            <path d="M134 30 L118 4 L146 24 Z" fill="#F3E3C3" />
            <path d="M148 24 L146 0 L162 24 Z" fill="#F3E3C3" />
            <ellipse cx="150" cy="42" rx="26" ry="20" fill="#D62839" />
            <rect x="150" y="30" width="48" height="24" rx="11" fill="#D62839" />
          </g>
          <path d="M166 46 L201 40 L201 56 Z" fill="#3A0A12" />
          <path d="M172 46 L176 52 L180 46 Z M182 46 L186 52 L190 46 Z" fill="#ffffff" />
          <circle cx="190" cy="36" r="2.5" fill="#3A0A12" />
          <circle cx="150" cy="34" r="7" fill="#ffffff" />
          <circle cx="152" cy="34" r="3.6" fill="#3A0A12" />
          <line x1="139" y1="22" x2="161" y2="29" stroke="#3A0A12" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
