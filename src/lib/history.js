// One address per screen. Hash based, so it also works on static hosting (GitHub Pages).
const HASH = { stadium: '#/estadio', seats: '#/assentos', summary: '#/resumo', confirm: '#/confirmacao' };

export const viewFromUrl = () => Object.keys(HASH).find((view) => HASH[view] === window.location.hash) || 'home';

const urlFor = (view) => HASH[view] || window.location.pathname + window.location.search;

/** Rewrites the current history entry (used when a screen is not reachable and we redirect). */
export const replaceUrl = (view) => window.history.replaceState(null, '', urlFor(view));

/** Keeps the store's `view` and the browser history in step, in both directions. */
export function syncHistory(store) {
  window.history.scrollRestoration = 'manual';
  store.subscribe((state, prev) => {
    if (state.view !== prev.view && viewFromUrl() !== state.view) window.history.pushState(null, '', urlFor(state.view));
  });
  window.addEventListener('popstate', () => store.setState({ view: viewFromUrl() }));
}
