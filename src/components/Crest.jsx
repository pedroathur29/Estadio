import { useId } from 'react';
import { TEAMS } from '../data/matches';

const SHIELD = 'M50 4 L92 16 L92 52 C92 78 72 94 50 104 C28 94 8 78 8 52 L8 16 Z';

function Pattern({ type, color }) {
  switch (type) {
    case 'stripes':
      return [20, 40, 60, 80].map((x) => <rect key={x} x={x - 5} y="0" width="10" height="110" fill={color} />);
    case 'chevron':
      return <path d="M0 30 L50 62 L100 30 L100 52 L50 84 L0 52 Z" fill={color} />;
    case 'half':
      return <rect x="50" y="0" width="50" height="110" fill={color} />;
    case 'band':
      return <path d="M0 70 L100 20 L100 44 L0 94 Z" fill={color} />;
    case 'cross':
      return (
        <>
          <rect x="42" y="0" width="16" height="110" fill={color} />
          <rect x="0" y="40" width="100" height="16" fill={color} />
        </>
      );
    default:
      return null;
  }
}

export default function Crest({ team, size = 56 }) {
  const t = typeof team === 'string' ? TEAMS[team] : team;
  const id = useId().replace(/:/g, '');
  return (
    <svg
      className="crest"
      width={size}
      height={size * 1.08}
      viewBox="0 0 100 108"
      role="img"
      aria-label={`Escudo do ${t.name}`}
    >
      <defs>
        <clipPath id={`c${id}`}>
          <path d={SHIELD} />
        </clipPath>
        <linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#c${id})`}>
        <rect width="100" height="110" fill={t.secondary} />
        <Pattern type={t.pattern} color={t.primary} />
        <rect width="100" height="110" fill={`url(#g${id})`} />
      </g>
      <path d={SHIELD} fill="none" stroke={t.primary} strokeWidth="4" />
      <path d={SHIELD} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1" transform="translate(50 54) scale(0.9) translate(-50 -54)" />
      <circle cx="50" cy="50" r="19" fill={t.secondary} stroke={t.primary} strokeWidth="3" />
      <text
        x="50"
        y="51"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Barlow Condensed, sans-serif"
        fontWeight="800"
        fontSize="26"
        fill={t.primary}
      >
        {t.mark}
      </text>
    </svg>
  );
}
