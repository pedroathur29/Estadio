import { useMemo } from 'react';
import Crest from './Crest';
import { GATES_OPEN_MS, gateFor } from '../data/content';
import { MATCH_BY_ID, TEAMS, VENUE } from '../data/matches';
import { SECTOR_BY_ID } from '../data/sectors';
import { fmtShort, fmtTime, money } from '../lib/format';
import { seeded } from '../lib/rng';

/** Decorative QR-like pattern (not a real, scannable code). */
function FakeCode({ seed }) {
  const cells = useMemo(() => {
    const r = seeded(seed);
    const n = 21;
    const out = [];
    const finder = (x, y) =>
      [[0, 0], [n - 7, 0], [0, n - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) if (!finder(x, y) && r() > 0.52) out.push([x, y]);
    return out;
  }, [seed]);
  const finder = (x, y) => (
    <g transform={`translate(${x} ${y})`}>
      <rect width="7" height="7" fill="#101a33" />
      <rect x="1" y="1" width="5" height="5" fill="#fff" />
      <rect x="2" y="2" width="3" height="3" fill="#101a33" />
    </g>
  );
  return (
    <svg viewBox="-1 -1 23 23" className="fakecode" role="img" aria-label="Código ilustrativo do ingresso (não válido)">
      <rect x="-1" y="-1" width="23" height="23" fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#101a33" />
      ))}
      {finder(0, 0)}
      {finder(14, 0)}
      {finder(0, 14)}
    </svg>
  );
}

/** One issued (demonstration) ticket of an order. */
export default function PassTicket({ order, line }) {
  const m = MATCH_BY_ID[order.matchId];
  const sector = SECTOR_BY_ID[order.sectorId];
  const home = TEAMS[m.home];
  const away = TEAMS[m.away];
  const date = new Date(order.matchDate);
  return (
    <article className="ticket">
      <div className="tk-main">
        <div className="tk-teams">
          <Crest team={home} size={34} />
          <strong>
            {home.short} × {away.short}
          </strong>
          <Crest team={away} size={34} />
        </div>
        <p className="tk-meta">
          {m.competition}, {fmtShort(date)} às {fmtTime(date)}
        </p>
        <dl className="tk-grid">
          <div><dt>Setor</dt><dd>{sector.code}</dd></div>
          <div><dt>Fila</dt><dd>{line.row}</dd></div>
          <div><dt>Assento</dt><dd>{line.num}</dd></div>
          <div><dt>Portão</dt><dd>{gateFor(sector).id}</dd></div>
          <div><dt>Abertura</dt><dd>{fmtTime(new Date(date.getTime() - GATES_OPEN_MS))}</dd></div>
          <div><dt>{line.type === 'meia' ? 'Meia' : 'Inteira'}</dt><dd>{money(line.value)}</dd></div>
        </dl>
        <p className="tk-meta">
          {sector.name}, {VENUE.name}
        </p>
      </div>
      <div className="tk-stub">
        <FakeCode seed={`${order.code}-${line.key}`} />
        <span className="tk-code">{order.code}</span>
        <span className="tk-void">Ingresso demonstrativo, sem validade</span>
      </div>
    </article>
  );
}
