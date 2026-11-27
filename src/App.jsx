import { useEffect, useLayoutEffect, useRef } from 'react';
import Home from './pages/Home';
import StadiumPage from './pages/StadiumPage';
import SeatsPage from './pages/SeatsPage';
import SummaryPage from './pages/SummaryPage';
import ConfirmPage from './pages/ConfirmPage';
import { DemoNotice } from './components/Chrome';
import { useStore } from './store';

const TITLES = {
  home: 'Arena Pass · Ingressos (Demo)',
  stadium: 'Escolha o setor · Arena Pass',
  seats: 'Escolha os assentos · Arena Pass',
  summary: 'Resumo do pedido · Arena Pass',
  confirm: 'Pedido confirmado · Arena Pass',
};

export default function App() {
  const view = useStore((s) => s.view);
  const sectorId = useStore((s) => s.sectorId);
  const seats = useStore((s) => s.seats);
  const qty = useStore((s) => s.qty);
  const order = useStore((s) => s.order);
  const redirect = useStore((s) => s.redirect);

  // guard against reaching a step without its prerequisites
  let current = view;
  if (view === 'summary' && seats.length !== qty) current = 'seats';
  // no sector yet, or going back after the order was placed
  if ((view === 'seats' || view === 'summary') && (!sectorId || order)) current = 'stadium';
  if (view === 'confirm' && !order) current = 'home';

  useEffect(() => {
    if (current !== view) redirect(current);
  }, [current, view, redirect]);

  // start every screen at the top, after the new screen is in the DOM (the store's scroll runs
  // before React renders, so the browser could still restore/keep the previous position)
  const shown = useRef(current);
  useLayoutEffect(() => {
    document.body.classList.toggle('no-scroll', current === 'stadium');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.title = TITLES[current];
    // after a screen change (not on first load), move keyboard and screen readers to its heading
    if (shown.current === current) return;
    shown.current = current;
    const heading = document.querySelector('.app h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
  }, [current]);

  return (
    <div className="app" data-view={current} key={current}>
      {current === 'home' && <Home />}
      {current === 'stadium' && <StadiumPage />}
      {current === 'seats' && <SeatsPage />}
      {current === 'summary' && <SummaryPage />}
      {current === 'confirm' && <ConfirmPage />}
      {current !== 'stadium' && <DemoNotice />}
    </div>
  );
}
