import Crest from '../components/Crest';
import { Header } from '../components/Chrome';
import { MATCH_BY_ID, TEAMS, VENUE, matchAvailability, sectorStatus } from '../data/matches';
import { GATES_OPEN_MS, gateFor, recentForm } from '../data/content';
import { SECTORS } from '../data/sectors';
import { downloadEvent } from '../lib/calendar';
import { fmtLong, fmtTime, money } from '../lib/format';
import { useStore } from '../store';

const TIERS = [
  ['lower', 'Anel inferior'],
  ['box', 'Camarotes'],
  ['upper', 'Anel superior'],
];

const RESULT = { V: 'Vitória', E: 'Empate', D: 'Derrota' };

function Form({ team }) {
  return (
    <div className="form-row">
      <span>{team.name}</span>
      <ol aria-label={`Últimos cinco jogos do ${team.name}, do mais antigo ao mais recente`}>
        {recentForm(team.id).map((r, i) => (
          <li key={i} className={`res res-${r}`} title={RESULT[r]}>
            <span aria-hidden="true">{r}</span>
            <span className="sr-only">{RESULT[r]}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function MatchPage() {
  const id = useStore((s) => s.pageId);
  const openMatch = useStore((s) => s.openMatch);
  const buySector = useStore((s) => s.buySector);
  const go = useStore((s) => s.go);
  const m = MATCH_BY_ID[id];
  if (!m) return null;
  const home = TEAMS[m.home];
  const away = TEAMS[m.away];
  const status = matchAvailability(m.id);
  const opens = new Date(m.date.getTime() - GATES_OPEN_MS);

  const addToCalendar = () =>
    downloadEvent({
      uid: `jogo-${m.id}`,
      title: `${home.name} x ${away.name}`,
      start: m.date,
      location: VENUE.name,
      description: 'Jogo fictício do projeto demonstrativo Arena Pass.',
    });

  return (
    <>
      <Header />
      <main>
        <section className="page-head night" style={{ '--team': home.primary, '--team-2': away.primary }}>
          <div className="wrap">
            <button className="back-link" onClick={() => go('home')}>Todos os jogos</button>
            <h1 className="versus-title">
              <span><Crest team={home} size={56} />{home.name}</span>
              <span className="poster-x">contra</span>
              <span><Crest team={away} size={56} />{away.name}</span>
            </h1>
            <p className="page-sub">
              {m.competition}, {m.round}. {fmtLong(m.date)} às {fmtTime(m.date)}.
            </p>
            <div className="head-actions">
              <button className="btn btn-primary btn-lg" onClick={() => openMatch(m.id)}>Escolher no estádio 3D</button>
              <button className="btn btn-ghost btn-lg" onClick={addToCalendar}>Salvar no calendário</button>
            </div>
          </div>
        </section>

        <div className="wrap match-grid">
          <section aria-labelledby="precos">
            <div className="section-head compact">
              <h2 id="precos">Preços por setor</h2>
              <p className={`status status-${status.tone}`}>{status.label}</p>
            </div>
            {TIERS.map(([tier, title]) => (
              <table className="price-table" key={tier}>
                <caption>{title}</caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">Setor</th>
                    <th scope="col">Lugares livres</th>
                    <th scope="col">Inteira</th>
                    <th scope="col">Comprar</th>
                  </tr>
                </thead>
                <tbody>
                  {SECTORS.filter((s) => s.tier === tier).map((s) => {
                    const st = sectorStatus(m.id, s.id);
                    return (
                      <tr key={s.id} className={st.soldOut ? 'is-off' : ''}>
                        <th scope="row">
                          {s.name}
                          <small>Portão {gateFor(s).id}</small>
                        </th>
                        <td className="pt-free">
                          {st.soldOut ? 'Esgotado' : `${st.available.toLocaleString('pt-BR')} livres`}
                          <span className="meter" aria-hidden="true">
                            <i style={{ width: `${Math.round(st.ratio * 100)}%` }} className={st.ratio < 0.15 ? 'low' : ''} />
                          </span>
                        </td>
                        <td className="pt-price">{money(st.price)}</td>
                        <td className="pt-buy">
                          <button className="btn btn-outline" disabled={st.soldOut} onClick={() => buySector(m.id, s.id)}>
                            {st.soldOut ? 'Esgotado' : 'Escolher'}
                            <span className="sr-only"> {s.name}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ))}
          </section>

          <aside className="side">
            <section className="panel">
              <h2>No dia do jogo</h2>
              <dl className="rows">
                <div><dt>Portões abrem</dt><dd>{fmtTime(opens)}</dd></div>
                <div><dt>Bola rola</dt><dd>{fmtTime(m.date)}</dd></div>
                <div><dt>Local</dt><dd>{VENUE.name}</dd></div>
                <div><dt>Cidade</dt><dd>{VENUE.city}</dd></div>
              </dl>
              <button className="link" onClick={() => go('guide')}>Como chegar e o que levar</button>
            </section>
            <section className="panel">
              <h2>Últimos cinco jogos</h2>
              <Form team={home} />
              <Form team={away} />
              <p className="fine">V vitória, E empate, D derrota. Resultados fictícios.</p>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
