import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { webglAccelerated } from '../lib/webgl';

// three.js stays out of the first download
const HeroCanvas = lazy(() => import('../three/StadiumCanvas').then((m) => ({ default: m.HeroCanvas })));

/** True once the page has loaded and the browser has had an idle moment. */
function useAfterLoadIdle() {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let idleId;
    let timer;
    const schedule = () => {
      if (window.requestIdleCallback) idleId = window.requestIdleCallback(() => setIdle(true), { timeout: 2000 });
      else timer = setTimeout(() => setIdle(true), 200);
    };
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
    return () => {
      window.removeEventListener('load', schedule);
      if (idleId) window.cancelIdleCallback(idleId);
      clearTimeout(timer);
    };
  }, []);
  return idle;
}

/** True while the element is on screen and the tab is visible. */
function useOnScreen(ref) {
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    let observer;
    if (window.IntersectionObserver && ref.current) {
      observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
      observer.observe(ref.current);
    } else setInView(true);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
    };
  }, [ref]);
  return inView && tabVisible;
}

/**
 * Decorative 3D stadium behind the home hero. It is built only after the first content is out
 * and only if visible; without GPU-backed WebGL (or on failure) the gradient background remains.
 */
export default function HeroStage({ matchId }) {
  const ref = useRef(null);
  const idle = useAfterLoadIdle();
  const active = useOnScreen(ref);
  const [mounted, setMounted] = useState(false);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    if (!mounted && idle && active && webglAccelerated()) setMounted(true);
  }, [mounted, idle, active]);

  return (
    <div ref={ref} className={`hero-3d ${drawn ? 'is-drawn' : ''}`}>
      {mounted && (
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <HeroCanvas matchId={matchId} active={active} onDrawn={() => setDrawn(true)} />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}
