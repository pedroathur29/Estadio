// Layer drawn over one sector of the stadium to choose seats: one clickable chair per seat,
// coloured by occupancy, plus a seated figure and a tag on each chosen seat.
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SECTOR_BY_ID, seatLayout } from '../data/sectors';
import { useOccupancy, seatInfo } from '../lib/useSeatPlan';
import { useStore } from '../store';
import { makeSeatGeometry } from './builders';
import { makeLabelTexture } from './textures';
import { PALETTE } from './Stadium';

export const SEAT_COLORS = {
  taken: new THREE.Color('#9097a3'),
  mine: new THREE.Color('#16a06a'),
  hover: new THREE.Color('#ffffff'),
};

const noRaycast = () => null;
const UP = new THREE.Vector3(0, 1, 0);

/** Figure sitting on a chosen seat, with the seat code floating above it. */
function Chosen({ seat, code, hidden, raised }) {
  const tag = useMemo(() => makeLabelTexture(code), [code]);
  useEffect(() => () => tag.dispose(), [tag]);
  if (hidden) return null;
  return (
    <group position={[seat.x, seat.y, seat.z]}>
      <mesh position={[0, 0.88, 0]} raycast={noRaycast}>
        <capsuleGeometry args={[0.17, 0.32, 4, 10]} />
        <meshBasicMaterial color={PALETTE.selected} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.34, 0]} raycast={noRaycast}>
        <sphereGeometry args={[0.15, 14, 10]} />
        <meshBasicMaterial color={PALETTE.selected} toneMapped={false} />
      </mesh>
      {/* every other tag sits higher, so the codes of neighbouring seats stay readable */}
      <sprite position={[0, raised ? 3.15 : 2.25, 0]} scale={[1.7, 0.85, 1]} raycast={noRaycast} renderOrder={5}>
        <spriteMaterial map={tag} transparent depthTest={false} />
      </sprite>
    </group>
  );
}

export default function SeatPicker({ matchId, sectorId }) {
  const sector = SECTOR_BY_ID[sectorId];
  const layout = seatLayout(sector);
  const { mine, taken } = useOccupancy(matchId, sectorId);
  const seats = useStore((s) => s.seats);
  const hover = useStore((s) => s.hoverSeat);
  const povSeat = useStore((s) => (s.cameraMode === 'pov' ? s.povSeat : null));
  const invalidate = useThree((s) => s.invalidate);
  const chairs = useRef();
  const hits = useRef();
  const geometry = useMemo(() => makeSeatGeometry(), []);

  // flat list, so an instance id maps back to its row and position
  const list = useMemo(
    () => layout.rows.flatMap((row, r) => row.seats.map((seat, i) => ({ ...seat, r, i, key: `${r}-${i}` }))),
    [layout],
  );

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const size = new THREE.Vector3(1.18, 1.08, 1.1);
    const one = new THREE.Vector3(1, 1, 1);
    list.forEach((seat, n) => {
      q.setFromAxisAngle(UP, seat.rot);
      m.compose(new THREE.Vector3(seat.x, seat.y, seat.z), q, size);
      chairs.current.setMatrixAt(n, m);
      m.compose(new THREE.Vector3(seat.x, seat.y + 0.58, seat.z), q, one);
      hits.current.setMatrixAt(n, m);
    });
    chairs.current.instanceMatrix.needsUpdate = true;
    hits.current.instanceMatrix.needsUpdate = true;
    chairs.current.computeBoundingSphere();
    hits.current.computeBoundingSphere();
  }, [list]);

  useLayoutEffect(() => {
    const chosen = new Set(seats.map((s) => s.key));
    const free = sector.kind === 'vip' ? PALETTE.vip : PALETTE.available;
    list.forEach((seat, n) => {
      let color = free;
      if (mine.has(seat.key)) color = SEAT_COLORS.mine;
      else if (taken.has(seat.key)) color = SEAT_COLORS.taken;
      else if (chosen.has(seat.key)) color = PALETTE.selected;
      else if (hover === seat.key) color = SEAT_COLORS.hover;
      chairs.current.setColorAt(n, color);
    });
    chairs.current.instanceColor.needsUpdate = true;
    invalidate();
  }, [list, seats, hover, taken, mine, sector, invalidate]);

  useEffect(
    () => () => {
      useStore.getState().setHoverSeat(null);
      document.body.style.cursor = '';
    },
    [],
  );

  const picking = () => useStore.getState().cameraMode !== 'pov';

  return (
    <group>
      <instancedMesh ref={chairs} args={[geometry, undefined, list.length]} raycast={noRaycast}>
        <meshLambertMaterial />
      </instancedMesh>
      {/* invisible boxes: an easier target than the thin chair, without gaps between neighbours */}
      <instancedMesh
        ref={hits}
        args={[undefined, undefined, list.length]}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (!picking()) return;
          const seat = list[e.instanceId];
          useStore.getState().setHoverSeat(seat.key);
          document.body.style.cursor = taken.has(seat.key) ? 'not-allowed' : 'pointer';
        }}
        onPointerOut={() => {
          useStore.getState().setHoverSeat(null);
          document.body.style.cursor = '';
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta > 8 || !picking()) return; // was a drag
          const seat = list[e.instanceId];
          if (!taken.has(seat.key)) useStore.getState().toggleSeat(seatInfo(seat.r, seat.i));
        }}
      >
        <boxGeometry args={[0.92, 0.55, 0.55]} />
        <meshBasicMaterial visible={false} />
      </instancedMesh>
      {seats.map((s) => {
        const [r, i] = s.key.split('-').map(Number);
        const seat = layout.rows[r]?.seats[i];
        return seat ? <Chosen key={s.key} seat={seat} code={`${s.row}${s.num}`} hidden={povSeat === s.key} raised={i % 2 === 1} /> : null;
      })}
    </group>
  );
}
