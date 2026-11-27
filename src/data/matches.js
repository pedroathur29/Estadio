import { seeded } from '../lib/rng';
import { SECTORS, SECTOR_BY_ID, seatLayout } from './sectors';

// Fictional clubs — names and crests are invented for this demo.
export const TEAMS = {
  aurora: { id: 'aurora', name: 'Aurora FC', city: 'Vale do Sol', short: 'AUR', primary: '#f2c14e', secondary: '#121826', pattern: 'chevron', mark: 'A' },
  tempesta: { id: 'tempesta', name: 'Tempesta SC', city: 'Porto Azul', short: 'TMP', primary: '#3d7bff', secondary: '#e8eefc', pattern: 'stripes', mark: 'T' },
  serra: { id: 'serra', name: 'Leões da Serra', city: 'Alto Serrano', short: 'LDS', primary: '#e0483e', secondary: '#1b1b1f', pattern: 'half', mark: 'L' },
  maritimo: { id: 'maritimo', name: 'Atlético Marítimo', city: 'Costa Clara', short: 'ATM', primary: '#14b8a6', secondary: '#0b1d24', pattern: 'band', mark: 'M' },
  unidos: { id: 'unidos', name: 'Unidos do Norte', city: 'Nova Fronteira', short: 'UDN', primary: '#f5f5f5', secondary: '#1f2a44', pattern: 'cross', mark: 'U' },
  imperial: { id: 'imperial', name: 'Imperial EC', city: 'São Belmonte', short: 'IMP', primary: '#8b5cf6', secondary: '#f4e9c9', pattern: 'chevron', mark: 'I' },
  ferroviario: { id: 'ferroviario', name: 'Ferroviário AC', city: 'Trilhos', short: 'FAC', primary: '#22c55e', secondary: '#0d1a12', pattern: 'stripes', mark: 'F' },
  vulcano: { id: 'vulcano', name: 'Vulcano FC', city: 'Pedra Negra', short: 'VUL', primary: '#ff7a1a', secondary: '#160d07', pattern: 'band', mark: 'V' },
};

function daysFromNow(days, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export const MATCHES = [
  {
    id: 'aur-tmp', home: 'aurora', away: 'tempesta', competition: 'Liga Nacional', round: 'rodada 34, o clássico',
    date: daysFromNow(6, 21, 30), demand: 0.86, soldOut: ['sul-inf', 'norte-sup'], featured: true,
  },
  {
    id: 'aur-lds', home: 'aurora', away: 'serra', competition: 'Copa Continental', round: 'quartas de final, jogo de ida',
    date: daysFromNow(11, 19, 0), demand: 0.74, soldOut: ['camarotes'],
  },
  {
    id: 'aur-atm', home: 'aurora', away: 'maritimo', competition: 'Liga Nacional', round: 'rodada 35',
    date: daysFromNow(15, 16, 0), demand: 0.48, soldOut: [],
  },
  {
    id: 'aur-udn', home: 'aurora', away: 'unidos', competition: 'Copa do País', round: 'semifinal',
    date: daysFromNow(20, 21, 45), demand: 0.66, soldOut: ['canto-se'],
  },
  {
    id: 'aur-imp', home: 'aurora', away: 'imperial', competition: 'Liga Nacional', round: 'rodada 36',
    date: daysFromNow(27, 18, 30), demand: 0.42, soldOut: [],
  },
  {
    id: 'aur-vul', home: 'aurora', away: 'vulcano', competition: 'Liga Nacional', round: 'rodada 38, a última',
    date: daysFromNow(34, 16, 0), demand: 0.92, soldOut: ['sul-inf', 'vip-prime', 'norte-inf'],
  },
];

export const MATCH_BY_ID = Object.fromEntries(MATCHES.map((m) => [m.id, m]));
export const FEATURED = MATCHES.find((m) => m.featured);

export const VENUE = {
  name: 'Arena Horizonte',
  city: 'Vale do Sol',
  opened: 2019,
};

const statusCache = new Map();

/** Fictional price and availability of one sector for one match. */
export function sectorStatus(matchId, sectorId) {
  const key = `${matchId}:${sectorId}`;
  if (statusCache.has(key)) return statusCache.get(key);
  const match = MATCH_BY_ID[matchId];
  const sector = SECTOR_BY_ID[sectorId];
  const { capacity } = seatLayout(sector);
  const rnd = seeded(matchId, sectorId);
  const soldOut = match.soldOut.includes(sectorId);
  const multiplier = 0.85 + match.demand * 0.45;
  const price = Math.round((sector.base * multiplier) / 5) * 5 - 0.1;
  let ratio = soldOut ? 0 : Math.max(0.04, Math.min(0.92, 1 - match.demand + (rnd() - 0.5) * 0.5));
  const available = soldOut ? 0 : Math.max(6, Math.round(capacity * ratio));
  ratio = available / capacity;
  const result = { price, capacity, available, ratio, soldOut };
  statusCache.set(key, result);
  return result;
}

export function minPrice(matchId) {
  return Math.min(...SECTORS.filter((s) => !sectorStatus(matchId, s.id).soldOut).map((s) => sectorStatus(matchId, s.id).price));
}

/** How full a match is, summed over every sector. */
export function matchAvailability(matchId) {
  const all = SECTORS.map((s) => sectorStatus(matchId, s.id));
  const ratio = all.reduce((n, s) => n + s.available, 0) / all.reduce((n, s) => n + s.capacity, 0);
  if (ratio < 0.15) return { ratio, tone: 'low', label: 'Últimos lugares' };
  if (ratio < 0.4) return { ratio, tone: 'mid', label: 'Procura alta' };
  return { ratio, tone: 'ok', label: 'Bastante lugar' };
}

export function totalCapacity() {
  return SECTORS.reduce((n, s) => n + seatLayout(s).capacity, 0);
}

/**
 * Deterministic map of occupied seats for the seat picker.
 * The number of free seats is exactly `sectorStatus(...).available`, so the map
 * always agrees with what the sector panel announces.
 */
export function occupiedSeats(matchId, sectorId) {
  const { ratio, available } = sectorStatus(matchId, sectorId);
  const rnd = seeded('seats', matchId, sectorId);
  const layout = seatLayout(SECTOR_BY_ID[sectorId]);
  const taken = [];
  const free = [];
  layout.rows.forEach((row, r) => {
    // clustered occupancy: neighbours of taken seats are more likely to be taken
    let prev = false;
    row.seats.forEach((_, i) => {
      const p = prev ? Math.min(0.95, 1 - ratio + 0.25) : 1 - ratio - 0.05;
      const isTaken = rnd() < p;
      (isTaken ? taken : free).push(`${r}-${i}`);
      prev = isTaken;
    });
  });
  // settle the count: flip randomly chosen seats until exactly `available` are free
  const flip = (from, to, n) => {
    for (let k = 0; k < n && from.length; k++) {
      const j = Math.floor(rnd() * from.length);
      to.push(from[j]);
      from[j] = from[from.length - 1];
      from.pop();
    }
  };
  if (free.length > available) flip(free, taken, free.length - available);
  else if (free.length < available) flip(taken, free, available - free.length);
  return new Set(taken);
}
