import Crest from './Crest';
import { TEAMS } from '../data/matches';
import { fmtShort, fmtTime } from '../lib/format';

/** Compact match identification used on top of the 3D screens. */
export default function Matchbar({ match }) {
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
        {fmtShort(match.date)} às {fmtTime(match.date)}
      </span>
    </div>
  );
}
