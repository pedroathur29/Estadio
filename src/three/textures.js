import * as THREE from 'three';
import { HX, HZ } from '../lib/geometry';

export const FIELD_W = HX * 2 - 1.2; // grass surface including run-off
export const FIELD_D = HZ * 2 - 1.2;

function makeGrainTile(size = 256) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14; // brightness shift, mostly on the green channel
    const light = n > 0;
    img.data[i] = light ? 110 : 0;
    img.data[i + 1] = light ? 255 : 0;
    img.data[i + 2] = light ? 100 : 0;
    img.data[i + 3] = Math.round((Math.abs(n) / (light ? 130 : 124)) * 255);
  }
  g.putImageData(img, 0, 0);
  return c;
}

export function makePitchTexture(maxAniso = 8) {
  const W = 2048;
  const k = W / FIELD_W;
  const H = Math.round(FIELD_D * k);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');

  // mowing stripes
  const stripes = 20;
  const sw = W / stripes;
  for (let i = 0; i < stripes; i++) {
    g.fillStyle = i % 2 ? '#2c7a3a' : '#327f40';
    g.fillRect(i * sw, 0, sw + 1, H);
  }
  // subtle grain: one small noise tile repeated, instead of rewriting millions of pixels
  g.fillStyle = g.createPattern(makeGrainTile(), 'repeat');
  g.fillRect(0, 0, W, H);

  const ox = (FIELD_W - 105) / 2;
  const oz = (FIELD_D - 68) / 2;
  const X = (m) => (ox + m) * k;
  const Z = (m) => (oz + m) * k;
  g.strokeStyle = 'rgba(245,248,240,0.92)';
  g.fillStyle = 'rgba(245,248,240,0.92)';
  g.lineWidth = 0.14 * k;

  g.strokeRect(X(0), Z(0), 105 * k, 68 * k);
  g.beginPath();
  g.moveTo(X(52.5), Z(0));
  g.lineTo(X(52.5), Z(68));
  g.stroke();
  const circle = (x, z, r, a0 = 0, a1 = Math.PI * 2) => {
    g.beginPath();
    g.arc(X(x), Z(z), r * k, a0, a1);
    g.stroke();
  };
  const spot = (x, z) => {
    g.beginPath();
    g.arc(X(x), Z(z), 0.22 * k, 0, Math.PI * 2);
    g.fill();
  };
  circle(52.5, 34, 9.15);
  spot(52.5, 34);
  for (const side of [0, 1]) {
    const dir = side ? -1 : 1;
    const gx = side ? 105 : 0;
    // penalty area
    g.strokeRect(X(side ? 105 - 16.5 : 0), Z(34 - 20.16), 16.5 * k, 40.32 * k);
    // goal area
    g.strokeRect(X(side ? 105 - 5.5 : 0), Z(34 - 9.16), 5.5 * k, 18.32 * k);
    spot(gx + dir * 11, 34);
    // penalty arc (outside the box)
    const a = Math.acos(5.5 / 9.15);
    if (side) circle(105 - 11, 34, 9.15, Math.PI - a, Math.PI + a);
    else circle(11, 34, 9.15, -a, a);
    // corner arcs
    circle(gx, 0, 1, side ? Math.PI / 2 : 0, side ? Math.PI : Math.PI / 2);
    circle(gx, 68, 1, side ? Math.PI : -Math.PI / 2, side ? Math.PI * 1.5 : 0);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

export function makeRibbonTexture() {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#05070b';
  g.fillRect(0, 0, c.width, c.height);
  const items = [
    ['ARENA PASS', '#c8ff2e'],
    ['ARENA HORIZONTE', '#ffffff'],
    ['INGRESSO DIGITAL', '#7fb2ff'],
    ['DEMONSTRAÇÃO', '#c8ff2e'],
    ['VALE DO SOL', '#ffffff'],
  ];
  g.font = '700 38px "Barlow Condensed", "Arial Narrow", sans-serif';
  g.textBaseline = 'middle';
  const slot = c.width / items.length;
  items.forEach(([t, col], i) => {
    g.fillStyle = col;
    const w = g.measureText(t).width;
    g.fillText(t, i * slot + (slot - w) / 2, 34);
    g.fillStyle = 'rgba(255,255,255,0.25)';
    g.fillRect(i * slot, 10, 2, 44);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(-1, 1); // text reads left-to-right when seen from the pitch
  return tex;
}

export function makeLabelTexture(text, color = '#c8ff2e') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(7,9,15,0.72)';
  const r = 28;
  g.beginPath();
  g.roundRect(8, 8, 240, 112, r);
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.18)';
  g.lineWidth = 3;
  g.stroke();
  g.fillStyle = color;
  g.font = '800 64px "Barlow Condensed", "Arial Narrow", sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 128, 68);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
