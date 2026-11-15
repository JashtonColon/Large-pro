// The castle gate that slams down when someone tries to log in with a
// non-UCF email. Change playKey (e.g. add 1) to play it again.

const COLUMNS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const ROWS = [0, 1, 2, 3, 4, 5];

export default function GateBlock({ playKey }: { playKey: number }) {
  if (playKey === 0) return null;

  return (
    <div key={playKey} className="gate-overlay" role="alert">
      <div className="gate-dim" />
      <div className="gate-drop">
        <svg className="gate-bars" viewBox="0 0 400 300" preserveAspectRatio="none">
          {ROWS.map((r) => {
            const y = ((r + 0.5) * 282) / ROWS.length;
            return (
              <g key={`row-${r}`}>
                <rect x="0" y={y - 6} width="400" height="12" fill="#3B3F44" />
                <rect x="0" y={y - 6} width="400" height="3" fill="#5A6066" />
              </g>
            );
          })}
          {COLUMNS.map((c) => {
            const x = ((c + 0.5) * 400) / COLUMNS.length;
            return (
              <g key={`col-${c}`}>
                <rect x={x - 6} y="0" width="12" height="282" fill="#3B3F44" />
                <rect x={x - 6} y="0" width="3" height="282" fill="#5A6066" />
                <path d={`M${x - 6} 282 L${x + 6} 282 L${x} 300 Z`} fill="#3B3F44" />
              </g>
            );
          })}
        </svg>
        <div className="halt-sign">
          <strong>HALT, TRAVELER!</strong>
          <span>Only @ucf.edu Knights may enter the castle.</span>
        </div>
      </div>
    </div>
  );
}
