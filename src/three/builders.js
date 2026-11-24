import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { edgeAt, sampleRange } from '../lib/geometry';

/**
 * Sweeps a 2D cross-section profile (d outward, h up) along the bowl edge
 * between arc lengths s0 and s1. Produces flat-shaded, non-indexed triangles.
 */
export function sweepProfile(profile, s0, s1, { arcStep = 1.6, uvScale = 0 } = {}) {
  const samples = sampleRange(s0, s1, arcStep);
  const edges = samples.map((s) => edgeAt(s));
  const pos = [];
  const uv = [];
  for (let j = 0; j < samples.length - 1; j++) {
    const e0 = edges[j];
    const e1 = edges[j + 1];
    for (let k = 0; k < profile.length - 1; k++) {
      const [d0, h0] = profile[k];
      const [d1, h1] = profile[k + 1];
      const a = [e0.x + e0.nx * d0, h0, e0.z + e0.nz * d0];
      const b = [e1.x + e1.nx * d0, h0, e1.z + e1.nz * d0];
      const c = [e1.x + e1.nx * d1, h1, e1.z + e1.nz * d1];
      const d = [e0.x + e0.nx * d1, h1, e0.z + e0.nz * d1];
      pos.push(...a, ...b, ...c, ...a, ...c, ...d);
      if (uvScale) {
        const u0 = (samples[j] - s0) / uvScale;
        const u1 = (samples[j + 1] - s0) / uvScale;
        const v0 = k / (profile.length - 1);
        const v1 = (k + 1) / (profile.length - 1);
        uv.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (uvScale) geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return geo;
}

/** A small stadium chair, facing -Z (backrest at +Z). */
export function makeSeatGeometry() {
  const pan = new THREE.BoxGeometry(0.5, 0.09, 0.42);
  pan.translate(0, 0.44, -0.02);
  const back = new THREE.BoxGeometry(0.5, 0.46, 0.07);
  back.rotateX(-0.12);
  back.translate(0, 0.68, 0.19);
  const g = mergeGeometries([pan.toNonIndexed(), back.toNonIndexed()]);
  g.computeVertexNormals();
  return g;
}

/** Instance transforms for objects placed every `step` metres around the bowl. */
export function ringPlacements(d, step, s0 = 0, s1 = null) {
  const out = [];
  const end = s1 ?? s0 + 1e9;
  const samples = sampleRange(s0, Math.min(end, s0 + 10000), 0.8);
  const total = samples[samples.length - 1] - samples[0];
  const n = Math.floor(total / step);
  for (let i = 0; i < n; i++) {
    const s = s0 + (i + 0.5) * step;
    const e = edgeAt(s);
    out.push({ x: e.x + e.nx * d, z: e.z + e.nz * d, rot: Math.atan2(e.nx, e.nz) });
  }
  return out;
}
