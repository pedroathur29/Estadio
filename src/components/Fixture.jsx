import Crest from './Crest';
import { TEAMS, matchAvailability, minPrice } from '../data/matches';
import { fmtDay, fmtMonth, fmtTime, fmtWeekday, money } from '../lib/format';
import { useStore } from '../store';

/** A match in the schedule, drawn as a ticket: date, game, and a tear-off stub with the price. */
export default function Fixture({ match }) {
  const openMatch = useStore((s) => s.openMatch);
  const go = useStore((s) => s.go);
  const home = TEAMS[match.home];
  const away = TEAMS[match.away];
  const status = matchAvailability(match.id);
  return (
    <article className="fixture" style={{ '--team': away.primary, '--team-2': away.secondary }}>
      <div className="fx-date">
        <span>{fmtWeekday(match.date)}</span>
        <strong>{fmtDay(match.date)}</strong>
        <span>{fmtMonth(match.date)}</span>
      </div>
      <div className="fx-body">
        <h3 className="fx-teams">
          <Crest team={home} size={30} />
          <span>{home.name}</span>
          <span className="fx-x">×</span>
          <Crest team={away} size={30} />
          <span>{away.name}</span>
        </h3>
        <p className="fx-meta">
          {match.competition}, {match.round}
        </p>
        <p className="fx-meta">
          <b>{fmtTime(match.date)}</b>
          <span className={`status status-${status.tone}`}>{status.label}</span>
        </p>
      </div>
      <div className="fx-stub">
        <p className="fx-price">
          a partir de <b>{money(minPrice(match.id))}</b>
        </p>
        <button className="btn btn-primary" onClick={() => openMatch(match.id)}>
          Comprar<span className="sr-only"> ingresso para {home.name} contra {away.name}</span>
        </button>
        <button className="link" onClick={() => go('match', match.id)}>
          Ver preços<span className="sr-only"> de {home.name} contra {away.name}</span>
        </button>
      </div>
    </article>
  );
}
