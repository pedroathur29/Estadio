import { useMemo, useState } from 'react';
import { Header, Steps } from '../components/Chrome';
import { SECTOR_BY_ID, seatLayout, ROW_LETTERS } from '../data/sectors';
import { MATCH_BY_ID, TEAMS, sectorStatus, occupiedSeats } from '../data/matches';
import { fmtShort, fmtTime, money } from '../lib/format';
import { useStore } from '../store';
import Crest from '../components/Crest';

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
            {fmtShort(m.date)} · {fmtTime(m.date)} · Arena Horizonte
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

export default function SeatsPage() {
  const matchId = useStore((s) => s.matchId);
  const sectorId = useStore((s) => s.sectorId);
  const qty = useStore((s) => s.qty);
  const seats = useStore((s) => s.seats);
  const toggleSeat = useStore((s) => s.toggleSeat);
  const clearSeats = useStore((s) => s.clearSeats);
  const setQty = useStore((s) => s.setQty);
  const go = useStore((s) => s.go);
  const sector = SECTOR_BY_ID[sectorId];
  const st = sectorStatus(matchId, sectorId);
  const layout = seatLayout(sector);
  const taken = useMemo(() => occupiedSeats(matchId, sectorId), [matchId, sectorId]);
  const maxLen = Math.max(...layout.rows.map((r) => r.seats.length));
  const blocks = Math.max(1, Math.ceil(maxLen / BLOCK));
  const [block, setBlock] = useState(() => Math.floor((blocks - 1) / 2));
  const selectedKeys = new Set(seats.map((s) => s.key));
  const maxQty = Math.min(6, st.available);

  const seatInfo = (r, i) => ({
    key: `${r}-${i}`,
    row: ROW_LETTERS[r],
    num: i + 1,
    label: `Fila ${ROW_LETTERS[r]} · Assento ${i + 1}`,
  });

  const suggest = () => {
    // find `qty` adjacent free seats, preferring middle rows and the centre of the block
    const rowsOrder = layout.rows
      .map((_, r) => r)
      .sort((a, b) => Math.abs(a - layout.rows.length * 0.4) - Math.abs(b - layout.rows.length * 0.4));
    for (const b of [block, ...Array.from({ length: blocks }, (_, i) => i).filter((i) => i !== block)]) {
      for (const r of rowsOrder) {
        const len = layout.rows[r].seats.length;
        const from = b * BLOCK;
        const to = Math.min(len, from + BLOCK);
        const centre = (from + to) / 2;
        const starts = [];
        for (let i = from; i + qty <= to; i++) starts.push(i);
        starts.sort((x, y) => Math.abs(x + qty / 2 - centre) - Math.abs(y + qty / 2 - centre));
        for (const s0 of starts) {
          let ok = true;
          for (let k = 0; k < qty; k++) if (taken.has(`${r}-${s0 + k}`)) ok = false;
          if (ok) {
            clearSeats();
            for (let k = 0; k < qty; k++) toggleSeat(seatInfo(r, s0 + k));
            setBlock(b);
            return;
          }
        }
      }
    }
  };

  const total = st.price * seats.length;
  const done = seats.length === qty;

  return (
    <>
      <Header />
      <main className="flow wrap">
        <div className="flow-head">
          <button className="back-link" onClick={() => go('stadium')}>
            ← Voltar ao estádio
          </button>
          <Steps current={1} />
        </div>

        <div className="flow-grid">
          <section className="seat-card" aria-label="Mapa de assentos">
            <div className="seat-card-head">
              <div>
                <span className="kicker">Escolha {qty === 1 ? 'seu assento' : `${qty} assentos`}</span>
                <h1>{sector.name}</h1>
              </div>
              <button className="btn btn-ghost" onClick={suggest}>
                ✦ Sugerir melhores lugares
              </button>
            </div>

            {blocks > 1 && (
              <div className="blocks" role="tablist" aria-label="Blocos do setor">
                {Array.from({ length: blocks }, (_, b) => (
                  <button
                    key={b}
                    role="tab"
                    aria-selected={block === b}
                    className={block === b ? 'is-active' : ''}
                    onClick={() => setBlock(b)}
                  >
                    Bloco {b + 1}
                    {seats.some((s) => Math.floor((s.num - 1) / BLOCK) === b) && <i className="dot" />}
                  </button>
                ))}
              </div>
            )}

            <div className="pitch-edge">
              <span>Campo</span>
            </div>

            <div className="seatmap-scroll">
              <div className="seatmap" style={{ '--cols': BLOCK }}>
                {layout.rows.map((row, r) => {
                  const from = block * BLOCK;
                  const to = Math.min(row.seats.length, from + BLOCK);
                  const cells = [];
                  for (let i = from; i < to; i++) {
                    const key = `${r}-${i}`;
                    const isTaken = taken.has(key);
                    const isSel = selectedKeys.has(key);
                    cells.push(
                      <button
                        key={key}
                        className={`seat ${sector.kind === 'vip' ? 'vip' : ''} ${isTaken ? 'taken' : ''} ${isSel ? 'sel' : ''}`}
                        disabled={isTaken}
                        aria-pressed={isSel}
                        aria-label={`${seatInfo(r, i).label}${isTaken ? ', ocupado' : ''}`}
                        title={seatInfo(r, i).label}
                        onClick={() => toggleSeat(seatInfo(r, i))}
                      >
                        {isSel ? '✓' : ''}
                      </button>,
                    );
                  }
                  return (
                    <div className="seat-row" key={r}>
                      <span className="row-l">{ROW_LETTERS[r]}</span>
                      <div className="row-seats">{cells.length ? cells : <span className="row-empty">—</span>}</div>
                      <span className="row-l">{ROW_LETTERS[r]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="seat-legend">
              <span><i className={`seat-sw ${sector.kind === 'vip' ? 'vip' : ''}`} />Livre</span>
              <span><i className="seat-sw sel" />Selecionado</span>
              <span><i className="seat-sw taken" />Ocupado</span>
              <span className="muted">
                Assentos {block * BLOCK + 1}–{Math.min(maxLen, (block + 1) * BLOCK)} · Fila A mais próxima do gramado
              </span>
            </div>
          </section>

          <OrderAside>
            <div className="qty compact">
              <span className="label">Ingressos</span>
              <div className="stepper">
                <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="Diminuir quantidade">−</button>
                <output>{qty}</output>
                <button onClick={() => setQty(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty} aria-label="Aumentar quantidade">+</button>
              </div>
            </div>
            <ul className="picked">
              {Array.from({ length: qty }, (_, i) => {
                const s = seats[i];
                return (
                  <li key={i} className={s ? 'is-filled' : ''}>
                    <span className="pk-n">{i + 1}</span>
                    {s ? (
                      <>
                        <span>{s.label}</span>
                        <button className="pk-x" onClick={() => toggleSeat(s)} aria-label={`Remover ${s.label}`}>
                          ×
                        </button>
                      </>
                    ) : (
                      <span className="muted">Selecione no mapa</span>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="oa-total">
              <span>Subtotal</span>
              <strong>{money(total)}</strong>
            </div>
            <button className="btn btn-primary btn-block" disabled={!done} onClick={() => go('summary')}>
              {done ? 'Continuar para o resumo' : `Faltam ${qty - seats.length} assento${qty - seats.length > 1 ? 's' : ''}`}
            </button>
          </OrderAside>
        </div>
      </main>
    </>
  );
}
