// One address per screen. Hash based, so it also works on static hosting (GitHub Pages).
const PATH = {
  stadium: 'estadio',
  seats: 'assentos',
  summary: 'resumo',
  confirm: 'confirmacao',
  match: 'jogo',
  tickets: 'meus-ingressos',
  guide: 'guia',
  plans: 'socio',
};

/** `{ view, pageId }` for the current address; `pageId` is the match shown by the match page. */
export function parseUrl() {
  const [, path, pageId = null] = window.location.hash.split('/');
  const view = Object.keys(PATH).find((v) => PATH[v] === path) || 'home';
  return { view, pageId: view === 'match' ? pageId : null };
}

const hashFor = (view, pageId) => (PATH[view] ? `#/${PATH[view]}${pageId ? `/${pageId}` : ''}` : '');
const urlFor = (view, pageId) => hashFor(view, pageId) || window.location.pathname + window.location.search;

/** Rewrites the current history entry (used when a screen is not reachable and we redirect). */
export const replaceUrl = (view) => window.history.replaceState(null, '', urlFor(view));

/** Keeps the store's screen and the browser history in step, in both directions. */
export function syncHistory(store) {
  window.history.scrollRestoration = 'manual';
  store.subscribe((state, prev) => {
    if (state.view === prev.view && state.pageId === prev.pageId) return;
    if (window.location.hash !== hashFor(state.view, state.pageId)) {
      window.history.pushState(null, '', urlFor(state.view, state.pageId));
    }
  });
  window.addEventListener('popstate', () => store.setState(parseUrl()));
}
