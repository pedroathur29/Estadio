import { useMemo } from 'react';
import { SECTORS, viewpoint } from '../data/sectors';
import { sectorStatus } from '../data/matches';
import { sampleRange, edgeAt, LOWER, OUTER_D, HX, HZ } from '../lib/geometry';

const BANDS = {
  lower: [0.35, LOWER.dEnd - 0.4],
  box: [LOWER.dEnd - 0.2, LOWER.dEnd + 1.1],
  upper: [LOWER.dEnd + 1.4, OUTER_D],
};

// top-down: North (−X) up, East (−Z) right
const P = (x, z) => [-z, x];

function polygon(sector) {
  const [s0, s1] = sector.range;
  const [d0, d1] = BANDS[sector.tier];
  const ss = sampleRange(s0, s1, 2);
  const inner = ss.map((s) => {
    const e = edgeAt(s);
    return P(e.x + e.nx * d0, e.z + e.nz * d0);
  });
  const outer = ss
    .map((s) => {
      const e = edgeAt(s);
      return P(e.x + e.nx * d1, e.z + e.nz * d1);
    })
    .reverse();
  return [...inner, ...outer].map((p) => p.map((v) => v.toFixed(2)).join(',')).join(' ');
}

export default function MiniMap({ matchId, selectedId, hoveredId, onSelect, onHover, showCone = false, className = '' }) {
  const shapes = useMemo(() => SECTORS.map((s) => ({ s, points: polygon(s) })), []);
  const cone = useMemo(() => {
    if (!showCone || !selectedId) return null;
    const sector = SECTORS.find((s) => s.id === selectedId);
    const vp = viewpoint(sector);
    const [ex, ey] = P(vp.eye[0], vp.eye[2]);
    // a wedge looking towards the pitch centre
    const ang = Math.atan2(-ey, -ex);
    const spread = 0.55;
    const len = 75;
    const a = [ex + Math.cos(ang - spread) * len, ey + Math.sin(ang - spread) * len];
    const b = [ex + Math.cos(ang + spread) * len, ey + Math.sin(ang + spread) * len];
    return { ex, ey, a, b };
  }, [showCone, selectedId]);

  const pw = 105;
  const pd = 68;
  return (
    <svg className={`minimap ${className}`} viewBox="-78 -96 156 192" role="img" aria-label="Mapa dos setores do estádio">
      <defs>
        <clipPath id="mm-clip">
          <rect x={-HZ} y={-HX} width={HZ * 2} height={HX * 2} rx="14" />
        </clipPath>
        <radialGradient id="mm-cone">
          <stop offset="0" stopColor="#c8ff2e" stopOpacity="0.55" />
          <stop offset="1" stopColor="#c8ff2e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={-HZ} y={-HX} width={HZ * 2} height={HX * 2} rx="14" className="mm-grass" />
      <g className="mm-lines">
        <rect x={-pd / 2} y={-pw / 2} width={pd} height={pw} />
        <line x1={-pd / 2} x2={pd / 2} y1="0" y2="0" />
        <circle r="9.15" />
        <rect x={-20.16} y={-pw / 2} width={40.32} height={16.5} />
        <rect x={-20.16} y={pw / 2 - 16.5} width={40.32} height={16.5} />
      </g>
      {cone && (
        <g clipPath="url(#mm-clip)">
          <path d={`M${cone.ex},${cone.ey} L${cone.a[0]},${cone.a[1]} L${cone.b[0]},${cone.b[1]} Z`} fill="url(#mm-cone)" />
        </g>
      )}
      {shapes.map(({ s, points }) => {
        const st = matchId ? sectorStatus(matchId, s.id) : { soldOut: false };
        const cls = [
          'mm-sector',
          st.soldOut ? 'is-soldout' : s.kind === 'vip' ? 'is-vip' : '',
          selectedId === s.id ? 'is-selected' : '',
          hoveredId === s.id ? 'is-hovered' : '',
          onSelect ? 'is-clickable' : '',
        ].join(' ');
        return (
          <polygon
            key={s.id}
            points={points}
            className={cls}
            onClick={onSelect ? () => onSelect(s.id) : undefined}
            onMouseEnter={onHover ? () => onHover(s.id) : undefined}
            onMouseLeave={onHover ? () => onHover(null) : undefined}
          >
            <title>{s.name}</title>
          </polygon>
        );
      })}
      {cone && <circle cx={cone.ex} cy={cone.ey} r="2.6" className="mm-you" />}
      <g className="mm-compass">
        <text x="0" y="-89">N</text>
        <text x="0" y="93">S</text>
        <text x="73" y="2">L</text>
        <text x="-73" y="2">O</text>
      </g>
    </svg>
  );
}
