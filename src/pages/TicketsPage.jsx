import { useState } from 'react';
import PassTicket from '../components/PassTicket';
import { Header } from '../components/Chrome';
import { MATCH_BY_ID, TEAMS, VENUE } from '../data/matches';
import { SECTOR_BY_ID } from '../data/sectors';
import { downloadEvent } from '../lib/calendar';
import { fmtShort, fmtTime, money } from '../lib/format';
import { useAccount } from '../account';
import { useStore } from '../store';

function Order({ order, startOpen }) {
  const cancelOrder = useAccount((s) => s.cancelOrder);
  const [open, setOpen] = useState(startOpen);
  const [asking, setAsking] = useState(false);
  const [printing, setPrinting] = useState(false);
  const m = MATCH_BY_ID[order.matchId];
  const sector = SECTOR_BY_ID[order.sectorId];
  const date = new Date(order.matchDate);
  const past = date < new Date();
  const title = `${TEAMS[m.home].name} × ${TEAMS[m.away].name}`;
  const seats = order.lines.map((l) => `${l.row}${l.num}`).join(', ');

  // only this order goes to the printer
  const print = () => {
    setOpen(true);
    setPrinting(true);
    document.body.classList.add('print-one');
    window.addEventListener(
      'afterprint',
      () => {
        document.body.classList.remove('print-one');
        setPrinting(false);
      },
      { once: true },
    );
    setTimeout(() => window.print(), 80);
  };

  return (
    <li className={`order ${printing ? 'is-printing' : ''}`}>
      <div className="order-head">
        <div>
          <h2>{title}</h2>
          <p>
            {fmtShort(date)} às {fmtTime(date)}. {sector.name}, {order.lines.length === 1 ? 'assento' : 'assentos'} {seats}.
          </p>
          <p className="fine">
            Pedido {order.code}, total simulado de {money(order.total)}
            {past ? '. Jogo encerrado.' : ''}
          </p>
        </div>
        <div className="order-actions">
          <button className="btn btn-dark" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? 'Esconder ingressos' : 'Mostrar ingressos'}
          </button>
          <button className="btn btn-outline" onClick={print}>Imprimir</button>
          {!past && (
            <button
              className="btn btn-outline"
              onClick={() =>
                downloadEvent({
                  uid: order.code,
                  title,
                  start: date,
                  location: VENUE.name,
                  description: `${sector.name}, assentos ${seats}. Ingresso demonstrativo, sem validade.`,
                })
              }
            >
              Salvar no calendário
            </button>
          )}
          {!past && !asking && <button className="link danger" onClick={() => setAsking(true)}>Cancelar pedido</button>}
        </div>
      </div>
      {asking && (
        <div className="confirm-cancel" role="alertdialog" aria-label="Confirmar cancelamento">
          <p>Cancelar o pedido {order.code}? Os assentos {seats} voltam a ficar livres.</p>
          <button className="btn btn-danger" onClick={() => cancelOrder(order.code)}>Cancelar pedido</button>
          <button className="btn btn-outline" autoFocus onClick={() => setAsking(false)}>Manter pedido</button>
        </div>
      )}
      {open && (
        <div className="tickets">
          {order.lines.map((l) => (
            <PassTicket key={l.key} order={order} line={l} />
          ))}
        </div>
      )}
    </li>
  );
}

export default function TicketsPage() {
  const orders = useAccount((s) => s.orders);
  const go = useStore((s) => s.go);
  return (
    <>
      <Header />
      <main className="page wrap">
        <h1>Meus ingressos</h1>
        <p className="page-sub">Os pedidos simulados ficam guardados apenas neste navegador.</p>
        {orders.length ? (
          <ul className="orders">
            {orders.map((o, i) => (
              <Order key={o.code} order={o} startOpen={i === 0} />
            ))}
          </ul>
        ) : (
          <div className="empty">
            <h2>Você ainda não tem ingressos</h2>
            <p>Escolha um jogo, marque seus assentos e eles aparecem aqui.</p>
            <button className="btn btn-primary btn-lg" onClick={() => go('home')}>Ver jogos</button>
          </div>
        )}
      </main>
    </>
  );
}
