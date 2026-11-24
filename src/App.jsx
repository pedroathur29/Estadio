import { useEffect, useLayoutEffect } from 'react';
import Home from './pages/Home';
import StadiumPage from './pages/StadiumPage';
import SeatsPage from './pages/SeatsPage';
import SummaryPage from './pages/SummaryPage';
import ConfirmPage from './pages/ConfirmPage';
import { DemoNotice } from './components/Chrome';
import { useStore } from './store';

export default function App() {
  const view = useStore((s) => s.view);
  const sectorId = useStore((s) => s.sectorId);
  const seats = useStore((s) => s.seats);
  const qty = useStore((s) => s.qty);
  const order = useStore((s) => s.order);
  const go = useStore((s) => s.go);

  // guard against reaching a step without its prerequisites
  let current = view;
  if ((view === 'seats' || view === 'summary') && !sectorId) current = 'stadium';
  if (view === 'summary' && seats.length !== qty) current = 'seats';
  if (view === 'confirm' && !order) current = 'home';

  useEffect(() => {
    if (current !== view) go(current);
  }, [current, view, go]);

  // start every screen at the top, after the new screen is in the DOM (the store's scroll runs
  // before React renders, so the browser could still restore/keep the previous position)
  useLayoutEffect(() => {
    document.body.classList.toggle('no-scroll', current === 'stadium');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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
