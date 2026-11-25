import { useEffect, useState } from 'react';
import HeroStage from '../components/HeroStage';
import Crest from '../components/Crest';
import MiniMap from '../components/MiniMap';
import { Header } from '../components/Chrome';
import { FEATURED, MATCHES, TEAMS, VENUE, minPrice, totalCapacity } from '../data/matches';
import { SECTORS } from '../data/sectors';
import { fmtLong, fmtTime, fmtDay, fmtMonth, fmtShort, money } from '../lib/format';
import { useStore } from '../store';

function useCountdown(date) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, date.getTime() - now);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor(diff / 3600000) % 24,
    m: Math.floor(diff / 60000) % 60,
    s: Math.floor(diff / 1000) % 60,
  };
}

function Countdown({ date }) {
  const c = useCountdown(date);
  const cell = (v, l) => (
    <div className="cd-cell">
      <strong>{String(v).padStart(2, '0')}</strong>
      <span>{l}</span>
    </div>
  );
  return (
    <div className="countdown" aria-label="Tempo até o início da partida">
      {cell(c.d, 'dias')}
      {cell(c.h, 'horas')}
      {cell(c.m, 'min')}
      {cell(c.s, 'seg')}
    </div>
  );
}

function Hero() {
  const openMatch = useStore((s) => s.openMatch);
  const m = FEATURED;
  const home = TEAMS[m.home];
  const away = TEAMS[m.away];
  return (
    <section className="hero">
      <div className="hero-canvas" aria-hidden="true">
        <HeroStage matchId={m.id} />
      </div>
      <div className="hero-shade" />
      <div className="wrap hero-content">
        <div className="eyebrow">
          <span className="live-dot" /> {m.competition} · {m.round}
        </div>
        <h1 className="sr-only">{home.name} × {away.name} — ingressos</h1>
        <div className="hero-teams">
          <div className="hero-team">
            <Crest team={home} size={84} />
            <div>
              <p className="team-name">{home.name}</p>
              <span className="team-meta">Mandante · {home.city}</span>
            </div>
          </div>
          <div className="versus">×</div>
          <div className="hero-team">
            <Crest team={away} size={84} />
            <div>
              <p className="team-name">{away.name}</p>
              <span className="team-meta">Visitante · {away.city}</span>
            </div>
          </div>
        </div>
        <div className="hero-info">
          <div>
            <span className="label">Data</span>
            <strong>{fmtLong(m.date)}</strong>
          </div>
          <div>
            <span className="label">Horário</span>
            <strong>{fmtTime(m.date)}</strong>
          </div>
          <div>
            <span className="label">Local</span>
            <strong>{VENUE.name}</strong>
          </div>
        </div>
        <Countdown date={m.date} />
        <div className="hero-cta">
          <button className="btn btn-primary btn-lg" onClick={() => openMatch(m.id)}>
            Escolher ingressos
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span className="from">
            a partir de <b>{money(minPrice(m.id))}</b>
          </span>
        </div>
      </div>
      <div className="hero-hint" aria-hidden="true">
        <span>Estádio renderizado em tempo real</span>
      </div>
    </section>
  );
}

function MatchCard({ m, index }) {
  const openMatch = useStore((s) => s.openMatch);
  const home = TEAMS[m.home];
  const away = TEAMS[m.away];
  const hot = m.demand > 0.8;
  return (
    <article className="match-card" style={{ '--i': index }}>
      <div className="mc-date">
        <strong>{fmtDay(m.date)}</strong>
        <span>{fmtMonth(m.date)}</span>
      </div>
      <div className="mc-body">
        <div className="mc-top">
          <span className="mc-comp">{m.competition}</span>
          {hot && <span className="tag tag-hot">Alta procura</span>}
        </div>
        <div className="mc-teams">
          <div className="mc-team">
            <Crest team={home} size={34} />
            <span>{home.name}</span>
          </div>
          <div className="mc-team">
            <Crest team={away} size={34} />
            <span>{away.name}</span>
          </div>
        </div>
        <div className="mc-meta">
          {fmtShort(m.date)} · {fmtTime(m.date)} · {m.round}
        </div>
      </div>
      <div className="mc-side">
        <span className="mc-from">
          a partir de <b>{money(minPrice(m.id))}</b>
        </span>
        <button className="btn btn-outline" onClick={() => openMatch(m.id)}>
          Ingressos
        </button>
      </div>
    </article>
  );
}

function Upcoming() {
  return (
    <section id="jogos" className="section">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="kicker">Agenda</span>
            <h2>Próximos jogos na Arena</h2>
          </div>
          <p className="section-sub">Escolha a partida, explore o estádio em 3D e veja o campo do seu lugar antes de comprar.</p>
        </div>
        <div className="match-list">
          {MATCHES.map((m, i) => (
            <MatchCard key={m.id} m={m} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StadiumSection() {
  const openMatch = useStore((s) => s.openMatch);
  const [hovered, setHovered] = useState(null);
  const cap = totalCapacity();
  const hoveredSector = SECTORS.find((s) => s.id === hovered);
  return (
    <section id="estadio" className="section section-alt">
      <div className="wrap stadium-grid">
        <div>
          <span className="kicker">O estádio</span>
          <h2>{VENUE.name}</h2>
          <p className="lead">
            Dois anéis de arquibancada, camarotes entre os níveis e cobertura translúcida sobre todos os lugares.
            Cada um dos {SECTORS.length} setores pode ser explorado em 3D, com preço, disponibilidade e a visão real do gramado.
          </p>
          <dl className="stats">
            <div>
              <dt>Capacidade</dt>
              <dd>{cap.toLocaleString('pt-BR')}</dd>
            </div>
            <div>
              <dt>Setores</dt>
              <dd>{SECTORS.length}</dd>
            </div>
            <div>
              <dt>Gramado</dt>
              <dd>105×68 m</dd>
            </div>
            <div>
              <dt>Inauguração</dt>
              <dd>{VENUE.opened}</dd>
            </div>
          </dl>
          <button className="btn btn-primary" onClick={() => openMatch(FEATURED.id)}>
            Explorar em 3D
          </button>
        </div>
        <div className="map-card">
          <MiniMap matchId={null} hoveredId={hovered} onHover={setHovered} onSelect={() => openMatch(FEATURED.id)} />
          <div className="map-caption">{hoveredSector ? `${hoveredSector.name} · ${hoveredSector.side}` : 'Passe o cursor sobre um setor'}</div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ['Escolha o jogo', 'Veja datas, horários e o menor preço disponível de cada partida.'],
    ['Explore o estádio', 'Gire, aproxime e selecione setores diretamente no modelo 3D.'],
    ['Veja do seu lugar', 'Entre na perspectiva do setor e confira a visão do gramado.'],
    ['Escolha os assentos', 'Marque os lugares no mapa, revise o resumo e confirme.'],
  ];
  return (
    <section id="como-funciona" className="section">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="kicker">Como funciona</span>
            <h2>Do jogo ao assento em quatro passos</h2>
          </div>
        </div>
        <ol className="how">
          {steps.map(([t, d], i) => (
            <li key={t}>
              <span className="how-n">0{i + 1}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <span>© {new Date().getFullYear()} Arena Pass · Projeto demonstrativo de portfólio</span>
        <span>Clubes, estádio, preços e disponibilidade são fictícios. Nenhuma venda, cadastro ou pagamento é realizado.</span>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Header transparent />
      <main>
        <Hero />
        <Upcoming />
        <StadiumSection />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}
