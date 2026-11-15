// Animated background: sky, drifting clouds, grassy hills and a castle with
// a waving flag. Pure SVG + CSS (animations live in index.css).

const MERLON_INDEXES = [0, 1, 2, 3, 4];

function merlons(x0: number, x1: number, top: number, height: number) {
  const width = (x1 - x0) / 9;
  return MERLON_INDEXES.map((i) => (
    <rect
      key={`${x0}-${i}`}
      x={x0 + i * 2 * width}
      y={top - height}
      width={width}
      height={height + 1}
    />
  ));
}

function Cloud({ className }: { className: string }) {
  return (
    <svg className={`scene-cloud ${className}`} viewBox="0 0 200 100">
      <g fill="#ffffff" opacity="0.9">
        <circle cx="100" cy="50" r="38" />
        <circle cx="140" cy="58" r="30" />
        <circle cx="62" cy="60" r="27" />
        <rect x="40" y="55" width="125" height="30" rx="15" />
      </g>
    </svg>
  );
}

function Tower({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="72" width="52" height="158" fill="#B8C1C4" />
      <rect x={x + 37} y="72" width="15" height="158" fill="#9DA7AB" />
      <rect x={x - 4} y="70" width="60" height="10" fill="#B8C1C4" />
      <g fill="#B8C1C4">{merlons(x - 4, x + 56, 72, 15)}</g>
      <rect className="scene-window" x={x + 18} y="103" width="16" height="24" rx="8" />
    </g>
  );
}

export default function CastleScene() {
  return (
    <div className="castle-scene" aria-hidden="true">
      <Cloud className="cloud-1" />
      <Cloud className="cloud-2" />
      <Cloud className="cloud-3" />
      <Cloud className="cloud-4" />

      <svg className="scene-hills" viewBox="0 0 1000 200" preserveAspectRatio="none">
        <path d="M0 50 Q250 10 500 44 T1000 24 V200 H0 Z" fill="#8BD650" />
        <path d="M0 80 Q400 46 1000 86 V200 H0 Z" fill="#BDF56A" />
      </svg>

      <svg className="scene-castle" viewBox="0 -20 240 300">
        <defs>
          <clipPath id="castle-gate-clip">
            <path d="M86 230 V193 A24 24 0 0 1 134 193 V230 Z" />
          </clipPath>
        </defs>

        {/* Winding road from the gate */}
        <path
          d="M110 230 C 100 262, 10 250, -60 275 S -200 300, -320 330"
          stroke="#AEB4B7"
          strokeWidth="18"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M110 230 C 100 262, 10 250, -60 275 S -200 300, -320 330"
          stroke="#C9CED0"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Main wall */}
        <rect x="41" y="118" width="138" height="112" fill="#B8C1C4" />
        <g fill="#B8C1C4">{merlons(41, 179, 118, 14)}</g>

        <Tower x={10} />
        <Tower x={158} />

        {/* Gate with portcullis */}
        <path d="M86 230 V193 A24 24 0 0 1 134 193 V230 Z" fill="#2F3437" />
        <g clipPath="url(#castle-gate-clip)" stroke="#111416" strokeWidth="2.5">
          <line x1="98" y1="169" x2="98" y2="230" />
          <line x1="110" y1="169" x2="110" y2="230" />
          <line x1="122" y1="169" x2="122" y2="230" />
          <line x1="86" y1="184" x2="134" y2="184" />
          <line x1="86" y1="199" x2="134" y2="199" />
          <line x1="86" y1="215" x2="134" y2="215" />
        </g>
        <path
          d="M86 230 V193 A24 24 0 0 1 134 193 V230 Z"
          fill="none"
          stroke="#111416"
          strokeWidth="2"
        />

        {/* Flag */}
        <line x1="184" y1="57" x2="184" y2="-8" stroke="#1F2224" strokeWidth="2.5" strokeLinecap="round" />
        <path
          className="scene-flag"
          d="M184 -8 L230 -4 L230 18 L184 14 Z"
          fill="#FFC904"
          stroke="#1F2224"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
