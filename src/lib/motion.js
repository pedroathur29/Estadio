// Live view of the user's "reduce motion" preference, for animations driven by JavaScript
// (the CSS side is handled by a media query in styles.css).
const query = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
let reduced = !!query?.matches;
query?.addEventListener?.('change', (e) => {
  reduced = e.matches;
});

export const prefersReducedMotion = () => reduced;
