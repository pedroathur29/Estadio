import { Header, Steps } from '../components/Chrome';
import { OrderAside } from './SeatsPage';
import { SECTOR_BY_ID } from '../data/sectors';
import { MATCH_BY_ID, TEAMS, sectorStatus } from '../data/matches';
import { fmtLong, fmtTime, money } from '../lib/format';
import { useStore } from '../store';

export const FEE_RATE = 0.1;

export function computeTotals(matchId, sectorId, seats, ticketTypes) {
  const { price } = sectorStatus(matchId, sectorId);
  const lines = seats.map((s) => {
    const type = ticketTypes[s.key] || 'inteira';
    const value = type === 'meia' ? price / 2 : price;
    return { ...s, type, value };
  });
  const subtotal = lines.reduce((n, l) => n + l.value, 0);
  const fee = Math.round(subtotal * FEE_RATE * 100) / 100;
  return { lines, subtotal, fee, total: subtotal + fee };
}

const PAYMENTS = [
  { id: 'pix', name: 'Pix', note: 'Aprovação simulada instantânea' },
  { id: 'card', name: 'Cartão', note: 'Nenhum dado de cartão é solicitado' },
  { id: 'wallet', name: 'Carteira digital', note: 'Fluxo apenas ilustrativo' },
];

export default function SummaryPage() {
  const matchId = useStore((s) => s.matchId);
  const sectorId = useStore((s) => s.sectorId);
  const seats = useStore((s) => s.seats);
  const ticketTypes = useStore((s) => s.ticketTypes);
  const setTicketType = useStore((s) => s.setTicketType);
  const payment = useStore((s) => s.payment);
  const setPayment = useStore((s) => s.setPayment);
  const go = useStore((s) => s.go);
  const placeOrder = useStore((s) => s.placeOrder);
  const m = MATCH_BY_ID[matchId];
  const sector = SECTOR_BY_ID[sectorId];
  const { lines, subtotal, fee, total } = computeTotals(matchId, sectorId, seats, ticketTypes);

  const confirm = () => {
    const code = `AP-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${String(Date.now()).slice(-4)}`;
    placeOrder({ code, lines, subtotal, fee, total, payment, matchId, sectorId, at: new Date() });
  };

  return (
    <>
      <Header />
      <main className="flow wrap">
        <div className="flow-head">
          <button className="back-link" onClick={() => go('seats')}>
            ← Alterar assentos
          </button>
          <Steps current={2} />
        </div>

        <div className="flow-grid">
          <section className="summary-card">
            <span className="kicker">Resumo do pedido</span>
            <h1>Confira seus ingressos</h1>
            <p className="muted">
              {TEAMS[m.home].name} × {TEAMS[m.away].name} · {fmtLong(m.date)} às {fmtTime(m.date)}
            </p>

            <ul className="ticket-lines">
              {lines.map((l) => (
                <li key={l.key}>
                  <div className="tl-seat">
                    <span className="tl-badge">{l.row}{l.num}</span>
                    <div>
                      <strong>{sector.name}</strong>
                      <span>{l.label}</span>
                    </div>
                  </div>
                  <div className="seg" role="radiogroup" aria-label={`Tipo do ingresso ${l.label}`}>
                    {['inteira', 'meia'].map((t) => (
                      <button
                        key={t}
                        role="radio"
                        aria-checked={l.type === t}
                        className={l.type === t ? 'is-active' : ''}
                        onClick={() => setTicketType(l.key, t)}
                      >
                        {t === 'inteira' ? 'Inteira' : 'Meia'}
                      </button>
                    ))}
                  </div>
                  <strong className="tl-price">{money(l.value)}</strong>
                </li>
              ))}
            </ul>

            <h2 className="h-small">Forma de pagamento (simulada)</h2>
            <div className="pay-options" role="radiogroup" aria-label="Forma de pagamento simulada">
              {PAYMENTS.map((p) => (
                <button
                  key={p.id}
                  role="radio"
                  aria-checked={payment === p.id}
                  className={`pay ${payment === p.id ? 'is-active' : ''}`}
                  onClick={() => setPayment(p.id)}
                >
                  <span className="radio" />
                  <span>
                    <strong>{p.name}</strong>
                    <small>{p.note}</small>
                  </span>
                </button>
              ))}
            </div>
            <p className="disclaimer">
              Esta é uma demonstração: nenhum pagamento é processado, nenhum dado pessoal é coletado e nenhum ingresso real é emitido.
            </p>
          </section>

          <OrderAside title="Total">
            <div className="oa-rows">
              <div>
                <span>{lines.length} ingresso{lines.length > 1 ? 's' : ''}</span>
                <span>{money(subtotal)}</span>
              </div>
              <div>
                <span>Taxa de serviço (10%)</span>
                <span>{money(fee)}</span>
              </div>
            </div>
            <div className="oa-total big">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
            <button className="btn btn-primary btn-block btn-lg" onClick={confirm}>
              Confirmar pedido
            </button>
            <small className="muted center">Simulação · nada será cobrado</small>
          </OrderAside>
        </div>
      </main>
    </>
  );
}
