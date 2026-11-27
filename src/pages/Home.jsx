import { useEffect, useState } from 'react';
import HeroStage from '../components/HeroStage';
import Crest from '../components/Crest';
import Fixture from '../components/Fixture';
import MiniMap from '../components/MiniMap';
import { Header } from '../components/Chrome';
import { FEATURED, MATCHES, TEAMS, VENUE, minPrice, sectorStatus, totalCapacity } from '../data/matches';
import { PLANS } from '../data/content';
import { SECTORS } from '../data/sectors';
import { fmtLong, fmtTime, money } from '../lib/format';
import { useStore } from '../store';

/** "Faltam 6 dias e 20 horas", refreshed once a minute. */
function useTimeLeft(date) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  const minutes = Math.max(0, Math.floor((date.getTime() - now) / 60000));
  const d = Math.floor(minutes / 1440);
  const h = Math.floor(minutes / 60) % 24;
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  if (!minutes) return 'A bola já está rolando';
  if (d) return `Faltam ${plural(d, 'dia')} e ${plural(h, 'hora')}`;
  return `Faltam ${plural(h, 'hora')} e ${plural(minutes % 60, 'minuto')}`;
}

function Hero() {
  const openMatch = useStore((s) => s.openMatch);
  const go = useStore((s) => s.go);
  const m = FEATURED;
  const home = TEAMS[m.home];
  const away = TEAMS[m.away];
  const left = useTimeLeft(m.date);
  return (
    <section className="hero night">
      <div className="hero-canvas" aria-hidden="true">
        <HeroStage matchId={m.id} />
      </div>
      <div className="hero-shade" />
      <div className="wrap hero-content">
        <h1 className="poster">
          <span className="poster-team">
            <Crest team={home} size={72} />
            {home.name}
          </span>
          <span className="poster-x">contra</span>
          <span className="poster-team">
            <Crest team={away} size={72} />
            {away.name}
          </span>
        </h1>

        <div className="hero-ticket">
          <dl className="ht-info">
            <div>
              <dt>{m.competition}, {m.round}</dt>
              <dd>{fmtLong(m.date)}</dd>
            </div>
            <div>
              <dt>{VENUE.name}</dt>
              <dd>{fmtTime(m.date)}</dd>
            </div>
          </dl>
          <div className="ht-stub">
            <span>a partir de <b>{money(minPrice(m.id))}</b></span>
            <button className="btn btn-primary btn-lg" onClick={() => openMatch(m.id)}>
              Comprar ingresso
            </button>
          </div>
        </div>

        <p className="hero-left">
          {left}. <button className="link" onClick={() => go('match', m.id)}>Ver preços por setor</button>
        </p>
      </div>
    </section>
  );
}

const SORTS = {
  date: { label: 'Data', compare: (a, b) => a.date - b.date },
  price: { label: 'Menor preço', compare: (a, b) => minPrice(a.id) - minPrice(b.id) },
};

/** Lower case without accents, so "maritimo" finds "Marítimo". */
const fold = (text) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

function Schedule() {
  const [competition, setCompetition] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('date');
  const competitions = [...new Set(MATCHES.map((m) => m.competition))];
  const list = MATCHES.filter((m) => {
    const away = TEAMS[m.away];
    return (!competition || m.competition === competition) && fold(`${away.name} ${away.city}`).includes(fold(query.trim()));
  }).sort(SORTS[sort].compare);
  const clear = () => {
    setCompetition('');
    setQuery('');
  };

  return (
    <section id="jogos" className="section">
      <div className="wrap">
        <div className="section-head">
          <h2>Jogos na Arena</h2>
          <p>Todos com mando do Aurora FC.</p>
        </div>

        <div className="filters">
          <div className="filter-tabs" role="group" aria-label="Filtrar por competição">
            {['', ...competitions].map((c) => (
              <button key={c} aria-pressed={competition === c} onClick={() => setCompetition(c)}>
                {c || 'Todos'}
              </button>
            ))}
          </div>
          <label className="field">
            <span>Adversário ou cidade</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex.: Vulcano" />
          </label>
          <label className="field field-sort">
            <span>Ordenar por</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {Object.entries(SORTS).map(([id, s]) => (
                <option key={id} value={id}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>

        <p className="sr-only" role="status">
          {list.length} {list.length === 1 ? 'jogo encontrado' : 'jogos encontrados'}
        </p>

        {list.length ? (
          <div className="fixtures">
            {list.map((m) => (
              <Fixture key={m.id} match={m} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>Nenhum jogo com esse filtro</h3>
            <p>Confira o nome do adversário ou volte a ver a agenda inteira.</p>
            <button className="btn btn-primary" onClick={clear}>Ver todos os jogos</button>
          </div>
        )}
      </div>
    </section>
  );
}

function Arena() {
  const openMatch = useStore((s) => s.openMatch);
  const selectSector = useStore((s) => s.selectSector);
  const [hovered, setHovered] = useState(null);
  const sector = SECTORS.find((s) => s.id === hovered);
  const st = sector && sectorStatus(FEATURED.id, sector.id);
  const open = (id) => {
    openMatch(FEATURED.id);
    if (id) selectSector(id);
  };
  return (
    <section id="estadio" className="section section-paper">
      <div className="wrap arena-grid">
        <div>
          <h2>Escolha de onde ver o jogo</h2>
          <p className="lead">
            A {VENUE.name} tem {totalCapacity().toLocaleString('pt-BR')} lugares cobertos em {SECTORS.length} setores. Toque
            num setor do mapa para ver o campo dali antes de comprar.
          </p>
          <dl className="map-readout">
            <div>
              <dt>Setor</dt>
              <dd>{sector ? sector.name : 'Passe o cursor sobre o mapa'}</dd>
            </div>
            <div>
              <dt>No clássico</dt>
              <dd>{!sector ? '—' : st.soldOut ? 'Esgotado' : money(st.price)}</dd>
            </div>
          </dl>
          <button className="btn btn-dark" onClick={() => open()}>
            Abrir o estádio em 3D
          </button>
        </div>
        <MiniMap matchId={FEATURED.id} hoveredId={hovered} onHover={setHovered} onSelect={open} />
      </div>
    </section>
  );
}

function Extras() {
  const go = useStore((s) => s.go);
  return (
    <>
      <section className="band">
        <div className="wrap band-inner">
          <div>
            <h2>Sócio paga menos</h2>
            <p>
              Até {Math.max(...PLANS.map((p) => p.off)) * 100}% de desconto em um ingresso por pedido, a partir de{' '}
              {money(Math.min(...PLANS.map((p) => p.price)))} por mês.
            </p>
          </div>
          <button className="btn btn-dark btn-lg" onClick={() => go('plans')}>Comparar planos</button>
        </div>
      </section>
      <section className="section">
        <div className="wrap matchday">
          <h2>Antes de sair de casa</h2>
          <ul>
            {[
              ['Como chegar', 'Trem, ônibus, estacionamento e bicicletário.'],
              ['Portões e horários', 'Descubra por onde entrar com o seu setor.'],
              ['O que pode levar', 'Evite perder tempo na revista.'],
            ].map(([title, text]) => (
              <li key={title}>
                <button onClick={() => go('guide')}>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

export default function Home() {
  return (
    <>
      <Header transparent />
      <main>
        <Hero />
        <Schedule />
        <Arena />
        <Extras />
      </main>
    </>
  );
}
