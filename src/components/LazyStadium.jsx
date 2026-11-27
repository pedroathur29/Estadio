import { Suspense, lazy } from 'react';

// Three.js and the stadium scene are the heaviest part of the app: they are downloaded only when
// a 3D view is about to be shown, so text and buttons appear first.
let failed = false;

const fromCanvas = (name) =>
  lazy(() =>
    import('../three/StadiumCanvas').then(
      (m) => ({ default: m[name] }),
      (error) => {
        failed = true;
        throw error;
      },
    ),
  );

const Hero = fromCanvas('HeroCanvas');
const Explorer = fromCanvas('ExplorerCanvas');

/** True when the 3D code could not be downloaded: only a page reload tries again. */
export const stadiumLoadFailed = () => failed;

export function HeroCanvas(props) {
  return (
    <Suspense fallback={null}>
      <Hero {...props} />
    </Suspense>
  );
}

export function ExplorerCanvas(props) {
  return (
    <Suspense
      fallback={
        <div className="stage-loading" role="status">
          <span className="spinner" /> Carregando o estádio 3D…
        </div>
      }
    >
      <Explorer {...props} />
    </Suspense>
  );
}
