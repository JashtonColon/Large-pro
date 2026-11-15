// Page transitions that match the mobile app. Use instead of navigate():
//
//   const go = useCastleNavigate();
//   go("/verify-email", "scroll", { state: { email } });
//
// The overlay covers the screen, the route changes underneath, then the
// overlay reveals the new page. Effects:
//   scroll   - sign up -> verify email (a parchment scroll with a wax seal)
//   sword    - verify  -> log in      (a sword cuts the page in two)
//   fireball - log in  -> the board  (a fireball, then the page rises from smoke)
//   doors    - log out               (castle doors close, then open)

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, type NavigateOptions } from "react-router-dom";

export type CastleEffect = "scroll" | "sword" | "fireball" | "doors";

type Go = (to: string, effect: CastleEffect, options?: NavigateOptions) => void;

// How long each effect covers the screen, then how long the reveal takes (ms).
const TIMING: Record<CastleEffect, { cover: number; reveal: number }> = {
  scroll: { cover: 2600, reveal: 900 },
  sword: { cover: 1300, reveal: 1100 },
  fireball: { cover: 1300, reveal: 1300 },
  doors: { cover: 1900, reveal: 1000 },
};

const GoContext = createContext<Go | null>(null);

export function useCastleNavigate(): Go {
  const go = useContext(GoContext);
  const navigate = useNavigate();
  // Outside the provider (shouldn't happen) fall back to a plain navigation.
  return go ?? ((to, _effect, options) => navigate(to, options));
}

type Run = { effect: CastleEffect; phase: "cover" | "reveal"; key: number };

export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [run, setRun] = useState<Run | null>(null);
  const busy = useRef(false);

  const go = useCallback<Go>(
    (to, effect, options) => {
      if (busy.current) return;
      busy.current = true;
      const { cover, reveal } = TIMING[effect];
      setRun({ effect, phase: "cover", key: Date.now() });
      window.setTimeout(() => {
        navigate(to, options);
        window.scrollTo(0, 0);
        setRun((r) => (r ? { ...r, phase: "reveal" } : r));
      }, cover);
      window.setTimeout(() => {
        setRun(null);
        busy.current = false;
      }, cover + reveal);
    },
    [navigate],
  );

  return (
    <GoContext.Provider value={go}>
      {children}
      {run && <Overlay key={run.key} effect={run.effect} phase={run.phase} />}
    </GoContext.Provider>
  );
}

function Overlay({ effect, phase }: { effect: CastleEffect; phase: Run["phase"] }) {
  const cls = `castle-tr tr-${effect} tr-${phase}`;

  if (effect === "scroll") {
    return (
      <div className={cls} aria-hidden="true">
        <div className="tr-scroll-sheet">
          <div className="tr-scroll-rod top" />
          <div className="tr-scroll-body">
            <p className="tr-scroll-title">A Summons Has Been Sent</p>
            <p className="tr-scroll-text">Check your UCF inbox for your 6-digit code, brave Knight.</p>
            <div className="tr-seal">K</div>
          </div>
          <div className="tr-scroll-rod bottom" />
        </div>
      </div>
    );
  }

  if (effect === "sword") {
    return (
      <div className={cls} aria-hidden="true">
        <div className="tr-half left" />
        <div className="tr-half right" />
        <div className="tr-slash" />
        <svg className="tr-sword" viewBox="0 0 40 220">
          <path d="M20 4 L28 20 L28 150 L12 150 L12 20 Z" fill="#E6ECEF" stroke="#7A8790" strokeWidth="2" />
          <line x1="20" y1="18" x2="20" y2="148" stroke="#B5C0C6" strokeWidth="2" />
          <rect x="0" y="150" width="40" height="9" rx="3" fill="#FFC904" stroke="#6B4A00" strokeWidth="2" />
          <rect x="15" y="159" width="10" height="44" rx="3" fill="#6B4423" />
          <circle cx="20" cy="209" r="8" fill="#FFC904" stroke="#6B4A00" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  if (effect === "fireball") {
    return (
      <div className={cls} aria-hidden="true">
        <div className="tr-fire-fill" />
        <div className="tr-fireball" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <span key={i} className={`tr-smoke s${i}`} />
        ))}
      </div>
    );
  }

  return (
    <div className={cls} aria-hidden="true">
      <div className="tr-door left" />
      <div className="tr-door right" />
      <p className="tr-farewell">Farewell, Knight!</p>
    </div>
  );
}
