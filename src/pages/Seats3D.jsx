import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import Matchbar from '../components/Matchbar';
import { Logo, Steps } from '../components/Chrome';
import { ContinueButton, PickedSeats, Quantity, Subtotal, ViewSwitch } from '../components/SeatOrder';
import { MATCH_BY_ID } from '../data/matches';
import { seatInfo, useSeatPlan } from '../lib/useSeatPlan';
import { money } from '../lib/format';
import { useStore } from '../store';

const loadCanvas = () => lazy(() => import('../three/StadiumCanvas').then((m) => ({ default: m.ExplorerCanvas })));

/** Narrow screens show fewer seats at a time, so each one stays big enough to tap. */
const blockSizeFor = () => (window.innerWidth <= 700 ? 10 : 20);

/** Name, state and price of the seat under the pointer. */
function SeatTooltip({ plan, stageRef }) {
  const key = useStore((s) => s.hoverSeat);
  const ref = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const place = () => {
    if (ref.current) ref.current.style.transform = `translate(${pos.current.x + 16}px, ${pos.current.y + 16}px)`;
  };
  useEffect(() => {
    const stage = stageRef.current;
    const move = (e) => {
      const r = stage.getBoundingClientRect();
      pos.current = { x: e.clientX - r.left, y: e.clientY - r.top };
      place();
    };
    stage.addEventListener('pointermove', move);
    return () => stage.removeEventListener('pointermove', move);
  }, [stageRef]);
  useLayoutEffect(place);

  if (!key) return null;
  const [r, i] = key.split('-').map(Number);
  const state = plan.mine.has(key)
    ? 'Já é seu'
    : plan.taken.has(key)
      ? 'Ocupado'
      : plan.seats.some((s) => s.key === key)
        ? 'Escolhido. Clique para soltar'
        : `Livre, ${money(plan.st.price)}`;
  return (
    <div className="tooltip" ref={ref}>
      <strong>{seatInfo(r, i).label}</strong>
      <span>{state}</span>
    </div>
  );
}

export default function Seats3D({ onFail }) {
  const [blockSize, setBlockSize] = useState(blockSizeFor);
  const plan = useSeatPlan(blockSize);
  const { matchId, sector, blocks, block, showBlock, freeInBlock, seats } = plan;
  const cameraMode = useStore((s) => s.cameraMode);
  const povSeat = useStore((s) => s.povSeat);
  const go = useStore((s) => s.go);
  const zoom = useStore((s) => s.zoom);
  const reframe = useStore((s) => s.reframe);
  const viewFromSeat = useStore((s) => s.viewFromSeat);
  const leaveSeatView = useStore((s) => s.leaveSeatView);
  const [Canvas] = useState(loadCanvas);
  const [ready, setReady] = useState(false);
  const stageRef = useRef();
  const pov = cameraMode === 'pov' && povSeat;

  useEffect(() => {
    const onResize = () => setBlockSize(blockSizeFor());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // hand the camera over to seat picking, and give it back when leaving
  useLayoutEffect(() => {
    useStore.setState({ cameraMode: 'seats', povSeat: null });
    return () => {
      useStore.setState({ cameraMode: useStore.getState().sectorId ? 'sector' : 'overview', povSeat: null });
      document.body.style.cursor = '';
    };
  }, []);

  // tells the camera which block to frame
  useLayoutEffect(() => {
    useStore.setState({ seatBlock: block * blockSize, seatBlockSize: blockSize });
  }, [block, blockSize]);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 350);
    const onKey = (e) => {
      if (e.key === 'Escape' && useStore.getState().cameraMode === 'pov') leaveSeatView();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [leaveSeatView]);

  const povLabel = pov && seatInfo(...povSeat.split('-').map(Number)).label;

  return (
    <main className={`explorer picker ${pov ? 'is-pov' : ''}`}>
      <div className="stage" ref={stageRef}>
        <ErrorBoundary fallback={null} onError={onFail}>
          <Suspense
            fallback={
              <div className="stage-loading" role="status">
                <span className="spinner" /> Carregando estádio 3D…
              </div>
            }
          >
            <Canvas matchId={matchId} picking={sector.id} onContextLost={onFail} />
          </Suspense>
        </ErrorBoundary>
        {!pov && <SeatTooltip plan={plan} stageRef={stageRef} />}
        <div className={`stage-veil ${ready ? 'is-gone' : ''}`} />
      </div>

      <div className="topbar">
        <div className="tb-left">
          <button className="icon-btn" onClick={() => go('stadium')} aria-label="Voltar ao estádio e aos setores">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <Logo onClick={() => go('home')} />
        </div>
        <Matchbar match={MATCH_BY_ID[matchId]} />
        <Steps current={1} />
      </div>

      {pov ? (
        <div className="povbar">
          <div className="pov-info">
            <span className="sp-kicker">Esta é a vista do seu lugar</span>
            <strong>{povLabel}</strong>
            <small>{sector.name}. Arraste para olhar ao redor.</small>
          </div>
          <div className="pov-actions">
            <button className="icon-btn" onClick={() => zoom(-1)} aria-label="Ampliar campo de visão">−</button>
            <button className="icon-btn" onClick={() => zoom(1)} aria-label="Reduzir campo de visão">+</button>
            <button className="btn btn-primary" onClick={leaveSeatView}>Voltar aos lugares</button>
          </div>
        </div>
      ) : (
        <>
          <aside className="pick-panel" aria-label="Seu pedido">
            <div className="pick-head">
              <h1>{sector.name}</h1>
              <p>{money(plan.st.price)} por lugar. Clique numa cadeira livre.</p>
              <ViewSwitch />
            </div>
            <div className="pick-body">
              <Quantity plan={plan} />
              <button className="btn btn-ghost btn-block" onClick={plan.suggest}>
                Sugerir melhores lugares
              </button>
              <p className="seat-notice" role="status">{plan.notice}</p>
              <PickedSeats plan={plan} onView={viewFromSeat} />
            </div>
            <div className="pick-foot">
              <Subtotal plan={plan} />
              <ContinueButton plan={plan} />
            </div>
          </aside>

          <div className="pick-dock">
            {blocks > 1 && (
              <div className="pick-blocks" role="group" aria-label="Blocos do setor">
                {Array.from({ length: blocks }, (_, b) => (
                  <button key={b} aria-pressed={block === b} onClick={() => showBlock(b)}>
                    Bloco {b + 1}
                    <small>{freeInBlock(b)} livres</small>
                    {seats.some((s) => Math.floor((s.num - 1) / blockSize) === b) && <i className="dot" aria-label="tem lugar escolhido" />}
                  </button>
                ))}
              </div>
            )}
            <div className="pick-tools">
              <div className="legend" aria-label="Legenda">
                <span><i className={`sw ${sector.kind === 'vip' ? 'vip' : 'std'}`} />Livre</span>
                <span><i className="sw busy" />Ocupado</span>
                <span><i className="sw sel" />Seu lugar</span>
                {plan.mine.size > 0 && <span><i className="sw mine" />Já é seu</span>}
              </div>
              <div className="controls" role="toolbar" aria-label="Controles da câmera">
                <button onClick={reframe}>Centralizar</button>
                <button onClick={() => zoom(-1)} aria-label="Afastar">−</button>
                <button onClick={() => zoom(1)} aria-label="Aproximar">+</button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
