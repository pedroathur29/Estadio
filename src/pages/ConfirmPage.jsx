import { Header, Steps } from '../components/Chrome';
import PassTicket from '../components/PassTicket';
import { money } from '../lib/format';
import { useStore } from '../store';

export default function ConfirmPage() {
  const order = useStore((s) => s.order);
  const go = useStore((s) => s.go);
  const restart = useStore((s) => s.restart);
  if (!order) return null;
  const count = order.lines.length;

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
          <h1>{count === 1 ? 'Seu ingresso está garantido' : 'Seus ingressos estão garantidos'}</h1>
          <p className="page-sub">
            Pedido <b>{order.code}</b>, {count} ingresso{count > 1 ? 's' : ''}, total simulado de <b>{money(order.total)}</b>.
            Nada foi cobrado.
          </p>

          <div className="tickets">
            {order.lines.map((l) => (
              <PassTicket key={l.key} order={order} line={l} />
            ))}
          </div>

          <div className="confirm-actions">
            <button className="btn btn-primary btn-lg" onClick={() => go('tickets')}>
              Ir para Meus ingressos
            </button>
            <button className="btn btn-outline btn-lg" onClick={restart}>
              Voltar aos jogos
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
