// Parametric description of the stadium bowl.
// The inner edge of the stands is a rounded rectangle around the pitch.
// Any point of the bowl is described by (s, d, h):
//   s = arc length along the inner edge, d = outward offset, h = height.
// Long sides run along X (the pitch length), goal ends sit at ±X.

export const HX = 59.5; // half extent in X of the inner edge
export const HZ = 41; // half extent in Z
export const R = 14; // corner radius
const A = HX - R; // half length of the long straights
const B = HZ - R; // half length of the short straights
const ARC = (Math.PI / 2) * R;

// Segments walk clockwise when seen from above (+Y), starting on the West (+Z) side.
const SEGMENTS = [
  { type: 'line', from: [-A, HZ], to: [A, HZ], n: [0, 1] }, // 0 Oeste
  { type: 'arc', c: [A, B], a0: Math.PI / 2, a1: 0 }, // 1 canto Sudoeste
  { type: 'line', from: [HX, B], to: [HX, -B], n: [1, 0] }, // 2 Sul
  { type: 'arc', c: [A, -B], a0: 0, a1: -Math.PI / 2 }, // 3 canto Sudeste
  { type: 'line', from: [A, -HZ], to: [-A, -HZ], n: [0, -1] }, // 4 Leste
  { type: 'arc', c: [-A, -B], a0: -Math.PI / 2, a1: -Math.PI }, // 5 canto Nordeste
  { type: 'line', from: [-HX, -B], to: [-HX, B], n: [-1, 0] }, // 6 Norte
  { type: 'arc', c: [-A, B], a0: Math.PI, a1: Math.PI / 2 }, // 7 canto Noroeste
];

let acc = 0;
for (const seg of SEGMENTS) {
  seg.len = seg.type === 'line' ? Math.hypot(seg.to[0] - seg.from[0], seg.to[1] - seg.from[1]) : ARC;
  seg.s0 = acc;
  acc += seg.len;
  seg.s1 = acc;
}
export const PERIMETER = acc;

/** Global arc-length range for a fraction of one segment. */
export function segRange(index, f0 = 0, f1 = 1) {
  const seg = SEGMENTS[index];
  return [seg.s0 + seg.len * f0, seg.s0 + seg.len * f1];
}

function wrap(s) {
  return ((s % PERIMETER) + PERIMETER) % PERIMETER;
}

/** Point on the inner edge plus its outward normal. */
export function edgeAt(sRaw) {
  const s = wrap(sRaw);
  let seg = SEGMENTS[SEGMENTS.length - 1];
  for (const sg of SEGMENTS) {
    if (s >= sg.s0 && s <= sg.s1) {
      seg = sg;
      break;
    }
  }
  const t = (s - seg.s0) / seg.len;
  if (seg.type === 'line') {
    return {
      x: seg.from[0] + (seg.to[0] - seg.from[0]) * t,
      z: seg.from[1] + (seg.to[1] - seg.from[1]) * t,
      nx: seg.n[0],
      nz: seg.n[1],
    };
  }
  const a = seg.a0 + (seg.a1 - seg.a0) * t;
  const nx = Math.cos(a);
  const nz = Math.sin(a);
  return { x: seg.c[0] + nx * R, z: seg.c[1] + nz * R, nx, nz };
}

/** Sample positions along [s0, s1]: segment joints plus subdivided arcs. */
export function sampleRange(s0, s1, arcStep = 1.6) {
  const out = [s0];
  for (let k = -1; k <= 1; k++) {
    for (const seg of SEGMENTS) {
      const a = seg.s0 + k * PERIMETER;
      const b = seg.s1 + k * PERIMETER;
      const lo = Math.max(a, s0);
      const hi = Math.min(b, s1);
      if (hi <= lo) continue;
      if (seg.type === 'arc') {
        const n = Math.max(1, Math.ceil((hi - lo) / arcStep));
        for (let i = 0; i <= n; i++) out.push(lo + ((hi - lo) * i) / n);
      } else {
        out.push(lo, hi);
      }
    }
  }
  out.push(s1);
  out.sort((p, q) => p - q);
  const dedup = [];
  for (const v of out) {
    if (!dedup.length || v - dedup[dedup.length - 1] > 1e-4) dedup.push(v);
  }
  return dedup;
}

export function bowlPoint(s, d, h) {
  const e = edgeAt(s);
  return [e.x + e.nx * d, h, e.z + e.nz * d];
}

// ---------------------------------------------------------------------------
// Cross-section profiles of the two tiers
// ---------------------------------------------------------------------------
export const LOWER = {
  rows: 16,
  d0: 0.6,
  h0: 1.3,
  tread: 0.8,
  rise: 0.42,
};
LOWER.dEnd = LOWER.d0 + LOWER.rows * LOWER.tread;
LOWER.hEnd = LOWER.h0 + LOWER.rows * LOWER.rise;

export const UPPER = {
  rows: 18,
  d0: 12.4,
  h0: 12.6,
  tread: 0.85,
  rise: 0.56,
};
UPPER.dEnd = UPPER.d0 + UPPER.rows * UPPER.tread;
UPPER.hEnd = UPPER.h0 + UPPER.rows * UPPER.rise;

export const OUTER_D = UPPER.dEnd + 2.2; // façade line
export const ROOF_H = UPPER.hEnd + 4.8;

function steppedProfile(t) {
  const pts = [];
  pts.push([t.d0 - 0.25, t.h0 - 1.15]);
  pts.push([t.d0 - 0.25, t.h0]); // parapet top
  pts.push([t.d0, t.h0]);
  for (let i = 0; i < t.rows; i++) {
    const d = t.d0 + i * t.tread;
    const h = t.h0 + i * t.rise;
    if (i > 0) pts.push([d, h]);
    pts.push([d + t.tread, h]);
    pts.push([d + t.tread, h + t.rise]);
  }
  return pts;
}

export function lowerProfile() {
  const p = steppedProfile(LOWER);
  p[0] = [LOWER.d0 - 0.25, 0]; // pitch-side wall starts at ground level
  p.push([LOWER.dEnd, LOWER.hEnd + 0.9]); // back wall
  p.push([LOWER.dEnd + 0.4, LOWER.hEnd + 0.9]);
  return p;
}

export function upperProfile() {
  const p = steppedProfile(UPPER);
  p.push([UPPER.dEnd, UPPER.hEnd + 1.8]); // rear wall
  p.push([OUTER_D, UPPER.hEnd + 1.8]);
  p.push([OUTER_D, UPPER.h0 - 2.4]); // soffit back
  p.push([UPPER.d0 - 0.25, UPPER.h0 - 1.15]); // soffit (underside)
  return p;
}

/** Row centres (d, h) where seats are placed. */
export function rowPositions(tier) {
  const t = tier === 'upper' ? UPPER : LOWER;
  const rows = [];
  for (let i = 0; i < t.rows; i++) {
    rows.push({ d: t.d0 + i * t.tread + t.tread * 0.42, h: t.h0 + i * t.rise });
  }
  return rows;
}
