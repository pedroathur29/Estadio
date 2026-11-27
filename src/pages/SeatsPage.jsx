import { useState } from 'react';
import { Header, Steps } from '../components/Chrome';
import { ContinueButton, PickedSeats, Quantity, Subtotal, ViewSwitch } from '../components/SeatOrder';
import Crest from '../components/Crest';
import MiniMap from '../components/MiniMap';
import { SECTOR_BY_ID, ROW_LETTERS } from '../data/sectors';
import { MATCH_BY_ID, TEAMS } from '../data/matches';
import { seatInfo, useSeatPlan } from '../lib/useSeatPlan';
import { fmtShort, fmtTime, money } from '../lib/format';
import { webglAvailable } from '../lib/webgl';
import { useStore } from '../store';
import Seats3D from './Seats3D';

const BLOCK = 20;

export function OrderAside({ children, title = 'Seu pedido' }) {
  const matchId = useStore((s) => s.matchId);
  const sectorId = useStore((s) => s.sectorId);
  const m = MATCH_BY_ID[matchId];
  const sector = SECTOR_BY_ID[sectorId];
  return (
    <aside className="order-aside">
      <h3>{title}</h3>
      <div className="oa-match">
        <Crest team={m.home} size={28} />
        <Crest team={m.away} size={28} />
        <div>
          <strong>
            {TEAMS[m.home].name} × {TEAMS[m.away].name}
          </strong>
          <span>
            {fmtShort(m.date)} às {fmtTime(m.date)}, Arena Horizonte
          </span>
        </div>
      </div>
      {sector && (
        <div className="oa-sector">
          <span className="label">Setor</span>
          <strong>{sector.name}</strong>
        </div>
      )}
      {children}
    </aside>
  );
}

/** Flat seat map: the keyboard-friendly alternative to the 3D picker, and its fallback. */
function SeatMap({ failed }) {
  const plan = useSeatPlan(BLOCK);
  const { matchId, sector, layout, taken, mine, maxLen, blocks, block, showBlock, freeInBlock, seats, toggleSeat } = plan;
  const go = useStore((s) => s.go);
  // roving tab stop: the whole map is one Tab entry, arrows move between free seats
  const [cursor, setCursor] = useState(null);
  const [looking, setLooking] = useState(null);
  const selectedKeys = new Set(seats.map((s) => s.key));
  const from = block * BLOCK;
  const columns = Math.min(BLOCK, maxLen - from);

  // free seats of the block on screen, and the one that Tab lands on
  const freeKeys = layout.rows.flatMap((row, r) =>
    row.seats.map((_, i) => `${r}-${i}`).slice(from, from + BLOCK).filter((key) => !taken.has(key)),
  );
  const tabKey = freeKeys.includes(cursor) ? cursor : (freeKeys.find((key) => selectedKeys.has(key)) ?? freeKeys[0]);

  const onSeatKeys = (e) => {
    const move = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
    if (!move || !e.target.dataset.key) return;
    e.preventDefault();
    const [r, i] = e.target.dataset.key.split('-').map(Number);
    const free = freeKeys.map((key) => key.split('-').map(Number));
    let next;
    if (move[1]) {
      const inRow = free.filter(([fr, fi]) => fr === r && (fi - i) * move[1] > 0);
      next = inRow.sort((a, b) => Math.abs(a[1] - i) - Math.abs(b[1] - i))[0];
    } else {
      // nearest row with a free seat, then the closest seat in it
      next = free
        .filter(([fr]) => (fr - r) * move[0] > 0)
        .sort((a, b) => Math.abs(a[0] - r) - Math.abs(b[0] - r) || Math.abs(a[1] - i) - Math.abs(b[1] - i))[0];
    }
    if (next) e.currentTarget.querySelector(`[data-key="${next.join('-')}"]`)?.focus();
  };

  return (
    <>
      <Header />
      <main className="flow flow-seats wrap">
        <div className="flow-head">
          <button className="back-link" onClick={() => go('stadium')}>
            Voltar ao estádio
          </button>
          <Steps current={1} />
        </div>

        <div className="flow-grid">
          <section className="seat-card" aria-label="Mapa de assentos">
            <div className="seat-card-head">
              <div>
                <h1>{sector.name}</h1>
                <p className="muted">
                  {money(plan.st.price)} por lugar. No teclado, use as setas para andar pelo mapa.
                </p>
              </div>
              <ViewSwitch disabled3d={failed} />
            </div>

            {failed && (
              <p className="seat-notice" role="status">O estádio 3D não pôde ser exibido neste dispositivo. Escolha pelo mapa.</p>
            )}

            {blocks > 1 && (
              <div className="blocks-row">
                <div className="blocks" role="group" aria-label="Blocos do setor">
                  {Array.from({ length: blocks }, (_, b) => (
                    <button key={b} aria-pressed={block === b} className={block === b ? 'is-active' : ''} onClick={() => showBlock(b)}>
                      Bloco {b + 1}
                      <small>{freeInBlock(b)} livres</small>
                      {seats.some((s) => Math.floor((s.num - 1) / BLOCK) === b) && <i className="dot" />}
                    </button>
                  ))}
                </div>
                <div className="blocks-where" aria-hidden="true">
                  <MiniMap matchId={matchId} selectedId={sector.id} />
                </div>
              </div>
            )}

            <p className="seat-readout" aria-live="off">
              {looking ?? 'Passe o cursor sobre um lugar para ver a fila e o número.'}
            </p>

            <div className="pitch-edge">
              <span>Campo</span>
            </div>

            <div className="seatmap-scroll">
              <div className="seatmap" style={{ '--cols': BLOCK }} onKeyDown={onSeatKeys} onMouseLeave={() => setLooking(null)}>
                {layout.rows.map((row, r) => {
                  const cells = [];
                  for (let i = from; i < Math.min(row.seats.length, from + BLOCK); i++) {
                    const key = `${r}-${i}`;
                    const isTaken = taken.has(key);
                    const isSel = selectedKeys.has(key);
                    const info = seatInfo(r, i);
                    const state = mine.has(key) ? 'já é seu' : isTaken ? 'ocupado' : isSel ? 'escolhido' : 'livre';
                    cells.push(
                      <button
                        key={key}
                        className={`seat ${sector.kind === 'vip' ? 'vip' : ''} ${isTaken ? 'taken' : ''} ${mine.has(key) ? 'mine' : ''} ${isSel ? 'sel' : ''}`}
                        // aria-disabled keeps the seat hoverable, so its number can still be read
                        aria-disabled={isTaken}
                        aria-pressed={isSel}
                        aria-label={`${info.label}, ${state}`}
                        data-key={key}
                        tabIndex={key === tabKey ? 0 : -1}
                        onMouseEnter={() => setLooking(`${info.label}, ${state}`)}
                        onFocus={() => {
                          setCursor(key);
                          setLooking(`${info.label}, ${state}`);
                        }}
                        onClick={() => !isTaken && toggleSeat(info)}
                      >
                        {isSel ? '✓' : ''}
                      </button>,
                    );
                  }
                  return (
                    <div className="seat-row" key={r}>
                      <span className="row-l">{ROW_LETTERS[r]}</span>
                      <div className="row-seats">{cells.length ? cells : <span className="row-empty">sem lugares</span>}</div>
                      <span className="row-l">{ROW_LETTERS[r]}</span>
                    </div>
                  );
                })}
                <div className="seat-row seat-numbers" aria-hidden="true">
                  <span className="row-l" />
                  <div className="row-seats">
                    {Array.from({ length: columns }, (_, c) => (
                      <span key={c}>{from + c + 1}</span>
                    ))}
                  </div>
                  <span className="row-l" />
                </div>
              </div>
            </div>

            <div className="seat-legend">
              <span><i className={`seat-sw ${sector.kind === 'vip' ? 'vip' : ''}`} />Livre</span>
              <span><i className="seat-sw sel" />Seu lugar</span>
              <span><i className="seat-sw taken" />Ocupado</span>
              {mine.size > 0 && <span><i className="seat-sw mine" />Já é seu</span>}
              <span className="muted">A fila A é a mais próxima do gramado.</span>
            </div>
          </section>

          <OrderAside>
            <Quantity plan={plan} />
            <button className="btn btn-outline btn-block" onClick={plan.suggest}>
              Sugerir melhores lugares
            </button>
            <p className="seat-notice" role="status">{plan.notice}</p>
            <PickedSeats plan={plan} />
            <Subtotal plan={plan} />
            <ContinueButton plan={plan} />
          </OrderAside>
        </div>

        <div className="seat-bar">
          <div className="seat-bar-info">
            <span>
              {seats.length} de {plan.qty} assento{plan.qty > 1 ? 's' : ''}
            </span>
            <strong>{money(plan.total)}</strong>
          </div>
          <ContinueButton plan={plan} />
        </div>
      </main>
    </>
  );
}

export default function SeatsPage() {
  const view = useStore((s) => s.seatView);
  const setView = useStore((s) => s.setSeatView);
  const [failed, setFailed] = useState(() => !webglAvailable());

  if (view === '3d' && !failed) {
    return (
      <Seats3D
        onFail={() => {
          setFailed(true);
          setView('map');
        }}
      />
    );
  }
  return <SeatMap failed={failed} />;
}
