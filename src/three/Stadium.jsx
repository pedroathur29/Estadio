import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  PERIMETER, LOWER, UPPER, OUTER_D, ROOF_H, HX, HZ,
  lowerProfile, upperProfile,
} from '../lib/geometry';
import { SECTORS, seatLayout } from '../data/sectors';
import { sectorStatus } from '../data/matches';
import { useStore } from '../store';
import { prefersReducedMotion } from '../lib/motion';
import { sweepProfile, makeSeatGeometry, makeFarSeatGeometry, ringPlacements } from './builders';
import { makePitchTexture, makeRibbonTexture, makeLabelTexture, FIELD_W, FIELD_D } from './textures';

export const PALETTE = {
  available: new THREE.Color('#3f74e0'),
  vip: new THREE.Color('#d8b05a'),
  hover: new THREE.Color('#9cc0ff'),
  selected: new THREE.Color('#c8ff2e'),
  unavailable: new THREE.Color('#2b2f38'),
  concrete: new THREE.Color('#5a606c'),
  concreteUpper: new THREE.Color('#646a77'),
};

const noRaycast = () => null;

/** Opacity of a box window when the camera looks out from behind it. */
export const CLEAR_GLASS = 0.06;

// ─────────────────────────────────────────────────────────────────
// Sector: stepped concrete + instanced seats, selectable
// ─────────────────────────────────────────────────────────────────
function Sector({ sector, matchId, interactive, seatGeo, fullSeatGeo }) {
  // boolean selectors: a sector re-renders only when its own state changes
  const isSelected = useStore((s) => s.sectorId === sector.id);
  const isHovered = useStore((s) => s.hoveredId === sector.id && s.sectorId !== sector.id);
  const dimOthers = useStore((s) => !!s.sectorId && s.sectorId !== sector.id);
  // seat view from a box: its own window sits between the camera and the pitch
  const lookingThrough = useStore((s) => sector.tier === 'box' && s.cameraMode === 'pov' && s.sectorId === sector.id);
  const status = sectorStatus(matchId, sector.id);
  const layout = seatLayout(sector);
  const seatsRef = useRef();
  const standMat = useRef();
  const seatMat = useRef();

  const standGeo = useMemo(() => {
    const [s0, s1] = sector.range;
    if (sector.tier === 'box') {
      const glass = [
        [LOWER.dEnd + 0.45, LOWER.hEnd + 0.9],
        [LOWER.dEnd + 0.45, UPPER.h0 - 1.2],
      ];
      return sweepProfile(glass, s0, s1);
    }
    return sweepProfile(sector.tier === 'upper' ? upperProfile() : lowerProfile(), s0, s1);
  }, [sector]);

  useLayoutEffect(() => {
    const mesh = seatsRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const scale = new THREE.Vector3(1, 1, 1);
    let i = 0;
    for (const row of layout.rows) {
      for (const seat of row.seats) {
        q.setFromAxisAngle(up, seat.rot);
        m.compose(new THREE.Vector3(seat.x, seat.y, seat.z), q, scale);
        mesh.setMatrixAt(i++, m);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [layout]);

  const base = status.soldOut ? PALETTE.unavailable : sector.kind === 'vip' ? PALETTE.vip : PALETTE.available;

  const targetSeat = useMemo(() => new THREE.Color(), []);
  const targetEmissive = useMemo(() => new THREE.Color(), []);
  const targetStandEm = useMemo(() => new THREE.Color(), []);

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 9);
    if (isSelected) {
      targetSeat.copy(PALETTE.selected);
      targetEmissive.copy(PALETTE.selected).multiplyScalar(0.55);
      targetStandEm.copy(PALETTE.selected).multiplyScalar(0.12);
    } else if (isHovered && interactive) {
      targetSeat.copy(status.soldOut ? PALETTE.unavailable : PALETTE.hover);
      targetEmissive.copy(status.soldOut ? PALETTE.unavailable : PALETTE.hover).multiplyScalar(status.soldOut ? 0.1 : 0.35);
      targetStandEm.setRGB(0.05, 0.07, 0.1);
    } else {
      targetSeat.copy(base);
      if (dimOthers) targetSeat.lerp(PALETTE.unavailable, 0.45);
      targetEmissive.copy(base).multiplyScalar(status.soldOut ? 0 : 0.08);
      targetStandEm.setRGB(0, 0, 0);
    }
    if (seatMat.current) {
      seatMat.current.color.lerp(targetSeat, k);
      seatMat.current.emissive.lerp(targetEmissive, k);
    }
    if (standMat.current) {
      if (sector.tier === 'box') {
        const glassEm = isSelected ? PALETTE.selected : isHovered ? PALETTE.hover : status.soldOut ? PALETTE.unavailable : PALETTE.vip;
        targetStandEm.copy(glassEm).multiplyScalar(isSelected ? 0.8 : status.soldOut ? 0.15 : 0.45);
        if (lookingThrough) targetStandEm.setRGB(0, 0, 0);
      }
      standMat.current.emissive.lerp(targetStandEm, k);
    }
  });

  const handlers = interactive
    ? {
        onPointerOver: (e) => {
          e.stopPropagation();
          useStore.getState().setHovered(sector.id);
          document.body.style.cursor = 'pointer';
        },
        onPointerOut: () => {
          if (useStore.getState().hoveredId === sector.id) useStore.getState().setHovered(null);
          document.body.style.cursor = '';
        },
        onClick: (e) => {
          e.stopPropagation();
          if (e.delta > 6) return; // was a drag
          useStore.getState().selectSector(sector.id);
        },
      }
    : { raycast: noRaycast };

  return (
    <group>
      <mesh geometry={standGeo} userData={sector.tier === 'box' ? { windowOf: sector.id } : {}} {...handlers}>
        {sector.tier === 'box' ? (
          <meshStandardMaterial
            ref={standMat}
            color="#1a1f2a"
            roughness={0.1}
            metalness={0.6}
            transparent
            opacity={lookingThrough ? CLEAR_GLASS : 0.88}
            depthWrite={!lookingThrough}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshStandardMaterial
            ref={standMat}
            color={sector.tier === 'upper' ? PALETTE.concreteUpper : PALETTE.concrete}
            roughness={0.92}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>
      {layout.capacity > 0 && (
        <instancedMesh
          ref={seatsRef}
          args={[fullSeatGeo, undefined, layout.capacity]}
          geometry={seatGeo}
          userData={{ fullGeometry: fullSeatGeo }}
          raycast={noRaycast}
        >
          <meshLambertMaterial ref={seatMat} color={base} />
        </instancedMesh>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────
// Pitch, goals, dugouts
// ─────────────────────────────────────────────────────────────────
function Pitch() {
  const { gl } = useThree();
  const tex = useMemo(() => makePitchTexture(gl.capabilities.getMaxAnisotropy()), [gl]);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02} raycast={noRaycast}>
        <planeGeometry args={[FIELD_W, FIELD_D]} />
        <meshStandardMaterial map={tex} roughness={0.95} />
      </mesh>
      {[-1, 1].map((side) => (
        <Goal key={side} side={side} />
      ))}
      {[-1, 1].map((side) => (
        <Dugout key={side} x={side * 9} />
      ))}
      {[[-52.5, -34], [-52.5, 34], [52.5, -34], [52.5, 34]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.75, z]} raycast={noRaycast}>
          <cylinderGeometry args={[0.03, 0.03, 1.5, 6]} />
          <meshStandardMaterial color="#f5f5f5" emissive="#c8ff2e" emissiveIntensity={0.15} />
        </mesh>
      ))}
    </group>
  );
}

function Goal({ side }) {
  const x = side * 52.5;
  const depth = 2.0;
  const post = { color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.25 };
  return (
    <group position={[x, 0, 0]} raycast={noRaycast}>
      {[-3.66, 3.66].map((z) => (
        <mesh key={z} position={[0, 1.22, z]} raycast={noRaycast}>
          <boxGeometry args={[0.12, 2.44, 0.12]} />
          <meshStandardMaterial {...post} />
        </mesh>
      ))}
      <mesh position={[0, 2.44, 0]} raycast={noRaycast}>
        <boxGeometry args={[0.12, 0.12, 7.44]} />
        <meshStandardMaterial {...post} />
      </mesh>
      <mesh position={[side * depth * 0.5, 1.22, 0]} raycast={noRaycast}>
        <boxGeometry args={[depth, 2.44, 7.32]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.12} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Dugout({ x }) {
  return (
    <group position={[x, 0, HZ - 3.2]}>
      <mesh position={[0, 0.6, 0]} raycast={noRaycast}>
        <boxGeometry args={[11, 1.2, 1.4]} />
        <meshStandardMaterial color="#141a24" />
      </mesh>
      <mesh position={[0, 1.4, -0.1]} rotation-x={-0.2} raycast={noRaycast}>
        <boxGeometry args={[11.2, 0.06, 2]} />
        <meshStandardMaterial color="#9fc4ff" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────
// Structure: concourse, ribbon board, façade, roof
// ─────────────────────────────────────────────────────────────────
function Structure({ showRoof }) {
  const ribbonTex = useMemo(() => makeRibbonTexture(), []);
  const [, force] = useState(0);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    // redraw canvas textures once web fonts are ready
    document.fonts?.ready.then(() => {
      const fresh = makeRibbonTexture();
      ribbonTex.image = fresh.image;
      ribbonTex.needsUpdate = true;
      force((n) => n + 1);
      invalidate(); // needed when the canvas only renders on demand
    });
  }, [ribbonTex, invalidate]);

  const { camera } = useThree();
  const roofMat = useRef();
  useFrame((_, dt) => {
    if (!prefersReducedMotion()) ribbonTex.offset.x -= Math.min(dt, 0.1) * 0.035;
    // seen from under the roof, fade it and hide the trusses so the stands stay readable
    const above = camera.position.y > ROOF_H + 1.5;
    if (trussRef.current) trussRef.current.visible = above;
    if (roofMat.current) {
      const target = above ? 0.55 : 0.18;
      roofMat.current.opacity += (target - roofMat.current.opacity) * Math.min(1, Math.min(dt, 0.05) * 6);
    }
  });

  const geos = useMemo(() => {
    const full = [0, PERIMETER];
    const concourseFloor = sweepProfile(
      [[LOWER.dEnd + 0.4, LOWER.hEnd + 0.9], [OUTER_D, LOWER.hEnd + 0.9]],
      ...full,
    );
    const concourseWall = sweepProfile(
      [[LOWER.dEnd + 3.6, LOWER.hEnd + 0.9], [LOWER.dEnd + 3.6, UPPER.h0 - 1.6]],
      ...full,
    );
    const lowerConcourse = sweepProfile(
      [[LOWER.dEnd + 0.4, 0], [LOWER.dEnd + 0.4, LOWER.hEnd + 0.9]],
      ...full,
    );
    const outerWall = sweepProfile([[OUTER_D, 0], [OUTER_D, UPPER.h0 - 2.4]], ...full);
    const ribbon = sweepProfile(
      [[UPPER.d0 - 0.3, UPPER.h0 - 1.0], [UPPER.d0 - 0.3, UPPER.h0 - 0.12]],
      ...full,
      { uvScale: 64 },
    );
    const lowerRibbon = sweepProfile(
      [[LOWER.d0 - 0.3, 0.15], [LOWER.d0 - 0.3, 1.05]],
      ...full,
      { uvScale: 64 },
    );
    const roof = sweepProfile(
      [[2.5, ROOF_H], [OUTER_D + 1.8, ROOF_H + 1.6]],
      ...full,
      { arcStep: 1.2 },
    );
    const roofFascia = sweepProfile(
      [[2.5, ROOF_H - 1.1], [2.5, ROOF_H + 0.05]],
      ...full,
      { arcStep: 1.2 },
    );
    const roofTop = sweepProfile(
      [[OUTER_D + 1.8, ROOF_H + 1.6], [OUTER_D + 1.8, ROOF_H - 0.6]],
      ...full,
    );
    return { concourseFloor, concourseWall, lowerConcourse, outerWall, ribbon, lowerRibbon, roof, roofFascia, roofTop };
  }, []);

  // façade fins, roof trusses and floodlights (instanced)
  const fins = useMemo(() => ringPlacements(OUTER_D + 0.9, 2.4, 0, PERIMETER), []);
  const trusses = useMemo(() => ringPlacements(0, 9.5, 0, PERIMETER), []);
  const lamps = useMemo(() => ringPlacements(3.6, 4.2, 0, PERIMETER), []);
  const finRef = useRef();
  const trussRef = useRef();
  const lampRef = useRef();

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const one = new THREE.Vector3(1, 1, 1);
    const finH = ROOF_H + 1.2;
    fins.forEach((f, i) => {
      q.setFromAxisAngle(up, f.rot);
      m.compose(new THREE.Vector3(f.x, finH / 2, f.z), q, one);
      finRef.current.setMatrixAt(i, m);
    });
    finRef.current.instanceMatrix.needsUpdate = true;

    const trussLen = OUTER_D + 1.8 - 2.5;
    trusses.forEach((t, i) => {
      q.setFromAxisAngle(up, t.rot);
      // place at the middle of the roof depth, along the outward normal
      const nx = Math.sin(t.rot);
      const nz = Math.cos(t.rot);
      const dm = 2.5 + trussLen / 2;
      const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.atan2(1.6, trussLen));
      m.compose(new THREE.Vector3(t.x + nx * dm, ROOF_H + 1.35, t.z + nz * dm), q.clone().multiply(tilt), one);
      trussRef.current.setMatrixAt(i, m);
    });
    trussRef.current.instanceMatrix.needsUpdate = true;

    lamps.forEach((l, i) => {
      q.setFromAxisAngle(up, l.rot);
      m.compose(new THREE.Vector3(l.x, ROOF_H - 0.35, l.z), q, one);
      lampRef.current.setMatrixAt(i, m);
    });
    lampRef.current.instanceMatrix.needsUpdate = true;
  }, [fins, trusses, lamps]);

  const trussLen = OUTER_D + 1.8 - 2.5;

  return (
    <group>
      <mesh geometry={geos.concourseFloor} raycast={noRaycast}>
        <meshStandardMaterial color="#2a2f39" side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geos.concourseWall} raycast={noRaycast}>
        <meshStandardMaterial color="#1a1e27" emissive="#ffb35c" emissiveIntensity={0.06} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geos.lowerConcourse} raycast={noRaycast}>
        <meshStandardMaterial color="#232832" side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geos.outerWall} raycast={noRaycast}>
        <meshStandardMaterial color="#141a24" emissive="#ffcf99" emissiveIntensity={0.05} roughness={0.3} metalness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geos.ribbon} raycast={noRaycast}>
        <meshBasicMaterial map={ribbonTex} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geos.lowerRibbon} raycast={noRaycast}>
        <meshBasicMaterial map={ribbonTex} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      <instancedMesh ref={finRef} args={[undefined, undefined, fins.length]} raycast={noRaycast} frustumCulled={false}>
        <boxGeometry args={[0.38, ROOF_H + 1.2, 1.8]} />
        <meshStandardMaterial color="#d7dbe3" roughness={0.45} metalness={0.3} />
      </instancedMesh>

      <group visible={showRoof}>
        <mesh geometry={geos.roof} raycast={noRaycast}>
          <meshStandardMaterial
            ref={roofMat}
            color="#cfd5e0"
            roughness={0.35}
            metalness={0.2}
            transparent
            opacity={0.55}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh geometry={geos.roofFascia} raycast={noRaycast}>
          <meshStandardMaterial color="#e9edf3" emissive="#ffffff" emissiveIntensity={0.08} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={geos.roofTop} raycast={noRaycast}>
          <meshStandardMaterial color="#e9edf3" side={THREE.DoubleSide} />
        </mesh>
        <instancedMesh ref={trussRef} args={[undefined, undefined, trusses.length]} raycast={noRaycast} frustumCulled={false}>
          <boxGeometry args={[0.45, 0.7, trussLen]} />
          <meshStandardMaterial color="#eef1f6" roughness={0.5} metalness={0.4} />
        </instancedMesh>
        <instancedMesh ref={lampRef} args={[undefined, undefined, lamps.length]} raycast={noRaycast} frustumCulled={false}>
          <boxGeometry args={[1.8, 0.35, 0.9]} />
          <meshBasicMaterial color="#fffbea" toneMapped={false} />
        </instancedMesh>
      </group>
    </group>
  );
}

/**
 * The flat layers under the pitch sit only centimetres apart. Pushing the lower ones back in the
 * depth buffer (the higher the number, the lower the layer) keeps their order at any distance,
 * including the seat view, where the near plane has to be small.
 */
const underlay = (layer) => ({ polygonOffset: true, polygonOffsetFactor: layer, polygonOffsetUnits: layer * 4 });

function Ground() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02} raycast={noRaycast}>
        <circleGeometry args={[520, 64]} />
        <meshStandardMaterial color="#0a0d13" roughness={1} {...underlay(3)} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01} raycast={noRaycast}>
        <ringGeometry args={[95, 112, 96]} />
        <meshStandardMaterial color="#151a23" roughness={0.9} {...underlay(2)} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0} raycast={noRaycast}>
        <planeGeometry args={[HX * 2, HZ * 2]} />
        <meshStandardMaterial color="#1f5a2b" roughness={1} {...underlay(1)} />
      </mesh>
    </group>
  );
}

function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color('#0b1222') },
          bottom: { value: new THREE.Color('#05070c') },
        },
        vertexShader: `varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 bottom; varying float vY; void main(){ float t = smoothstep(-0.05, 0.6, vY); gl_FragColor = vec4(mix(bottom, top, t), 1.0); }`,
      }),
    [],
  );
  return (
    <mesh material={mat} raycast={noRaycast}>
      <sphereGeometry args={[900, 32, 16]} />
    </mesh>
  );
}

function CompassLabels() {
  const labels = useMemo(
    () => [
      { t: 'N', p: [-HX - 26, ROOF_H + 9, 0] },
      { t: 'S', p: [HX + 26, ROOF_H + 9, 0] },
      { t: 'L', p: [0, ROOF_H + 9, -HZ - 26] },
      { t: 'O', p: [0, ROOF_H + 9, HZ + 26] },
    ].map((l) => ({ ...l, tex: makeLabelTexture(l.t) })),
    [],
  );
  return labels.map((l) => (
    <sprite key={l.t} position={l.p} scale={[16, 8, 1]} raycast={noRaycast}>
      <spriteMaterial map={l.tex} transparent depthWrite={false} />
    </sprite>
  ));
}

export default function Stadium({ matchId, interactive = false }) {
  const roof = useStore((s) => s.roof);
  const cameraMode = useStore((s) => s.cameraMode);
  const fullSeatGeo = useMemo(() => makeSeatGeometry(), []);
  const farSeatGeo = useMemo(() => makeFarSeatGeometry(), []);
  // from far away (overview, home) a chair is a few pixels: draw the light version
  const [near, setNear] = useState(false);
  useFrame(({ camera, invalidate }) => {
    const distance = camera.position.length();
    if (near ? distance > 135 : distance < 115) {
      setNear(!near);
      invalidate();
    }
  });
  return (
    <group>
      <Sky />
      <hemisphereLight args={['#b8c8ff', '#10131a', 0.75]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[40, 120, 60]} intensity={2.1} color="#fff6e8" />
      <directionalLight position={[-60, 80, -40]} intensity={0.9} color="#cfe0ff" />
      <pointLight position={[0, ROOF_H, 0]} intensity={1800} distance={160} decay={1.6} color="#fff8ec" />
      <Ground />
      <Pitch />
      {SECTORS.map((s) => (
        <Sector key={s.id} sector={s} matchId={matchId} interactive={interactive} seatGeo={near ? fullSeatGeo : farSeatGeo} fullSeatGeo={fullSeatGeo} />
      ))}
      <Structure showRoof={interactive ? roof : true} />
      {interactive && cameraMode === 'overview' && <CompassLabels />}
    </group>
  );
}
