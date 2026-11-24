import { useMemo } from 'react';
import { Header, Steps } from '../components/Chrome';
import Crest from '../components/Crest';
import { SECTOR_BY_ID } from '../data/sectors';
import { MATCH_BY_ID, TEAMS, VENUE } from '../data/matches';
import { fmtShort, fmtTime, money } from '../lib/format';
import { seeded } from '../lib/rng';
import { useStore } from '../store';

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
  const Finder = ({ x, y }) => (
    <g transform={`translate(${x} ${y})`}>
      <rect width="7" height="7" fill="#07090f" />
      <rect x="1" y="1" width="5" height="5" fill="#fff" />
      <rect x="2" y="2" width="3" height="3" fill="#07090f" />
    </g>
  );
  return (
    <svg viewBox="-1 -1 23 23" className="fakecode" role="img" aria-label="Código ilustrativo do ingresso (não válido)">
      <rect x="-1" y="-1" width="23" height="23" fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#07090f" />
      ))}
      <Finder x={0} y={0} />
      <Finder x={14} y={0} />
      <Finder x={0} y={14} />
    </svg>
  );
}

export default function ConfirmPage() {
  const order = useStore((s) => s.order);
  const restart = useStore((s) => s.restart);
  const openMatch = useStore((s) => s.openMatch);
  if (!order) return null;
  const m = MATCH_BY_ID[order.matchId];
  const sector = SECTOR_BY_ID[order.sectorId];
  const home = TEAMS[m.home];
  const away = TEAMS[m.away];

  return (
    <>
      <Header />
      <main className="flow wrap">
        <div className="flow-head">
          <span />
          <Steps current={3} />
        </div>

        <section className="confirm">
          <div className="check" aria-hidden="true">
            <svg viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="24" />
              <path d="M15 27l7 7 15-16" />
            </svg>
          </div>
          <span className="kicker">Pedido confirmado (simulação)</span>
          <h1>Pedido simulado com sucesso!</h1>
          <p className="muted">
            Pedido <b className="mono">{order.code}</b> · {order.lines.length} ingresso{order.lines.length > 1 ? 's' : ''} · total de{' '}
            <b>{money(order.total)}</b>
          </p>

          <div className="tickets">
            {order.lines.map((l, i) => (
              <article className="ticket" key={l.key} style={{ '--i': i }}>
                <div className="tk-main">
                  <div className="tk-top">
                    <span className="tk-comp">{m.competition}</span>
                    <span className="tk-type">{l.type === 'meia' ? 'Meia-entrada' : 'Inteira'}</span>
                  </div>
                  <div className="tk-teams">
                    <Crest team={home} size={30} />
                    <strong>
                      {home.short} × {away.short}
                    </strong>
                    <Crest team={away} size={30} />
                  </div>
                  <div className="tk-grid">
                    <div><span>Data</span><b>{fmtShort(m.date)}</b></div>
                    <div><span>Abertura</span><b>{fmtTime(new Date(m.date.getTime() - 2 * 3600000))}</b></div>
                    <div><span>Setor</span><b>{sector.code}</b></div>
                    <div><span>Fila</span><b>{l.row}</b></div>
                    <div><span>Assento</span><b>{l.num}</b></div>
                    <div><span>Valor</span><b>{money(l.value)}</b></div>
                  </div>
                  <span className="tk-venue">{VENUE.name} · {sector.name}</span>
                </div>
                <div className="tk-stub">
                  <FakeCode seed={`${order.code}-${l.key}`} />
                  <span className="tk-void">Ingresso demonstrativo · sem validade</span>
                </div>
              </article>
            ))}
          </div>

          <div className="confirm-actions">
            <button className="btn btn-primary" onClick={restart}>
              Voltar ao início
            </button>
            <button className="btn btn-ghost" onClick={() => openMatch(order.matchId)}>
              Explorar o estádio novamente
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
