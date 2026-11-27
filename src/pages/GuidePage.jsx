import { useState } from 'react';
import MiniMap from '../components/MiniMap';
import { Header } from '../components/Chrome';
import { ACCESS, ALLOWED, ARRIVE, FAQ, FORBIDDEN, GATES, gateFor } from '../data/content';
import { VENUE } from '../data/matches';
import { SECTORS, SECTOR_BY_ID } from '../data/sectors';

const SECTIONS = [
  ['portoes', 'Portões'],
  ['chegar', 'Como chegar'],
  ['levar', 'O que levar'],
  ['acessibilidade', 'Acessibilidade'],
  ['duvidas', 'Dúvidas'],
];

function GateFinder() {
  const [id, setId] = useState('leste-inf');
  const gate = gateFor(SECTOR_BY_ID[id]);
  return (
    <div className="gate-finder">
      <div>
        <label className="field">
          <span>Qual é o seu setor?</span>
          <select value={id} onChange={(e) => setId(e.target.value)}>
            {SECTORS.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <div className="gate-answer" role="status">
          <strong>{gate.id}</strong>
          <p>
            Entre pelo {gate.name}.<br />
            {gate.access}.
          </p>
        </div>
        <p className="fine">Os portões abrem duas horas antes do jogo.</p>
      </div>
      <MiniMap matchId={null} selectedId={id} onSelect={setId} />
    </div>
  );
}

export default function GuidePage() {
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <>
      <Header />
      <main className="page wrap">
        <h1>Dia de jogo</h1>
        <p className="page-sub">Tudo o que vale saber antes de ir à {VENUE.name}. As informações são fictícias.</p>
        <nav className="page-nav" aria-label="Nesta página">
          {SECTIONS.map(([id, label]) => (
            <button key={id} onClick={() => jump(id)}>{label}</button>
          ))}
        </nav>

        <section id="portoes" className="guide-block">
          <h2>Por onde entrar</h2>
          <GateFinder />
          <table className="price-table">
            <caption>Todos os portões</caption>
            <thead className="sr-only">
              <tr><th scope="col">Portão</th><th scope="col">Acesso</th><th scope="col">Lados</th></tr>
            </thead>
            <tbody>
              {GATES.map((g) => (
                <tr key={g.id}>
                  <th scope="row">{g.name}</th>
                  <td>{g.access}</td>
                  <td>{g.sides.join(' e ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section id="chegar" className="guide-block">
          <h2>Como chegar</h2>
          <dl className="rows rows-wide">
            {ARRIVE.map(([how, text]) => (
              <div key={how}><dt>{how}</dt><dd>{text}</dd></div>
            ))}
          </dl>
        </section>

        <section id="levar" className="guide-block">
          <h2>O que levar</h2>
          <div className="two-lists">
            <div>
              <h3>Pode entrar</h3>
              <ul className="list-yes">{ALLOWED.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
            <div>
              <h3>Fica de fora</h3>
              <ul className="list-no">{FORBIDDEN.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          </div>
        </section>

        <section id="acessibilidade" className="guide-block">
          <h2>Acessibilidade</h2>
          <ul className="list-plain">{ACCESS.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>

        <section id="duvidas" className="guide-block">
          <h2>Dúvidas frequentes</h2>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
