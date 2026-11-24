// "Reduce motion" preference for animations driven by JavaScript (the CSS side is handled
// by a media query in styles.css). `MediaQueryList.matches` is evaluated live, so reading it
// on every call also picks up changes made while the page is open (e.g. DevTools emulation),
// without relying on change events.
const query = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

export const prefersReducedMotion = () => !!query?.matches;
