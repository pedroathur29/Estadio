import { useEffect, useRef, useState } from 'react';
import { ExplorerCanvas } from '../three/StadiumCanvas';
import Crest from '../components/Crest';
import MiniMap from '../components/MiniMap';
import { Logo, Steps } from '../components/Chrome';
import { SECTORS, SECTOR_BY_ID } from '../data/sectors';
import { MATCH_BY_ID, TEAMS, sectorStatus } from '../data/matches';
import { fmtShort, fmtTime, money } from '../lib/format';
import { useStore } from '../store';

const TIER_LABEL = { lower: 'Anel inferior', box: 'Nível camarote', upper: 'Anel superior' };

function availabilityLabel(st) {
  if (st.soldOut) return 'Esgotado';
  if (st.ratio < 0.15) return 'Últimos lugares';
  if (st.ratio < 0.45) return 'Poucos lugares';
  return 'Disponível';
}

function AvailBar({ st }) {
  const pct = Math.round(st.ratio * 100);
  const tone = st.soldOut ? 'off' : st.ratio < 0.15 ? 'low' : st.ratio < 0.45 ? 'mid' : 'ok';
  return (
    <div className={`avail avail-${tone}`}>
      <div className="avail-track">
        <div className="avail-fill" style={{ width: `${Math.max(st.soldOut ? 0 : 4, pct)}%` }} />
      </div>
    </div>
  );
}

function MatchBar({ match }) {
  const home = TEAMS[match.home];
  const away = TEAMS[match.away];
  return (
    <div className="matchbar">
      <Crest team={home} size={26} />
      <span className="mb-names">
        <b>{home.short}</b> × <b>{away.short}</b>
      </span>
      <Crest team={away} size={26} />
      <span className="mb-date">
        {fmtShort(match.date)} · {fmtTime(match.date)}
      </span>
    </div>
  );
}

function SectorList({ matchId, onPick }) {
  const sectorId = useStore((s) => s.sectorId);
  const hoveredId = useStore((s) => s.hoveredId);
  const setHovered = useStore((s) => s.setHovered);
  const groups = ['lower', 'box', 'upper'];
  return (
    <div className="sector-list">
      {groups.map((g) => (
        <div key={g} className="sl-group">
          <h4>{TIER_LABEL[g]}</h4>
          {SECTORS.filter((s) => s.tier === g).map((s) => {
            const st = sectorStatus(matchId, s.id);
            return (
              <button
                key={s.id}
                className={`sl-item ${sectorId === s.id ? 'is-active' : ''} ${hoveredId === s.id ? 'is-hover' : ''} ${st.soldOut ? 'is-off' : ''}`}
                onClick={() => onPick(s.id)}
                onMouseEnter={() => setHovered(s.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className={`sl-swatch ${st.soldOut ? 'off' : s.kind === 'vip' ? 'vip' : 'std'}`} />
                <span className="sl-name">
                  {s.name}
                  <small>{availabilityLabel(st)}</small>
                </span>
                <span className="sl-price">{st.soldOut ? '—' : money(st.price)}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function FieldView({ sector }) {
  const shot = useStore((s) => s.viewShots[sector.id]);
  const setCameraMode = useStore((s) => s.setCameraMode);
  return (
    <div className="fieldview">
      <div className="fv-frame">
        {shot ? (
          <img src={shot} alt={`Visão do gramado a partir do setor ${sector.name}`} />
        ) : (
          <div className="fv-loading">
            <span className="spinner" /> Gerando visão do setor…
          </div>
        )}
        <span className="fv-tag">Visão do setor</span>
      </div>
      <button className="btn btn-ghost btn-block" onClick={() => setCameraMode('pov')}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg>
        Ver do assento em 3D
      </button>
    </div>
  );
}

function SectorPanel({ matchId, sector, onClose }) {
  const st = sectorStatus(matchId, sector.id);
  const qty = useStore((s) => s.qty);
  const setQty = useStore((s) => s.setQty);
  const go = useStore((s) => s.go);
  const selectSector = useStore((s) => s.selectSector);
  const maxQty = Math.min(6, st.available);
  const q = Math.min(qty, Math.max(1, maxQty));
  const alternatives = st.soldOut
    ? SECTORS.filter((s) => s.id !== sector.id && s.tier === sector.tier && !sectorStatus(matchId, s.id).soldOut).slice(0, 3)
    : [];

  return (
    <aside className="sector-panel" key={sector.id} aria-label={`Setor ${sector.name}`}>
      <div className="sp-head">
        <div>
          <span className="sp-kicker">
            {TIER_LABEL[sector.tier]} · {sector.side}
            {sector.kind === 'vip' && <span className="tag tag-vip">VIP</span>}
            {sector.kind === 'visitor' && <span className="tag">Visitante</span>}
          </span>
          <h2>{sector.name}</h2>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Fechar setor e voltar à visão geral">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
        </button>
      </div>

      <div className="sp-scroll">
        <FieldView sector={sector} />

        <div className="sp-price">
          <div>
            <span className="label">Preço por ingresso</span>
            <strong className={st.soldOut ? 'strike' : ''}>{money(st.price)}</strong>
            <small>Meia-entrada: {money(st.price / 2)}</small>
          </div>
          <div className="sp-avail">
            <span className="label">{availabilityLabel(st)}</span>
            <AvailBar st={st} />
            <small>
              {st.soldOut ? 'Nenhum lugar livre' : `${st.available.toLocaleString('pt-BR')} de ${st.capacity.toLocaleString('pt-BR')} lugares`}
            </small>
          </div>
        </div>

        <p className="sp-blurb">{sector.blurb}</p>

        <div className="sp-map">
          <MiniMap matchId={matchId} selectedId={sector.id} onSelect={selectSector} showCone />
        </div>

        {st.soldOut && alternatives.length > 0 && (
          <div className="sp-alt">
            <span className="label">Setores com lugares no mesmo nível</span>
            {alternatives.map((a) => (
              <button key={a.id} className="chip" onClick={() => selectSector(a.id)}>
                {a.name} · {money(sectorStatus(matchId, a.id).price)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="sp-foot">
        {st.soldOut ? (
          <button className="btn btn-primary btn-block" disabled>
            Setor esgotado
          </button>
        ) : (
          <>
            <div className="qty">
              <span className="label">Ingressos</span>
              <div className="stepper">
                <button onClick={() => setQty(Math.max(1, q - 1))} disabled={q <= 1} aria-label="Diminuir quantidade">−</button>
                <output aria-live="polite">{q}</output>
                <button onClick={() => setQty(Math.min(maxQty, q + 1))} disabled={q >= maxQty} aria-label="Aumentar quantidade">+</button>
              </div>
              <span className="qty-total">{money(st.price * q)}</span>
            </div>
            <button
              className="btn btn-primary btn-block"
              onClick={() => {
                setQty(q);
                go('seats');
              }}
            >
              Escolher assentos
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

function Tooltip({ matchId, pos }) {
  const hoveredId = useStore((s) => s.hoveredId);
  const selectedId = useStore((s) => s.sectorId);
  if (!hoveredId || !pos || hoveredId === selectedId) return null;
  const s = SECTOR_BY_ID[hoveredId];
  const st = sectorStatus(matchId, s.id);
  return (
    <div className="tooltip" style={{ transform: `translate(${pos.x + 16}px, ${pos.y + 16}px)` }}>
      <strong>{s.name}</strong>
      <span>
        {st.soldOut ? 'Esgotado' : `${money(st.price)} · ${availabilityLabel(st).toLowerCase()}`}
      </span>
    </div>
  );
}

function Legend() {
  return (
    <div className="legend" aria-label="Legenda">
      <span><i className="sw std" />Disponível</span>
      <span><i className="sw vip" />VIP</span>
      <span><i className="sw sel" />Selecionado</span>
      <span><i className="sw off" />Esgotado</span>
    </div>
  );
}

function Controls() {
  const overview = useStore((s) => s.overview);
  const zoom = useStore((s) => s.zoom);
  const roof = useStore((s) => s.roof);
  const toggleRoof = useStore((s) => s.toggleRoof);
  const cameraMode = useStore((s) => s.cameraMode);
  return (
    <div className="controls" role="toolbar" aria-label="Controles da câmera">
      <button onClick={overview} className={cameraMode === 'overview' ? 'is-on' : ''} title="Visão geral">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="6" fill="none" stroke="currentColor" strokeWidth="2" /><rect x="8" y="9.5" width="8" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
        <span>Visão geral</span>
      </button>
      <button onClick={() => zoom(-1)} title="Afastar" aria-label="Afastar">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
      </button>
      <button onClick={() => zoom(1)} title="Aproximar" aria-label="Aproximar">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
      </button>
      <button onClick={toggleRoof} className={roof ? 'is-on' : ''} title="Mostrar ou ocultar cobertura" aria-pressed={roof}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11c3-4 15-4 18 0M5 11v7M19 11v7M9 18h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        <span>Cobertura</span>
      </button>
    </div>
  );
}

function PovBar({ sector, matchId }) {
  const setCameraMode = useStore((s) => s.setCameraMode);
  const zoom = useStore((s) => s.zoom);
  const go = useStore((s) => s.go);
  const st = sectorStatus(matchId, sector.id);
  return (
    <div className="povbar">
      <div className="pov-info">
        <span className="sp-kicker">Você está vendo do setor</span>
        <strong>{sector.name}</strong>
        <small>Arraste para olhar ao redor</small>
      </div>
      <div className="pov-actions">
        <button className="icon-btn" onClick={() => zoom(-1)} aria-label="Ampliar campo de visão">−</button>
        <button className="icon-btn" onClick={() => zoom(1)} aria-label="Reduzir campo de visão">+</button>
        <button className="btn btn-ghost" onClick={() => setCameraMode('sector')}>Sair da visão</button>
        {!st.soldOut && (
          <button className="btn btn-primary" onClick={() => go('seats')}>
            Escolher assentos
          </button>
        )}
      </div>
    </div>
  );
}

export default function StadiumPage() {
  const matchId = useStore((s) => s.matchId);
  const sectorId = useStore((s) => s.sectorId);
  const cameraMode = useStore((s) => s.cameraMode);
  const selectSector = useStore((s) => s.selectSector);
  const go = useStore((s) => s.go);
  const match = MATCH_BY_ID[matchId];
  const sector = sectorId ? SECTOR_BY_ID[sectorId] : null;
  const [pos, setPos] = useState(null);
  const [listOpen, setListOpen] = useState(false);
  const [hint, setHint] = useState(true);
  const [ready, setReady] = useState(false);
  const stageRef = useRef();

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 350);
    const h = setTimeout(() => setHint(false), 7000);
    const onKey = (e) => {
      if (e.key === 'Escape') {
        const st = useStore.getState();
        if (st.cameraMode === 'pov') st.setCameraMode('sector');
        else if (st.sectorId) st.selectSector(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      clearTimeout(h);
      window.removeEventListener('keydown', onKey);
      document.body.style.cursor = '';
    };
  }, []);

  const pick = (id) => {
    selectSector(id);
    setListOpen(false);
    setHint(false);
  };

  const pov = cameraMode === 'pov' && sector;

  return (
    <div className={`explorer ${pov ? 'is-pov' : ''} ${sector ? 'has-sector' : ''}`}>
      <div
        className="stage"
        ref={stageRef}
        onPointerMove={(e) => {
          const r = stageRef.current.getBoundingClientRect();
          setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
        }}
        onPointerDown={() => setHint(false)}
        onPointerLeave={() => setPos(null)}
      >
        <ExplorerCanvas matchId={matchId} />
        {!pov && <Tooltip matchId={matchId} pos={pos} />}
        <div className={`stage-veil ${ready ? 'is-gone' : ''}`} />
      </div>

      <div className="topbar">
        <div className="tb-left">
          <button className="icon-btn" onClick={() => go('home')} aria-label="Voltar para a página inicial">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <Logo onClick={() => go('home')} />
        </div>
        <MatchBar match={match} />
        <Steps current={0} />
      </div>

      {!pov && (
        <div className={`list-panel ${listOpen ? 'is-open' : ''}`}>
          <div className="lp-head">
            <h3>Setores</h3>
            <span className="lp-sub">Clique no estádio ou na lista</span>
          </div>
          <SectorList matchId={matchId} onPick={pick} />
        </div>
      )}

      {!pov && (
        <button className="list-toggle btn btn-ghost" onClick={() => setListOpen((v) => !v)} aria-expanded={listOpen}>
          {listOpen ? 'Fechar lista' : 'Lista de setores'}
        </button>
      )}

      {sector && !pov && <SectorPanel matchId={matchId} sector={sector} onClose={() => selectSector(null)} />}
      {pov && <PovBar sector={sector} matchId={matchId} />}

      {!pov && (
        <div className="bottom-dock">
          <Legend />
          <Controls />
        </div>
      )}

      {hint && !sector && (
        <div className="hint">
          <span><kbd>Arraste</kbd> para girar</span>
          <span><kbd>Role</kbd> para aproximar</span>
          <span><kbd>Clique</kbd> em um setor</span>
        </div>
      )}

      <div className="demo-mini">Demonstração · preços fictícios</div>
    </div>
  );
}
