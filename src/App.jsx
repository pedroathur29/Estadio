import { useEffect, useLayoutEffect, useRef } from 'react';
import Home from './pages/Home';
import MatchPage from './pages/MatchPage';
import StadiumPage from './pages/StadiumPage';
import SeatsPage from './pages/SeatsPage';
import SummaryPage from './pages/SummaryPage';
import ConfirmPage from './pages/ConfirmPage';
import TicketsPage from './pages/TicketsPage';
import GuidePage from './pages/GuidePage';
import PlansPage from './pages/PlansPage';
import { Footer } from './components/Chrome';
import { MATCH_BY_ID, TEAMS } from './data/matches';
import { useStore } from './store';

const PAGES = {
  home: Home,
  match: MatchPage,
  stadium: StadiumPage,
  seats: SeatsPage,
  summary: SummaryPage,
  confirm: ConfirmPage,
  tickets: TicketsPage,
  guide: GuidePage,
  plans: PlansPage,
};

const TITLES = {
  home: 'Ingressos',
  stadium: 'Escolha o setor',
  seats: 'Escolha os assentos',
  summary: 'Resumo do pedido',
  confirm: 'Pedido confirmado',
  tickets: 'Meus ingressos',
  guide: 'Dia de jogo',
  plans: 'Sócio',
};

export default function App() {
  const view = useStore((s) => s.view);
  const pageId = useStore((s) => s.pageId);
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
  if (view === 'match' && !MATCH_BY_ID[pageId]) current = 'home';

  useEffect(() => {
    if (current !== view) redirect(current);
  }, [current, view, redirect]);

  // start every screen at the top, after the new screen is in the DOM (the store's scroll runs
  // before React renders, so the browser could still restore/keep the previous position)
  const screen = current === 'match' ? `match/${pageId}` : current;
  const shown = useRef(screen);
  useLayoutEffect(() => {
    document.body.classList.toggle('no-scroll', current === 'stadium');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const match = current === 'match' && MATCH_BY_ID[pageId];
    const title = match ? `${TEAMS[match.home].name} × ${TEAMS[match.away].name}` : TITLES[current];
    document.title = `${title} · Arena Pass`;
    // after a screen change (not on first load), move keyboard and screen readers to its heading
    if (shown.current === screen) return;
    shown.current = screen;
    const heading = document.querySelector('.app h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
  }, [screen, current, pageId]);

  const Page = PAGES[current];
  return (
    <div className="app" data-view={current} key={screen}>
      <Page />
      {current !== 'stadium' && <Footer />}
    </div>
  );
}
