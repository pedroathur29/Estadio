import { Suspense, memo, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Stadium from './Stadium';
import { useStore } from '../store';
import { SECTOR_BY_ID, framing, viewpoint } from '../data/sectors';

const glProps = { antialias: true, powerPreference: 'high-performance' };

function overviewGoal(aspect) {
  // pull back further on narrow / portrait screens
  if (aspect < 0.8) {
    // portrait: look along the pitch so the long axis runs up the screen
    const f = Math.min(1.25, 0.6 / aspect);
    return { position: [175 * f, 255 * f, 0], target: [-6, 0, 0] };
  }
  const f = aspect < 1 ? 1.45 : aspect < 1.4 ? 1.2 : 1;
  return { position: [0, 105 * f, 150 * f], target: [0, 2, 0] };
}

function CameraRig() {
  const { camera, controls, size } = useThree();
  const cameraMode = useStore((s) => s.cameraMode);
  const sectorId = useStore((s) => s.sectorId);
  const resetTick = useStore((s) => s.resetTick);
  const zoomTick = useStore((s) => s.zoomTick);
  const goal = useRef({
    pos: new THREE.Vector3(),
    target: new THREE.Vector3(),
    fov: 42,
    active: false,
  });
  const lastFrame = useRef(Date.now());

  // Configure OrbitControls for each mode
  const configure = (mode, flying) => {
    if (!controls) return;
    controls.enablePan = mode !== 'pov';
    controls.enableZoom = mode !== 'pov';
    controls.rotateSpeed = mode === 'pov' ? -0.32 : 0.6;
    if (flying) {
      controls.minDistance = 0;
      controls.maxDistance = Infinity;
      controls.minPolarAngle = 0;
      controls.maxPolarAngle = Math.PI;
    } else if (mode === 'pov') {
      const d = camera.position.distanceTo(controls.target);
      controls.minDistance = d;
      controls.maxDistance = d;
      controls.minPolarAngle = Math.PI * 0.22;
      controls.maxPolarAngle = Math.PI * 0.6;
    } else {
      controls.minDistance = 18;
      controls.maxDistance = 360;
      controls.minPolarAngle = 0.05;
      controls.maxPolarAngle = Math.PI / 2 - 0.04;
    }
  };

  const flyTo = (position, target, fov) => {
    const g = goal.current;
    g.pos.set(...position);
    g.target.set(...target);
    g.fov = fov;
    g.active = true;
    configure(useStore.getState().cameraMode, true);
  };

  useEffect(() => {
    const sector = sectorId ? SECTOR_BY_ID[sectorId] : null;
    if (cameraMode === 'pov' && sector) {
      const vp = viewpoint(sector);
      const eye = new THREE.Vector3(...vp.eye);
      const dir = new THREE.Vector3(0, 0, 0).sub(eye).normalize();
      const target = eye.clone().add(dir.multiplyScalar(0.6));
      flyTo(vp.eye, target.toArray(), 62);
    } else if (cameraMode === 'sector' && sector) {
      const f = framing(sector);
      const aspectBoost = size.width / size.height < 1 ? 1.6 : 1;
      const t = new THREE.Vector3(...f.target);
      const p = new THREE.Vector3(...f.position).sub(t).multiplyScalar(aspectBoost).add(t);
      flyTo(p.toArray(), f.target, 42);
    } else {
      const o = overviewGoal(size.width / size.height);
      flyTo(o.position, o.target, 42);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraMode, sectorId, resetTick, controls]);

  // keep the subject clear of the side panel (desktop) or bottom sheet (mobile)
  const shift = useRef({ x: 0, y: 0 });
  const shiftGoal = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const panelOpen = sectorId && cameraMode === 'sector';
    const mobile = size.width <= 860;
    shiftGoal.current = panelOpen
      ? mobile
        ? { x: 0, y: size.height * 0.26 }
        : { x: Math.min(200, size.width * 0.2), y: 0 }
      : { x: 0, y: 0 };
  }, [sectorId, cameraMode, size]);

  // zoom buttons
  useEffect(() => {
    if (!zoomTick.n || !controls) return;
    const mode = useStore.getState().cameraMode;
    if (mode === 'pov') {
      goal.current.fov = THREE.MathUtils.clamp(camera.fov + (zoomTick.dir > 0 ? -10 : 10), 30, 80);
      goal.current.pos.copy(camera.position);
      goal.current.target.copy(controls.target);
      goal.current.active = true;
      return;
    }
    const offset = camera.position.clone().sub(controls.target);
    const len = THREE.MathUtils.clamp(offset.length() * (zoomTick.dir > 0 ? 0.72 : 1.38), 18, 360);
    offset.setLength(len);
    goal.current.pos.copy(controls.target).add(offset);
    goal.current.target.copy(controls.target);
    goal.current.fov = camera.fov;
    goal.current.active = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomTick]);

  // user takes over → stop the automatic flight (except while entering the seat view)
  useEffect(() => {
    if (!controls) return;
    const onStart = () => {
      if (useStore.getState().cameraMode !== 'pov' && goal.current.active) {
        goal.current.active = false;
        configure(useStore.getState().cameraMode, false);
      }
    };
    controls.addEventListener('start', onStart);
    return () => controls.removeEventListener('start', onStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls]);

  useFrame((_, dt) => {
    lastFrame.current = Date.now();
    const s = shift.current;
    const sg = shiftGoal.current;
    if (Math.abs(s.x - sg.x) > 0.5 || Math.abs(s.y - sg.y) > 0.5 || camera.view?.enabled) {
      const ks = 1 - Math.exp(-Math.min(dt, 0.05) * 4);
      s.x += (sg.x - s.x) * ks;
      s.y += (sg.y - s.y) * ks;
      if (Math.abs(s.x) < 0.5 && Math.abs(s.y) < 0.5 && sg.x === 0 && sg.y === 0) {
        s.x = 0;
        s.y = 0;
        camera.clearViewOffset();
      } else {
        camera.setViewOffset(size.width, size.height, s.x, s.y, size.width, size.height);
      }
    }
    const g = goal.current;
    if (!g.active || !controls) return;
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 3.4);
    camera.position.lerp(g.pos, k);
    controls.target.lerp(g.target, k);
    camera.fov += (g.fov - camera.fov) * k;
    camera.updateProjectionMatrix();
    if (camera.position.distanceTo(g.pos) < 0.03 && controls.target.distanceTo(g.target) < 0.03 && Math.abs(camera.fov - g.fov) < 0.05) {
      camera.position.copy(g.pos);
      controls.target.copy(g.target);
      g.active = false;
      configure(useStore.getState().cameraMode, false);
    }
  });

  return null;
}

/** Renders the field view of a sector into a still image (shown in the side panel). */
function ViewCapture() {
  const { gl, scene, size } = useThree();
  const cam = useMemo(() => new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 2000), []);
  const wait = useRef(0);

  useFrame(() => {
    const id = useStore.getState().captureId;
    if (!id) {
      wait.current = 0;
      return;
    }
    // give the highlight colours a few frames to settle
    if (wait.current++ < 12) return;
    wait.current = 0;
    const vp = viewpoint(SECTOR_BY_ID[id]);
    cam.position.set(...vp.eye);
    cam.lookAt(vp.edge[0] * 0.15, 0, vp.edge[1] * 0.15);
    cam.updateMatrixWorld();

    const W = size.width;
    const H = size.height;
    let vw = W;
    let vh = (W * 9) / 16;
    if (vh > H) {
      vh = H;
      vw = (H * 16) / 9;
    }
    gl.setViewport(0, H - vh, vw, vh);
    gl.setScissor(0, H - vh, vw, vh);
    gl.setScissorTest(true);
    gl.render(scene, cam);
    const dpr = gl.getPixelRatio();
    const out = document.createElement('canvas');
    out.width = 640;
    out.height = 360;
    out.getContext('2d').drawImage(gl.domElement, 0, 0, vw * dpr, vh * dpr, 0, 0, 640, 360);
    gl.setScissorTest(false);
    gl.setViewport(0, 0, W, H);
    try {
      useStore.getState().storeShot(id, out.toDataURL('image/jpeg', 0.84));
    } catch {
      useStore.getState().storeShot(id, null);
    }
  });
  return null;
}

export const ExplorerCanvas = memo(function ExplorerCanvas({ matchId }) {
  return (
    <Canvas
      gl={glProps}
      dpr={[1, 1.75]}
      camera={{ position: [0, 220, 300], fov: 42, near: 0.1, far: 2500 }}
      onPointerMissed={(e) => {
        if (e.type === 'click') useStore.getState().setHovered(null);
      }}
    >
      <fog attach="fog" args={['#06080d', 320, 900]} />
      <Suspense fallback={null}>
        <Stadium matchId={matchId} interactive />
      </Suspense>
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      <CameraRig />
      <ViewCapture />
    </Canvas>
  );
});

function HeroOrbit() {
  const { camera, size } = useThree();
  const t = useRef(0.6);
  useFrame((_, dt) => {
    t.current += Math.min(dt, 0.05) * 0.06;
    const portrait = size.width / size.height < 1;
    const r = portrait ? 260 : 175;
    camera.position.set(Math.cos(t.current) * r, portrait ? 120 : 78, Math.sin(t.current) * r);
    camera.lookAt(0, portrait ? 0 : 8, 0);
  });
  return null;
}

export function HeroCanvas({ matchId }) {
  return (
    <Canvas gl={glProps} dpr={[1, 1.5]} camera={{ position: [150, 80, 150], fov: 38, near: 0.5, far: 2500 }}>
      <fog attach="fog" args={['#06080d', 260, 800]} />
      <Suspense fallback={null}>
        <Stadium matchId={matchId} />
      </Suspense>
      <HeroOrbit />
    </Canvas>
  );
}
