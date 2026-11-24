import { segRange, sampleRange, edgeAt, rowPositions, PERIMETER, LOWER } from '../lib/geometry';

const mid = (i) => segRange(i, 0.5, 0.5)[0];
const rng = (i, a = 0, b = 1) => segRange(i, a, b);

// Sector catalogue. `range` is an arc-length interval on the bowl's inner edge.
export const SECTORS = [
  // ── Lower tier ───────────────────────────────────────────────
  {
    id: 'oeste-inf-a', name: 'Oeste Inferior A', code: 'OIA', tier: 'lower', side: 'Oeste', kind: 'standard',
    base: 210, range: rng(0, 0, 0.32),
    blurb: 'Lateral da tribuna principal, próximo à linha de fundo norte. Visão ampla do campo de ataque.',
  },
  {
    id: 'vip-prime', name: 'VIP Prime', code: 'VIP', tier: 'lower', side: 'Oeste', kind: 'vip',
    base: 520, range: rng(0, 0.32, 0.68),
    blurb: 'Cadeiras estofadas na linha do meio-campo, ao lado dos bancos de reservas. Acesso ao lounge exclusivo.',
  },
  {
    id: 'oeste-inf-b', name: 'Oeste Inferior B', code: 'OIB', tier: 'lower', side: 'Oeste', kind: 'standard',
    base: 210, range: rng(0, 0.68, 1),
    blurb: 'Lateral da tribuna principal, próximo à linha de fundo sul. Ótima leitura das jogadas pela ponta.',
  },
  {
    id: 'canto-so', name: 'Canto Sudoeste', code: 'CSO', tier: 'lower', side: 'Sudoeste', kind: 'standard',
    base: 120, range: rng(1),
    blurb: 'Curva entre a tribuna principal e o gol sul. Visão diagonal, ideal para lances de escanteio.',
  },
  {
    id: 'sul-inf', name: 'Sul Inferior', code: 'SI', tier: 'lower', side: 'Sul', kind: 'standard',
    base: 95, range: rng(2),
    blurb: 'Atrás do gol sul. Setor da torcida organizada: em pé, com bandeiras e muita energia.',
  },
  {
    id: 'canto-se', name: 'Setor Visitante', code: 'VIS', tier: 'lower', side: 'Sudeste', kind: 'visitor',
    base: 110, range: rng(3),
    blurb: 'Área reservada à torcida visitante, com entrada e circulação independentes.',
  },
  {
    id: 'leste-inf', name: 'Leste Inferior', code: 'LI', tier: 'lower', side: 'Leste', kind: 'standard',
    base: 170, range: rng(4),
    blurb: 'Lateral oposta à tribuna, de frente para as câmeras de TV. Toda a extensão do gramado à vista.',
  },
  {
    id: 'canto-ne', name: 'Canto Nordeste', code: 'CNE', tier: 'lower', side: 'Nordeste', kind: 'standard',
    base: 120, range: rng(5),
    blurb: 'Curva entre a lateral leste e o gol norte. Boa relação entre preço e visibilidade.',
  },
  {
    id: 'norte-inf', name: 'Norte Inferior', code: 'NI', tier: 'lower', side: 'Norte', kind: 'standard',
    base: 95, range: rng(6),
    blurb: 'Atrás do gol norte. Perto da ação nas finalizações e cobranças de pênalti.',
  },
  {
    id: 'canto-no', name: 'Canto Noroeste', code: 'CNO', tier: 'lower', side: 'Noroeste', kind: 'standard',
    base: 120, range: rng(7),
    blurb: 'Curva entre o gol norte e a tribuna principal, próximo ao túnel de acesso dos jogadores.',
  },
  // ── Box level ────────────────────────────────────────────────
  {
    id: 'camarotes', name: 'Camarotes Oeste', code: 'CAM', tier: 'box', side: 'Oeste', kind: 'vip',
    base: 980, range: rng(0, 0.12, 0.88),
    blurb: 'Camarotes climatizados entre os anéis, com varanda privativa, buffet e serviço de bar incluídos.',
  },
  // ── Upper tier ───────────────────────────────────────────────
  {
    id: 'oeste-sup', name: 'Oeste Superior', code: 'OS', tier: 'upper', side: 'Oeste', kind: 'standard',
    base: 140, range: [mid(7) - PERIMETER, mid(1)],
    blurb: 'Anel superior da tribuna principal. Visão tática completa, coberta pelo teto.',
  },
  {
    id: 'sul-sup', name: 'Sul Superior', code: 'SS', tier: 'upper', side: 'Sul', kind: 'standard',
    base: 70, range: [mid(1), mid(3)],
    blurb: 'Anel superior atrás do gol sul. Panorama do estádio inteiro pelo menor preço.',
  },
  {
    id: 'leste-sup', name: 'Leste Superior', code: 'LS', tier: 'upper', side: 'Leste', kind: 'standard',
    base: 115, range: [mid(3), mid(5)],
    blurb: 'Anel superior da lateral leste. Visão elevada, semelhante à transmissão de TV.',
  },
  {
    id: 'norte-sup', name: 'Norte Superior', code: 'NS', tier: 'upper', side: 'Norte', kind: 'standard',
    base: 70, range: [mid(5), mid(7)],
    blurb: 'Anel superior atrás do gol norte. Vista panorâmica e acesso rápido às saídas.',
  },
];

export const SECTOR_BY_ID = Object.fromEntries(SECTORS.map((s) => [s.id, s]));

// ─────────────────────────────────────────────────────────────────
// Seat layout (shared by the 3D scene and the seat picker)
// ─────────────────────────────────────────────────────────────────
const SPACING = 0.95;
const cache = new Map();

function rowsFor(sector) {
  if (sector.tier === 'box') {
    return [
      { d: LOWER.dEnd + 1.3, h: LOWER.hEnd + 1.15 },
      { d: LOWER.dEnd + 2.4, h: LOWER.hEnd + 1.15 },
    ];
  }
  return rowPositions(sector.tier);
}

/** Returns rows -> seats, each seat with position (x, y, z) and facing angle. */
export function seatLayout(sector) {
  if (cache.has(sector.id)) return cache.get(sector.id);
  const [s0, s1] = sector.range;
  const samples = sampleRange(s0, s1, 1.2);
  const rows = rowsFor(sector).map(({ d, h }) => {
    // offset polyline for this row
    const pts = samples.map((s) => {
      const e = edgeAt(s);
      return { s, x: e.x + e.nx * d, z: e.z + e.nz * d };
    });
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
    }
    const total = cum[cum.length - 1];
    const margin = 0.7;
    const count = Math.max(0, Math.floor((total - margin * 2) / SPACING) + 1);
    const used = (count - 1) * SPACING;
    const start = (total - used) / 2;
    const seats = [];
    let k = 1;
    for (let i = 0; i < count; i++) {
      const L = start + i * SPACING;
      while (k < cum.length - 1 && cum[k] < L) k++;
      const t = (L - cum[k - 1]) / (cum[k] - cum[k - 1] || 1);
      const s = pts[k - 1].s + (pts[k].s - pts[k - 1].s) * t;
      const e = edgeAt(s);
      seats.push({
        x: e.x + e.nx * d,
        y: h,
        z: e.z + e.nz * d,
        rot: Math.atan2(e.nx, e.nz),
      });
    }
    return { d, h, seats };
  });
  const capacity = rows.reduce((n, r) => n + r.seats.length, 0);
  const result = { rows, capacity };
  cache.set(sector.id, result);
  return result;
}

/** A representative seat (middle of the sector, middle row) for the field-view camera. */
export function viewpoint(sector) {
  const [s0, s1] = sector.range;
  const s = (s0 + s1) / 2;
  const e = edgeAt(s);
  const rows = rowsFor(sector);
  const r = rows[Math.floor(rows.length * 0.45)];
  return {
    eye: [e.x + e.nx * r.d, r.h + 1.25, e.z + e.nz * r.d],
    normal: [e.nx, e.nz],
    edge: [e.x, e.z],
    row: r,
  };
}

/** Where the overview camera should fly to frame a sector. */
export function framing(sector) {
  const [s0, s1] = sector.range;
  const s = (s0 + s1) / 2;
  const e = edgeAt(s);
  const span = Math.min(90, s1 - s0);
  const rows = rowsFor(sector);
  const r = rows[Math.floor(rows.length / 2)];
  const target = [e.x + e.nx * r.d, r.h, e.z + e.nz * r.d];
  const back = 22 + span * 0.55;
  const position = [
    target[0] - e.nx * back,
    r.h + 20 + span * 0.22,
    target[2] - e.nz * back,
  ];
  return { position, target };
}

export const ROW_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
