import { Header, Steps } from '../components/Chrome';
import { OrderAside } from './SeatsPage';
import { SECTOR_BY_ID } from '../data/sectors';
import { MATCH_BY_ID, TEAMS, sectorStatus } from '../data/matches';
import { fmtLong, fmtTime, money } from '../lib/format';
import { PLAN_BY_ID } from '../data/content';
import { onRadioKeys } from '../lib/radio';
import { useAccount } from '../account';
import { useStore } from '../store';

export const FEE_RATE = 0.1;

const cents = (v) => Math.round(v * 100) / 100;

export function computeTotals(matchId, sectorId, seats, ticketTypes, planId) {
  const { price } = sectorStatus(matchId, sectorId);
  const lines = seats.map((s) => {
    const type = ticketTypes[s.key] || 'inteira';
    const value = type === 'meia' ? price / 2 : price;
    return { ...s, type, value };
  });
  const subtotal = lines.reduce((n, l) => n + l.value, 0);
  // the member discount covers one full-price ticket and does not stack with the half price
  const plan = PLAN_BY_ID[planId];
  const discount = plan && lines.some((l) => l.type === 'inteira') ? cents(price * plan.off) : 0;
  const fee = plan?.noFee ? 0 : cents((subtotal - discount) * FEE_RATE);
  return { lines, subtotal, discount, fee, total: cents(subtotal - discount + fee) };
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
  const planId = useAccount((s) => s.plan);
  const addOrder = useAccount((s) => s.addOrder);
  const plan = PLAN_BY_ID[planId];
  const { lines, subtotal, discount, fee, total } = computeTotals(matchId, sectorId, seats, ticketTypes, planId);

  const confirm = () => {
    const code = `AP-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${String(Date.now()).slice(-4)}`;
    // the match date is saved with the order: demo dates move along with today
    const order = { code, lines, subtotal, discount, fee, total, payment, matchId, sectorId, matchDate: m.date.toISOString() };
    addOrder(order);
    placeOrder(order);
  };

  return (
    <>
      <Header />
      <main className="flow wrap">
        <div className="flow-head">
          <button className="back-link" onClick={() => go('seats')}>
            Alterar assentos
          </button>
          <Steps current={2} />
        </div>

        <div className="flow-grid">
          <section className="summary-card">
            <h1>Confira seus ingressos</h1>
            <p className="muted">
              {TEAMS[m.home].name} × {TEAMS[m.away].name}, {fmtLong(m.date)} às {fmtTime(m.date)}
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
                  <div className="seg" role="radiogroup" aria-label={`Tipo do ingresso ${l.label}`} onKeyDown={onRadioKeys}>
                    {['inteira', 'meia'].map((t) => (
                      <button
                        key={t}
                        role="radio"
                        aria-checked={l.type === t}
                        tabIndex={l.type === t ? 0 : -1}
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
            <div className="pay-options" role="radiogroup" aria-label="Forma de pagamento simulada" onKeyDown={onRadioKeys}>
              {PAYMENTS.map((p) => (
                <button
                  key={p.id}
                  role="radio"
                  aria-checked={payment === p.id}
                  tabIndex={payment === p.id ? 0 : -1}
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
              {discount > 0 && (
                <div className="is-discount">
                  <span>Sócio {plan.name} ({plan.off * 100}% em um ingresso)</span>
                  <span>−{money(discount)}</span>
                </div>
              )}
              <div>
                <span>Taxa de serviço{plan?.noFee ? '' : ' (10%)'}</span>
                <span>{plan?.noFee ? 'Isenta' : money(fee)}</span>
              </div>
            </div>
            {!plan && (
              <button className="link" onClick={() => go('plans')}>
                Sócio paga menos. Ver planos
              </button>
            )}
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
